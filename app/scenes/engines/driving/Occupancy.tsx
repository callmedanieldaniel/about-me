"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { buildCity, egoMesh, makeActors, stepActors } from "../../kit/city";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Voxel occupancy grid around the ego vehicle: semantic classes, free-space, flow arrows and a time scrubber.
const CLASSES = [
  { id: 1, name: "road", color: new THREE.Color(0x27394f) },
  { id: 2, name: "building", color: new THREE.Color(0x7e90a8) },
  { id: 3, name: "vehicle", color: new THREE.Color(0x5ee7ff) },
  { id: 4, name: "pedestrian", color: new THREE.Color(0xff5d73) },
  { id: 5, name: "vegetation", color: new THREE.Color(0x7cf3a0) },
];

export default function Occupancy({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-70, 40, 38], target: [-34, 2, 0], grid: 0, fov: 42 });
    if (!stage) return;
    const { scene, camera, controls } = stage;
    const colliders = buildCity(scene, 11, 0.08);
    const actors = makeActors(10, 21);
    const ego = egoMesh(); scene.add(ego);
    const rng = mulberry32(5);
    // trees along sidewalks
    const treeSpots: THREE.Vector3[] = [];
    for (let x = -60; x < 60; x += 9) for (const s of [-1, 1]) treeSpots.push(new THREE.Vector3(x + rng() * 2, 0, s * 12.5));

    const RES = 0.8, NX = 60, NZ = 36, NY = 8; // 48m × 29m × 6.4m grid
    const count = NX * NZ * NY;
    const geo = new THREE.BoxGeometry(RES * 0.92, RES * 0.92, RES * 0.92);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, transparent: true, opacity: 0.85 });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    inst.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    scene.add(inst);
    const flowGeo = new THREE.BufferGeometry();
    const flowPos = new Float32Array(NX * NZ * 6);
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
    const flow = new THREE.LineSegments(flowGeo, new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.9 }));
    scene.add(flow);

    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    const box = new THREE.Box3();
    let t = 0, last = performance.now(), egoX = -40;
    let raf = 0, lastStats = [0, 1];

    const staticCache = new Map<number, number>();
    const tmp = new THREE.Vector3();
    const staticClass = (gx: number, gy: number, gz: number, wx: number, wy: number, wz: number) => {
      const key = ((gx + 4096) << 16) | ((gz + 512) << 6) | gy;
      const hit = staticCache.get(key);
      if (hit !== undefined) return hit;
      let cls = 0;
      tmp.set(wx, wy, wz);
      for (const c of colliders) if (c.containsPoint(tmp)) { cls = 2; break; }
      if (!cls) for (const tr of treeSpots) if (wy > 1.6 && wy < 4.4 && (wx - tr.x) ** 2 + (wz - tr.z) ** 2 < 2.2) { cls = 5; break; }
      if (!cls && wy < RES && Math.abs(wz) < 10) cls = 1;
      staticCache.set(key, cls);
      return cls;
    };
    const classify = (gx: number, gy: number, gz: number, wx: number, wy: number, wz: number) => {
      for (const a of actors) {
        const dx = wx - a.x, dz = wz - a.z;
        if (Math.abs(dx) < a.l / 2 && Math.abs(dz) < a.w / 2 && wy < a.h) return [a.kind === "ped" ? 4 : 3, a.vx];
      }
      return [staticClass(gx, gy, gz, wx, wy, wz), 0];
    };

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      if (play.current) { t += dt; egoX += Number(q.egoSpeed) * dt; if (egoX > 40) egoX = -40; stepActors(actors, dt); }
      ego.position.set(egoX, 0, -3.5);
      const range = Number(q.range);
      const show = String(q.classes);
      const flowOn = Boolean(q.flow);
      let occ = 0, n = 0, fi = 0;
      const cutH = Number(q.slice);
      const gx0 = Math.round(egoX / RES);
      if ((raf & 1) === 0) for (let ix = 0; ix < NX; ix++) for (let iz = 0; iz < NZ; iz++) {
        let vxTop = 0, topY = -1;
        for (let iy = 0; iy < NY; iy++) {
          const idx = (ix * NZ + iz) * NY + iy;
          const gx = gx0 + ix - Math.round(NX * 0.35), gz = iz - NZ / 2;
          const wx = gx * RES, wz = gz * RES, wy = iy * RES + RES / 2;
          const d = Math.hypot(wx - egoX, wz + 3.5);
          let cls = 0, vx = 0;
          if (d < range && wy <= cutH) [cls, vx] = classify(gx, iy, gz, wx, wy, wz);
          if (cls && show !== "all" && CLASSES[cls - 1].name !== show) cls = 0;
          if (cls) {
            occ++;
            m4.makeTranslation(wx, wy, wz);
            inst.setMatrixAt(idx, m4);
            col.copy(CLASSES[cls - 1].color);
            const fade = 1 - (d / range) * 0.6;
            col.multiplyScalar(fade);
            inst.setColorAt(idx, col);
            if (cls === 3 || cls === 4) { vxTop = vx; topY = wy; }
          } else {
            m4.makeScale(0, 0, 0); inst.setMatrixAt(idx, m4);
          }
          n++;
        }
        if (flowOn && topY >= 0 && Math.abs(vxTop) > 0.1) {
          const wx = (gx0 + ix - Math.round(NX * 0.35)) * RES, wz = (iz - NZ / 2) * RES;
          flowPos.set([wx, topY + RES, wz, wx + vxTop * 0.35, topY + RES, wz], fi); fi += 6;
        }
      }
      if ((raf & 1) === 0) {
        flowGeo.attributes.position.needsUpdate = true;
        flowGeo.setDrawRange(0, fi / 3);
        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        lastStats = [occ, n];
      }
      controls!.target.lerp(new THREE.Vector3(egoX + 6, 2, 0), 0.1);
      camera.position.x += (egoX - 30 - camera.position.x) * 0.1;
      stage.render();
      if ((raf & 7) === 0) onTelemetry({ "Occupied voxels": lastStats[0], "Grid cells": lastStats[1], "Occupancy %": (100 * lastStats[0]) / lastStats[1], "Resolution (m)": RES, "Ego x (m)": egoX, "t (s)": t });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);

  return <div ref={host} className="engine-host" />;
}
