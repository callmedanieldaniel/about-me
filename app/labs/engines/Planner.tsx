"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, palette } from "../stage";
import type { EngineProps } from "../types";

type Traj = { pts: THREE.Vector3[]; cost: number; collide: boolean; dz: number; vT: number; ttc: number };

const H = 4; // horizon s
const N = 24; // samples

export default function Planner({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [-16, 11, 15], target: [14, 0, 0], grid: 0, fov: 48 });
    if (!stage) return;
    const { scene, camera, controls } = stage;

    const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 11), new THREE.MeshStandardMaterial({ color: 0x0c1420, roughness: 1 }));
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0x2a3b55 });
    const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.12), dashMat, 140);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 140; i++) {
      const z = i % 2 === 0 ? -1.75 : 1.75;
      m4.makeRotationX(-Math.PI / 2);
      m4.setPosition(-200 + Math.floor(i / 2) * 6, 0.01, z);
      dashes.setMatrixAt(i, m4);
    }
    scene.add(dashes);
    [-5.5, 5.5].forEach((z) => {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.15), new THREE.MeshBasicMaterial({ color: 0x3b5070 }));
      e.rotation.x = -Math.PI / 2;
      e.position.set(0, 0.01, z);
      scene.add(e);
    });

    const car = (color: number) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 1.9), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }));
      body.position.y = 0.8;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.6), new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.2, metalness: 0.6 }));
      cabin.position.set(-0.2, 1.7, 0);
      g.add(body, cabin);
      return g;
    };
    const ego = car(palette.live);
    const other = car(palette.ref);
    scene.add(ego, other);

    const candGroup = new THREE.Group();
    scene.add(candGroup);
    const pathMatOk = new THREE.LineBasicMaterial({ color: 0x6b83a6, transparent: true, opacity: 0.7 });
    const pathMatBad = new THREE.LineBasicMaterial({ color: palette.bad, transparent: true, opacity: 0.5 });
    const selMat = new THREE.LineBasicMaterial({ color: palette.ok, linewidth: 2 });
    const selLine = new THREE.Line(new THREE.BufferGeometry(), selMat);
    scene.add(selLine);
    const predLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: palette.ref, dashSize: 0.8, gapSize: 0.5, transparent: true, opacity: 0.7 }),
    );
    scene.add(predLine);

    // Scenario state (world coords, x forward, z lateral)
    let t = 0;
    let egoX = 0, egoZ = 0, egoV = kmh(Number(p.current.speed));
    let otherX = 0, otherZ = 3.5, otherV = 0;
    let scenarioT = 0;
    let replanT = 0;
    let selected: Traj | null = null;
    let selectedT0 = 0;
    let candidates: Traj[] = [];

    const resetScenario = () => {
      const q = p.current;
      egoV = kmh(Number(q.speed));
      egoX = 0;
      egoZ = 0;
      otherX = Number(q.gap);
      otherZ = 3.5;
      otherV = kmh(Number(q.cutSpeed));
      scenarioT = 0;
      selected = null;
      replanT = 0;
    };
    resetScenario();

    const predict = (tau: number) => {
      // cut-in: lateral move from 3.5 to 0 between scenario 1.5s and 4.5s
      const s = scenarioT + tau;
      const f = clamp((s - 1.5) / 3, 0, 1);
      const z = 3.5 - 3.5 * smooth(f);
      return { x: otherX + otherV * tau, z };
    };

    const plan = () => {
      const q = p.current;
      const vTarget = kmh(Number(q.speed));
      const comfort = Number(q.comfort);
      const lateralTargets = [-3.5, -1.75, 0, 1.75, 3.5].map((z) => z - egoZ);
      const speedFactors = [0.5, 0.7, 0.85, 1, 1.1];
      const out: Traj[] = [];
      for (const dz of lateralTargets) {
        for (const sf of speedFactors) {
          const vT = vTarget * sf;
          const pts: THREE.Vector3[] = [];
          let collide = false;
          let ttc = Infinity;
          let jerk = 0;
          let prevLat = 0, prevLatV = 0;
          for (let i = 0; i <= N; i++) {
            const tau = (i / N) * H;
            const f = tau / H;
            const lat = dz * quintic(f);
            const x = egoX + egoV * tau + 0.5 * ((vT - egoV) / H) * tau * tau;
            const z = egoZ + lat;
            pts.push(new THREE.Vector3(x, 0.05, z));
            const latV = (lat - prevLat) / (H / N);
            jerk += Math.abs(latV - prevLatV);
            prevLat = lat;
            prevLatV = latV;
            const o = predict(tau);
            const dx = Math.abs(o.x - x), dzz = Math.abs(o.z - z);
            if (dx < 5.2 && dzz < 2.1) {
              collide = true;
              ttc = Math.min(ttc, tau);
            }
          }
          const laneDev = Math.min(Math.abs(egoZ + dz), Math.abs(egoZ + dz - 3.5), Math.abs(egoZ + dz + 3.5));
          const offroad = Math.abs(egoZ + dz) > 4.5 ? 50 : 0;
          const cost =
            (collide ? 100 : 0) +
            offroad +
            comfort * (jerk * 0.4 + Math.abs(vT - egoV) * 0.15) +
            (1 - comfort) * Math.abs(vT - vTarget) * 0.4 +
            laneDev * 2 +
            Math.abs(dz) * 0.6;
          out.push({ pts, cost, collide, dz, vT, ttc });
        }
      }
      out.sort((a, b) => a.cost - b.cost);
      candidates = out;
      selected = out[0];
      selectedT0 = t;
      // draw
      candGroup.clear();
      if (Boolean(q.candidates)) {
        for (let i = 1; i < out.length; i++) {
          const tr = out[i];
          const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(tr.pts), tr.collide ? pathMatBad : pathMatOk);
          candGroup.add(l);
        }
      }
      selLine.geometry.dispose();
      selLine.geometry = new THREE.BufferGeometry().setFromPoints(out[0].pts);
      const pp: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const o = predict((i / 12) * H);
        pp.push(new THREE.Vector3(o.x, 0.06, o.z));
      }
      predLine.geometry.dispose();
      predLine.geometry = new THREE.BufferGeometry().setFromPoints(pp);
      predLine.computeLineDistances();
      const feasible = out.filter((c) => !c.collide).length;
      const minTtc = Math.min(...out.filter((c) => c.collide).map((c) => c.ttc));
      onTelemetry({
        "Candidates": out.length,
        "Collision-free": feasible,
        "Chosen lateral (m)": Math.round(out[0].dz * 100) / 100,
        "Chosen speed (km/h)": Math.round(out[0].vT * 3.6),
        "Min TTC (s)": Number.isFinite(minTtc) ? Math.round(minTtc * 100) / 100 : "—",
        "Best cost": Math.round(out[0].cost * 100) / 100,
      });
    };

    let last = performance.now();
    let raf = 0;
    let lastParams = JSON.stringify(p.current);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const cur = JSON.stringify({ s: p.current.speed, g: p.current.gap, c: p.current.cutSpeed });
      if (cur !== lastParams) {
        lastParams = cur;
        resetScenario();
      }
      if (play.current) {
        t += dt;
        scenarioT += dt;
        replanT += dt;
        if (!selected || replanT > 0.25) {
          replanT = 0;
          plan();
        }
        if (selected) {
          const tau = clamp(t - selectedT0 + 0.15, 0, H);
          const f = tau / H;
          const idx = Math.min(N - 1, Math.floor(f * N));
          const a = selected.pts[idx], b = selected.pts[idx + 1];
          const lf = f * N - idx;
          const targetZ = a.z + (b.z - a.z) * lf;
          egoV += (selected.vT - egoV) * Math.min(1, dt * 0.8);
          egoX += egoV * dt;
          egoZ += (targetZ - egoZ) * Math.min(1, dt * 4);
        }
        const o = predict(0);
        otherX = o.x;
        otherZ = o.z;
        otherX += otherV * dt;
        if (scenarioT > 11 || otherX - egoX < -30) resetScenario();
      }
      ego.position.set(egoX, 0, egoZ);
      other.position.set(otherX, 0, otherZ);
      other.rotation.y = -Math.atan2(predict(0.2).z - otherZ, otherV * 0.2 + 0.001) * 0.6;
      if (controls) {
        controls.target.lerp(new THREE.Vector3(egoX + 14, 0, 0), 0.15);
        camera.position.x += (egoX - 16 - camera.position.x) * 0.15;
      }
      stage.render();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stage.dispose();
    };
  }, [resetKey, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-canvas" />
    </div>
  );
}

const kmh = (v: number) => v / 3.6;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (f: number) => f * f * (3 - 2 * f);
const quintic = (f: number) => 10 * f ** 3 - 15 * f ** 4 + 6 * f ** 5;
