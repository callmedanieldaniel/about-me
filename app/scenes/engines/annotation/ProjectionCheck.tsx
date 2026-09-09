"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { boxHelper, classColor, makeObjects, samplePoints } from "../../kit/pointcloud";
import type { EngineProps } from "../../types";

// Camera projection check: the 3D labels are projected into a synthetic front camera; the label under edit can be nudged and the reprojection error is measured.
export default function ProjectionCheck({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const img = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const el = host.current, cv = img.current; if (!el || !cv) return;
    const stage = createStage(el, { position: [-16, 14, 20], target: [8, 0, 0], grid: 80, fov: 45 });
    if (!stage) return;
    const { scene } = stage;
    const gt = makeObjects(8, 7).map((o) => ({ ...o, x: Math.abs(o.x) + 6, z: o.z * 0.6 }));
    const { pos } = samplePoints(gt, 3, 5000);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, color: 0x3a4c66 })));
    const groups = gt.map((o) => { const g = boxHelper(o, classColor(o.cls)); g.position.set(o.x, 0, o.z); g.rotation.y = o.yaw; scene.add(g); return g; });
    const cam = new THREE.PerspectiveCamera(60, 1.6, 0.3, 200); cam.position.set(0, 1.6, 0); cam.lookAt(10, 1.2, 0);
    const camMesh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 4), new THREE.MeshBasicMaterial({ color: 0xffb454, wireframe: true })); camMesh.rotation.z = -Math.PI / 2; camMesh.position.set(0.5, 1.6, 0); scene.add(camMesh);
    const v = new THREE.Vector3();
    let raf = 0, frames = 0;
    const frame = () => {
      const q = p.current; const edit = Number(q.edit);
      groups.forEach((g, i) => { const o = gt[i]; if (i === edit) { g.position.set(o.x + Number(q.dx), 0, o.z + Number(q.dz)); g.rotation.y = o.yaw + THREE.MathUtils.degToRad(Number(q.dyaw)); } });
      stage.render();
      const W = cv.clientWidth, H = cv.clientHeight; const dpr = 2; if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      const ctx = cv.getContext("2d")!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0a0f18"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#11192a"; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      cam.aspect = W / H; cam.fov = Number(q.fov); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      // draw GT silhouettes (what the image "shows") then label projections
      let err = 0;
      const proj = (o: { x: number; z: number; yaw: number; l: number; w: number; h: number }, color: string, fill: boolean) => {
        const cs = Math.cos(o.yaw), sn = Math.sin(o.yaw); const pts: [number, number][] = []; let behind = false;
        for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) { v.set(o.x + cs * (sx * o.l) / 2 + sn * (sz * o.w) / 2, sy * o.h, o.z - sn * (sx * o.l) / 2 + cs * (sz * o.w) / 2).project(cam); if (v.z > 1) behind = true; pts.push([((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H]); }
        if (behind) return null;
        const xs = pts.map((a) => a[0]), ys = pts.map((a) => a[1]); const bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
        if (fill) { ctx.fillStyle = color; ctx.globalAlpha = 0.35; ctx.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); ctx.globalAlpha = 1; }
        else { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]; for (const [a, b] of E) { ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); } ctx.stroke(); }
        return bb;
      };
      gt.forEach((o) => proj(o, "#7e90a8", true));
      gt.forEach((o, i) => { const g = groups[i]; const bb = proj({ x: g.position.x, z: g.position.z, yaw: g.rotation.y, l: o.l, w: o.w, h: o.h }, i === edit ? "#ffb454" : `#${classColor(o.cls).toString(16).padStart(6, "0")}`, false); const gb = proj(o, "transparent", false); if (bb && gb && i === edit) err = Math.hypot(bb[0] - gb[0], bb[1] - gb[1]) / 2 + Math.hypot(bb[2] - gb[2], bb[3] - gb[3]) / 2; });
      ctx.fillStyle = "#e6eef8"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`CAM_FRONT · fov ${Number(q.fov)}° · editing #${edit + 1} · reprojection error ${err.toFixed(1)} px`, 8, 16);
      if ((frames++ & 15) === 0) onTelemetry({ Labels: gt.length, Editing: edit + 1, "Δx (m)": Number(q.dx), "Δz (m)": Number(q.dz), "Δyaw (°)": Number(q.dyaw), "Reprojection error (px)": err });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      <canvas ref={img} className="cam-inset" />
    </div>
  );
}
