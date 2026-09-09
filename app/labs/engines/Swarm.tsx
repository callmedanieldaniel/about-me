"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, palette } from "../stage";
import type { EngineProps } from "../types";

const BOX = 20; // half-size of bounding box
const MAX = 800;

export default function Swarm({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [34, 26, 40], target: [0, 8, 0], grid: 50 });
    if (!stage) return;
    const { scene } = stage;

    const bounds = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX * 2, BOX * 2, BOX * 2)),
      new THREE.LineBasicMaterial({ color: 0x1c2a3d }),
    );
    bounds.position.y = BOX;
    scene.add(bounds);

    const geo = new THREE.ConeGeometry(0.22, 0.8, 6);
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }), MAX);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    const colorA = new THREE.Color(0x2a6fff), colorB = new THREE.Color(palette.live), colorC = new THREE.Color(0xffffff);
    const tmpC = new THREE.Color();

    const pos = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3);
    for (let i = 0; i < MAX; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX;
      pos[i * 3 + 1] = BOX + (Math.random() - 0.5) * BOX;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX;
      vel[i * 3] = (Math.random() - 0.5) * 4;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 4;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }

    const obstacleMeshes: THREE.Mesh[] = [];
    const obstacles: { x: number; y: number; z: number; r: number }[] = [];
    const obsMat = new THREE.MeshStandardMaterial({ color: palette.bad, emissive: 0x3a0d14, roughness: 0.6 });
    const setObstacles = (n: number) => {
      obstacleMeshes.forEach((m) => {
        scene.remove(m);
        m.geometry.dispose();
      });
      obstacleMeshes.length = 0;
      obstacles.length = 0;
      for (let i = 0; i < n; i++) {
        const a = (i / Math.max(1, n)) * Math.PI * 2;
        const o = { x: Math.cos(a) * 9, y: BOX + Math.sin(a * 1.7) * 6, z: Math.sin(a) * 9, r: 2.5 + (i % 3) };
        obstacles.push(o);
        const m = new THREE.Mesh(new THREE.SphereGeometry(o.r, 24, 16), obsMat);
        m.position.set(o.x, o.y, o.z);
        scene.add(m);
        obstacleMeshes.push(m);
      }
    };
    let lastObs = -1;

    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const cellSize = 3;
    const grid = new Map<number, number[]>();
    const key = (x: number, y: number, z: number) =>
      (Math.floor((x + BOX) / cellSize) * 73856093) ^ (Math.floor(y / cellSize) * 19349663) ^ (Math.floor((z + BOX) / cellSize) * 83492791);

    let last = performance.now();
    let raf = 0, telT = 0, neighborSum = 0, stepCount = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const q = p.current;
      const n = Number(q.count);
      const R = Number(q.radius);
      const wSep = Number(q.separation), wAli = Number(q.alignment), wCoh = Number(q.cohesion);
      const nObs = Number(q.obstacles);
      if (nObs !== lastObs) {
        setObstacles(nObs);
        lastObs = nObs;
      }
      if (play.current) {
        grid.clear();
        for (let i = 0; i < n; i++) {
          const k = key(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          const cell = grid.get(k);
          if (cell) cell.push(i);
          else grid.set(k, [i]);
        }
        neighborSum = 0;
        const R2 = R * R;
        for (let i = 0; i < n; i++) {
          const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
          let sx = 0, sy = 0, sz = 0, ax = 0, ay = 0, az = 0, cx = 0, cy = 0, cz = 0, cnt = 0;
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
              for (let dz = -1; dz <= 1; dz++) {
                const cell = grid.get(key(px + dx * cellSize, py + dy * cellSize, pz + dz * cellSize));
                if (!cell) continue;
                for (const j of cell) {
                  if (j === i) continue;
                  const ox = pos[j * 3] - px, oy = pos[j * 3 + 1] - py, oz = pos[j * 3 + 2] - pz;
                  const d2 = ox * ox + oy * oy + oz * oz;
                  if (d2 > R2 || d2 < 1e-6) continue;
                  const d = Math.sqrt(d2);
                  const w = 1 - d / R;
                  sx -= (ox / d) * w; sy -= (oy / d) * w; sz -= (oz / d) * w;
                  ax += vel[j * 3]; ay += vel[j * 3 + 1]; az += vel[j * 3 + 2];
                  cx += ox; cy += oy; cz += oz;
                  cnt++;
                }
              }
          neighborSum += cnt;
          let fx = 0, fy = 0, fz = 0;
          if (cnt) {
            fx += wSep * sx * 6 + wAli * (ax / cnt - vel[i * 3]) * 0.8 + wCoh * (cx / cnt) * 0.5;
            fy += wSep * sy * 6 + wAli * (ay / cnt - vel[i * 3 + 1]) * 0.8 + wCoh * (cy / cnt) * 0.5;
            fz += wSep * sz * 6 + wAli * (az / cnt - vel[i * 3 + 2]) * 0.8 + wCoh * (cz / cnt) * 0.5;
          }
          for (const o of obstacles) {
            const ox = px - o.x, oy = py - o.y, oz = pz - o.z;
            const d = Math.hypot(ox, oy, oz);
            const m = o.r + 2.5;
            if (d < m) {
              const s = ((m - d) / m) * 40;
              fx += (ox / d) * s; fy += (oy / d) * s; fz += (oz / d) * s;
            }
          }
          // soft bounds
          const margin = 4;
          if (px > BOX - margin) fx -= (px - (BOX - margin)) * 3;
          if (px < -BOX + margin) fx += (-BOX + margin - px) * 3;
          if (py > 2 * BOX - margin) fy -= (py - (2 * BOX - margin)) * 3;
          if (py < margin) fy += (margin - py) * 3;
          if (pz > BOX - margin) fz -= (pz - (BOX - margin)) * 3;
          if (pz < -BOX + margin) fz += (-BOX + margin - pz) * 3;
          vel[i * 3] += fx * dt; vel[i * 3 + 1] += fy * dt; vel[i * 3 + 2] += fz * dt;
          const sp = Math.hypot(vel[i * 3], vel[i * 3 + 1], vel[i * 3 + 2]);
          const maxS = 8, minS = 2.5;
          if (sp > maxS) { vel[i * 3] *= maxS / sp; vel[i * 3 + 1] *= maxS / sp; vel[i * 3 + 2] *= maxS / sp; }
          if (sp < minS && sp > 0) { vel[i * 3] *= minS / sp; vel[i * 3 + 1] *= minS / sp; vel[i * 3 + 2] *= minS / sp; }
          pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        }
        stepCount++;
      }
      for (let i = 0; i < n; i++) {
        V.set(vel[i * 3], vel[i * 3 + 1], vel[i * 3 + 2]);
        const sp = V.length();
        Q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V.normalize());
        M.compose(new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]), Q, new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(i, M);
        const f = (sp - 2.5) / 5.5;
        tmpC.copy(colorA).lerp(colorB, Math.min(1, f * 1.4)).lerp(colorC, Math.max(0, f - 0.7));
        mesh.setColorAt(i, tmpC);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      void UP;
      telT += dt;
      if (telT > 0.2) {
        telT = 0;
        onTelemetry({
          Agents: n,
          "Avg neighbors": Math.round((neighborSum / Math.max(1, n)) * 10) / 10,
          "Hash cells": grid.size,
          "Perception (m)": R,
          Obstacles: obstacles.length,
          Steps: stepCount,
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
