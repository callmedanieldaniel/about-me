import * as THREE from "three";
import { mulberry32 } from "./rng";

export type GtObj = { id: number; cls: "car" | "pedestrian" | "cyclist"; x: number; z: number; yaw: number; l: number; w: number; h: number; vx: number; vz: number; static: boolean };

export function makeObjects(seed = 4, n = 8): GtObj[] {
  const rng = mulberry32(seed);
  const out: GtObj[] = [];
  for (let i = 0; i < n; i++) {
    const r = rng();
    const cls: GtObj["cls"] = r < 0.6 ? "car" : r < 0.85 ? "pedestrian" : "cyclist";
    const dims = cls === "car" ? [4.4 + rng(), 1.9, 1.5] : cls === "pedestrian" ? [0.6, 0.6, 1.75] : [1.8, 0.7, 1.7];
    const stat = rng() < 0.35;
    const yaw = rng() < 0.5 ? 0 : Math.PI + (rng() - 0.5) * 0.3;
    const sp = stat ? 0 : cls === "pedestrian" ? 1.2 : 5 + rng() * 6;
    out.push({ id: i + 1, cls, x: -25 + rng() * 50, z: -12 + rng() * 24, yaw, l: dims[0], w: dims[1], h: dims[2], vx: Math.cos(yaw) * sp, vz: -Math.sin(yaw) * sp, static: stat });
  }
  return out;
}

export function objectsAt(objs: GtObj[], t: number): GtObj[] {
  return objs.map((o) => ({ ...o, x: o.x + o.vx * t, z: o.z + o.vz * t }));
}

// Samples LiDAR-like points: ground + object surfaces (visible faces), with density falling with distance.
export function samplePoints(objs: GtObj[], seed = 1, groundPts = 9000): { pos: Float32Array; label: Int16Array } {
  const rng = mulberry32(seed);
  const pts: number[] = []; const lab: number[] = [];
  for (let i = 0; i < groundPts; i++) { const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 40; pts.push(Math.cos(a) * r, -0.05 + rng() * 0.08 + (Math.sin(r * 0.5) * 0.03), Math.sin(a) * r); lab.push(0); }
  for (const o of objs) {
    const d = Math.hypot(o.x, o.z); const n = Math.max(60, Math.floor(2600 / Math.max(4, d)));
    const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
    for (let i = 0; i < n; i++) {
      const face = rng();
      let lx: number, ly: number, lz: number;
      if (face < 0.4) { lx = (rng() - 0.5) * o.l; ly = rng() * o.h; lz = (rng() < 0.5 ? -0.5 : 0.5) * o.w; }
      else if (face < 0.7) { lx = (rng() < 0.5 ? -0.5 : 0.5) * o.l; ly = rng() * o.h; lz = (rng() - 0.5) * o.w; }
      else { lx = (rng() - 0.5) * o.l; ly = o.h; lz = (rng() - 0.5) * o.w; }
      const wx = o.x + c * lx + s * lz, wz = o.z - s * lx + c * lz;
      // simple occlusion: only points facing the sensor (at origin)
      if (rng() < 0.55 && (wx * (wx - o.x) + wz * (wz - o.z)) > 0) continue;
      pts.push(wx + (rng() - 0.5) * 0.03, ly + (rng() - 0.5) * 0.03, wz + (rng() - 0.5) * 0.03); lab.push(o.id);
    }
  }
  return { pos: new Float32Array(pts), label: new Int16Array(lab) };
}

export function classColor(cls: string) { return cls === "car" ? 0x5ee7ff : cls === "pedestrian" ? 0xff5d73 : 0x7cf3a0; }

export function boxHelper(o: { l: number; w: number; h: number }, color: number) {
  const g = new THREE.BoxGeometry(o.l, o.h, o.w);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
  const fill = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false }));
  const grp = new THREE.Group(); grp.add(fill, edges);
  // heading arrow
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), o.l * 0.7, color, 0.5, 0.3);
  grp.add(arrow);
  fill.position.y = o.h / 2; edges.position.y = o.h / 2; arrow.position.y = o.h / 2;
  return grp;
}

export function iou3d(a: { x: number; z: number; l: number; w: number; h: number }, b: typeof a) {
  // axis-aligned approximation in BEV × height overlap
  const ix = Math.max(0, Math.min(a.x + a.l / 2, b.x + b.l / 2) - Math.max(a.x - a.l / 2, b.x - b.l / 2));
  const iz = Math.max(0, Math.min(a.z + a.w / 2, b.z + b.w / 2) - Math.max(a.z - a.w / 2, b.z - b.w / 2));
  const ih = Math.min(a.h, b.h);
  const inter = ix * iz * ih; const uni = a.l * a.w * a.h + b.l * b.w * b.h - inter;
  return uni > 0 ? inter / uni : 0;
}
