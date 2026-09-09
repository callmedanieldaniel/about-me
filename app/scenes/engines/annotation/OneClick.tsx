"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { boxHelper, classColor, makeObjects, samplePoints, iou3d } from "../../kit/pointcloud";
import type { EngineProps } from "../../types";

// One-click annotation (LATTE-style): click a point → region-grow the cluster above ground → fit an oriented box by principal direction.
export default function OneClick({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-14, 22, 26], target: [0, 0, 0], grid: 80, fov: 45 });
    if (!stage) return;
    const { scene, camera, renderer } = stage;
    const gt = makeObjects(6, 9);
    const { pos } = samplePoints(gt, 2);
    const N = pos.length / 3;
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const col = new Float32Array(pos.length); const base = new THREE.Color(0x3a4c66);
    for (let i = 0; i < N; i++) { col[i * 3] = base.r; col[i * 3 + 1] = base.g; col[i * 3 + 2] = base.b; }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.13, vertexColors: true })); scene.add(cloud);
    // spatial hash
    const cell = 0.6; const hash = new Map<string, number[]>(); const key = (x: number, y: number, z: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    for (let i = 0; i < N; i++) { const k = key(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); const arr = hash.get(k); if (arr) arr.push(i); else hash.set(k, [i]); }
    const ray = new THREE.Raycaster(); ray.params.Points!.threshold = 0.35;
    const boxes: THREE.Group[] = []; let clusters = 0, iouSum = 0;
    const grow = (seed: number) => {
      const radius = Number(p.current.radius), groundH = Number(p.current.ground);
      const out: number[] = []; const seen = new Set<number>([seed]); const stack = [seed];
      while (stack.length && out.length < 4000) {
        const i = stack.pop()!; out.push(i);
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
          const arr = hash.get(`${Math.floor(x / cell) + dx},${Math.floor(y / cell) + dy},${Math.floor(z / cell) + dz}`); if (!arr) continue;
          for (const j of arr) { if (seen.has(j)) continue; if (pos[j * 3 + 1] < groundH) continue; const d = Math.hypot(pos[j * 3] - x, pos[j * 3 + 1] - y, pos[j * 3 + 2] - z); if (d <= radius) { seen.add(j); stack.push(j); } }
        }
      }
      return out;
    };
    const fit = (idx: number[]) => {
      let mx = 0, mz = 0; for (const i of idx) { mx += pos[i * 3]; mz += pos[i * 3 + 2]; } mx /= idx.length; mz /= idx.length;
      let sxx = 0, sxz = 0, szz = 0, maxY = 0; for (const i of idx) { const dx = pos[i * 3] - mx, dz = pos[i * 3 + 2] - mz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; maxY = Math.max(maxY, pos[i * 3 + 1]); }
      const yaw = 0.5 * Math.atan2(2 * sxz, sxx - szz);
      const c = Math.cos(yaw), s = Math.sin(yaw); let minL = 1e9, maxL = -1e9, minW = 1e9, maxW = -1e9;
      for (const i of idx) { const dx = pos[i * 3] - mx, dz = pos[i * 3 + 2] - mz; const l = c * dx + s * dz, w = -s * dx + c * dz; minL = Math.min(minL, l); maxL = Math.max(maxL, l); minW = Math.min(minW, w); maxW = Math.max(maxW, w); }
      const cl = (minL + maxL) / 2, cw = (minW + maxW) / 2;
      return { x: mx + c * cl - s * cw, z: mz + s * cl + c * cw, yaw: -yaw, l: Math.max(0.4, maxL - minL + 0.1), w: Math.max(0.4, maxW - minW + 0.1), h: Math.max(0.5, maxY + 0.05) };
    };
    const onClick = (e: MouseEvent) => {
      const r = renderer.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hits = ray.intersectObject(cloud); if (!hits.length || hits[0].index === undefined) return;
      const idx = grow(hits[0].index); if (idx.length < 8) return;
      const b = fit(idx); const cls = b.h > 1.6 && b.l < 1.2 ? "pedestrian" : b.l < 2.4 ? "cyclist" : "car";
      const hue = new THREE.Color(classColor(cls));
      for (const i of idx) { col[i * 3] = hue.r; col[i * 3 + 1] = hue.g; col[i * 3 + 2] = hue.b; } geo.attributes.color.needsUpdate = true;
      const g = boxHelper({ l: b.l, w: b.w, h: b.h }, classColor(cls)); g.position.set(b.x, 0, b.z); g.rotation.y = b.yaw; scene.add(g); boxes.push(g);
      let best = 0; for (const o of gt) best = Math.max(best, iou3d({ x: b.x, z: b.z, l: b.l, w: b.w, h: b.h }, o)); iouSum += best; clusters++;
      onTelemetry({ Clusters: clusters, "Last cluster points": idx.length, "Last class": cls, "Last dims l×w×h": `${b.l.toFixed(2)}×${b.w.toFixed(2)}×${b.h.toFixed(2)}`, "Last IoU vs GT": best, "Mean IoU": iouSum / clusters });
    };
    renderer.domElement.addEventListener("click", onClick);
    onTelemetry({ Clusters: 0, Points: N, "GT objects": gt.length });
    let raf = 0; const frame = () => { stage.render(); raf = requestAnimationFrame(frame); }; raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); renderer.domElement.removeEventListener("click", onClick); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" style={{ cursor: "crosshair" }} />;
}
