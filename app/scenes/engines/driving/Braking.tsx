"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel, palette } from "../../stage";
import type { EngineProps } from "../../types";

const G = 9.81;
type Cfg = { v0: number; delay: number; mu: number; distance: number };

function state(c: Cfg, t: number) {
  const a = c.mu * G;
  if (t <= c.delay) return { x: c.v0 * t, v: c.v0, stopped: false };
  const tb = t - c.delay;
  const tStop = c.v0 / a;
  if (tb >= tStop) return { x: c.v0 * c.delay + (c.v0 * c.v0) / (2 * a), v: 0, stopped: true };
  return { x: c.v0 * c.delay + c.v0 * tb - 0.5 * a * tb * tb, v: c.v0 - a * tb, stopped: false };
}
const stopDist = (c: Cfg) => c.v0 * c.delay + (c.v0 * c.v0) / (2 * c.mu * G);
const impactSpeed = (c: Cfg) => {
  const braked = c.distance - c.v0 * c.delay;
  if (braked <= 0) return c.v0;
  const v2 = c.v0 * c.v0 - 2 * c.mu * G * braked;
  return v2 > 0 ? Math.sqrt(v2) : 0;
};

export default function Braking({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [-8, 14, 30], target: [22, 0, 0], grid: 0, fov: 48 });
    if (!stage) return;
    const { scene } = stage;

    const lanes = [-4, 4];
    lanes.forEach((z) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(220, 6), new THREE.MeshStandardMaterial({ color: 0x0c1420 }));
      road.rotation.x = -Math.PI / 2;
      road.position.set(80, 0, z);
      scene.add(road);
    });
    // distance ticks
    const tickGeo = new THREE.BufferGeometry();
    const tickPts: number[] = [];
    for (let x = 0; x <= 160; x += 10) tickPts.push(x, 0.02, -8, x, 0.02, 8);
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPts, 3));
    scene.add(new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({ color: 0x223247 })));
    for (let x = 0; x <= 160; x += 20) {
      const l = makeLabel(`${x} m`, "#7e90a8", 0.9);
      l.position.set(x, 0.3, 9.5);
      scene.add(l);
    }

    const car = (color: number) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 1.9), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }));
      body.position.y = 0.8;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.6), new THREE.MeshStandardMaterial({ color: 0x0a1020, metalness: 0.6, roughness: 0.2 }));
      cabin.position.set(-0.2, 1.7, 0);
      g.add(body, cabin);
      return g;
    };
    const carA = car(palette.live), carB = car(palette.ref);
    carA.position.z = lanes[0];
    carB.position.z = lanes[1];
    scene.add(carA, carB);
    const wallMat = new THREE.MeshStandardMaterial({ color: palette.bad, emissive: 0x550000 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 15), wallMat);
    wall.position.y = 1.1;
    scene.add(wall);
    const skidA = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.7), new THREE.MeshBasicMaterial({ color: palette.live, transparent: true, opacity: 0.25 }));
    const skidB = skidA.clone();
    skidB.material = new THREE.MeshBasicMaterial({ color: palette.ref, transparent: true, opacity: 0.25 });
    [skidA, skidB].forEach((s, i) => {
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, 0.03, lanes[i]);
      scene.add(s);
    });

    let t = 0;
    let last = performance.now();
    let raf = 0;
    let key = "";
    let telemetryT = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const q = p.current;
      const cfg: Cfg = { v0: Number(q.speed) / 3.6, delay: Number(q.delay), mu: Number(q.friction), distance: Number(q.distance) };
      const ref: Cfg = { ...cfg, delay: cfg.delay + 0.8 };
      const k = JSON.stringify(cfg);
      if (k !== key) {
        key = k;
        t = 0;
      }
      if (play.current) t += dt;
      const a = state(cfg, t), b = state(ref, t);
      const hitA = a.x >= cfg.distance - 2.25, hitB = b.x >= cfg.distance - 2.25;
      carA.position.x = Math.min(a.x, cfg.distance - 2.25);
      carB.position.x = Math.min(b.x, cfg.distance - 2.25);
      wall.position.x = cfg.distance;
      const skid = (m: THREE.Mesh, c: Cfg, s: { x: number }) => {
        const start = c.v0 * c.delay;
        const len = Math.max(0.001, Math.min(s.x, c.distance - 2.25) - start);
        m.visible = len > 0.01;
        m.scale.x = len;
        m.position.x = start + len / 2;
      };
      skid(skidA, cfg, a);
      skid(skidB, ref, b);
      const done = (a.stopped || hitA) && (b.stopped || hitB);
      if (done && t > 12) t = 0;
      telemetryT += dt;
      if (telemetryT > 0.12) {
        telemetryT = 0;
        onTelemetry({
          "Time (s)": Math.round(t * 100) / 100,
          "Stop distance, current (m)": Math.round(stopDist(cfg) * 10) / 10,
          "Stop distance, late (m)": Math.round(stopDist(ref) * 10) / 10,
          "Impact speed, current (km/h)": Math.round(impactSpeed(cfg) * 3.6),
          "Impact speed, late (km/h)": Math.round(impactSpeed(ref) * 3.6),
          "Outcome": hitA ? "current collides" : hitB ? "late collides" : a.stopped ? "both stopped" : "braking",
        });
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
