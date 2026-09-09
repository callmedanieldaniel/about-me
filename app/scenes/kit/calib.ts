import * as THREE from "three";
import { mulberry32 } from "./rng";

// Shared synthetic calibration scene: LiDAR points on a checker wall, poles and a car; a pinhole camera; extrinsics.
export type Extrinsics = { tx: number; ty: number; tz: number; roll: number; pitch: number; yaw: number };
export const TRUE_EXT: Extrinsics = { tx: 0.1, ty: -0.3, tz: 1.2, roll: 0, pitch: 2, yaw: -1.5 }; // degrees for rotations, LiDAR→camera

export function scenePoints(seed = 2) {
  const rng = mulberry32(seed);
  const pts: { p: THREE.Vector3; edge: boolean }[] = [];
  // wall with checker pattern at z=12 (LiDAR frame: x right, y up, z forward)
  for (let x = -6; x <= 6; x += 0.12) for (let y = -1.5; y <= 3; y += 0.12) {
    const cx = Math.floor((x + 6) / 1), cy = Math.floor((y + 1.5) / 1);
    const edge = Math.abs((x + 6) % 1) < 0.13 || Math.abs((y + 1.5) % 1) < 0.13;
    if (rng() < 0.35 || edge) pts.push({ p: new THREE.Vector3(x + (rng() - 0.5) * 0.02, y + (rng() - 0.5) * 0.02, 12 + (rng() - 0.5) * 0.03), edge: edge || (cx + cy) % 2 === 0 });
  }
  // poles
  for (const px of [-4, 3.5]) for (let y = -1.5; y <= 2.5; y += 0.06) pts.push({ p: new THREE.Vector3(px + (rng() - 0.5) * 0.05, y, 7 + (rng() - 0.5) * 0.05), edge: true });
  // car box at 8 m
  for (let i = 0; i < 700; i++) { const face = rng(); const p = face < 0.5 ? new THREE.Vector3(-1 + rng() * 2, -1.4 + rng() * 1.5, 8.5) : new THREE.Vector3(-1 + rng() * 2, 0.1, 8.5 + rng() * 2); pts.push({ p, edge: face < 0.5 && (Math.abs(p.x) > 0.9 || p.y > -0.05) }); }
  // ground
  for (let i = 0; i < 1200; i++) pts.push({ p: new THREE.Vector3((rng() - 0.5) * 16, -1.6, 3 + rng() * 12), edge: false });
  return pts;
}

export function extMatrix(e: Extrinsics) {
  const m = new THREE.Matrix4();
  const eu = new THREE.Euler(THREE.MathUtils.degToRad(e.pitch), THREE.MathUtils.degToRad(e.yaw), THREE.MathUtils.degToRad(e.roll), "XYZ");
  m.makeRotationFromEuler(eu); m.setPosition(e.tx, e.ty, e.tz);
  return m;
}

// Projects camera-frame point with pinhole intrinsics; returns pixel coords in a w×h image or null.
export function project(pc: THREE.Vector3, fx: number, w: number, h: number) {
  if (pc.z <= 0.2) return null;
  const u = w / 2 + (fx * pc.x) / pc.z, v = h / 2 - (fx * pc.y) / pc.z;
  if (u < 0 || v < 0 || u >= w || v >= h) return null;
  return { u, v, d: pc.z };
}

// Draws the synthetic "camera image": checker wall, poles, car, from true extrinsics.
export function drawImage(ctx: CanvasRenderingContext2D, w: number, h: number, fx: number, shift = 0) {
  ctx.fillStyle = "#0a0f18"; ctx.fillRect(0, 0, w, h);
  const T = extMatrix(TRUE_EXT).invert();
  const P = (x: number, y: number, z: number) => project(new THREE.Vector3(x + shift, y, z).applyMatrix4(T), fx, w, h);
  // ground horizon
  const g0 = P(-8, -1.6, 3), g1 = P(8, -1.6, 3), g2 = P(8, -1.6, 40), g3 = P(-8, -1.6, 40);
  if (g0 && g1 && g2 && g3) { ctx.fillStyle = "#11192a"; ctx.beginPath(); ctx.moveTo(g0.u, g0.v); ctx.lineTo(g1.u, g1.v); ctx.lineTo(g2.u, g2.v); ctx.lineTo(g3.u, g3.v); ctx.closePath(); ctx.fill(); }
  for (let cx = 0; cx < 12; cx++) for (let cy = 0; cy < 4; cy++) {
    const a = P(-6 + cx, -1.5 + cy, 12), b = P(-5 + cx, -1.5 + cy, 12), c = P(-5 + cx, -0.5 + cy, 12), d = P(-6 + cx, -0.5 + cy, 12);
    if (!a || !b || !c || !d) continue;
    ctx.fillStyle = (cx + cy) % 2 ? "#cdd7e4" : "#2a3648"; ctx.beginPath(); ctx.moveTo(a.u, a.v); ctx.lineTo(b.u, b.v); ctx.lineTo(c.u, c.v); ctx.lineTo(d.u, d.v); ctx.closePath(); ctx.fill();
  }
  for (const px of [-4, 3.5]) { const a = P(px, -1.5, 7), b = P(px, 2.5, 7); if (a && b) { ctx.strokeStyle = "#8ea1bd"; ctx.lineWidth = Math.max(2, 60 / a.d); ctx.beginPath(); ctx.moveTo(a.u, a.v); ctx.lineTo(b.u, b.v); ctx.stroke(); } }
  const car = [P(-1, -1.4, 8.5), P(1, -1.4, 8.5), P(1, 0.1, 8.5), P(-1, 0.1, 8.5)];
  if (car.every(Boolean)) { ctx.fillStyle = "#3b4d68"; ctx.beginPath(); car.forEach((c, i) => (i ? ctx.lineTo(c!.u, c!.v) : ctx.moveTo(c!.u, c!.v))); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#7e90a8"; ctx.lineWidth = 1; ctx.stroke(); }
}

// Edge map of the synthetic image (analytic): distance from projected point to nearest checker/pole edge in pixels.
export function edgeDistance(u: number, v: number, w: number, h: number, fx: number) {
  const T = extMatrix(TRUE_EXT).invert();
  let best = 1e9;
  const P = (x: number, y: number, z: number) => project(new THREE.Vector3(x, y, z).applyMatrix4(T), fx, w, h);
  for (let cx = 0; cx <= 12; cx++) { const a = P(-6 + cx, -1.5, 12), b = P(-6 + cx, 2.5, 12); if (a && b) best = Math.min(best, segDist(u, v, a.u, a.v, b.u, b.v)); }
  for (let cy = 0; cy <= 4; cy++) { const a = P(-6, -1.5 + cy, 12), b = P(6, -1.5 + cy, 12); if (a && b) best = Math.min(best, segDist(u, v, a.u, a.v, b.u, b.v)); }
  for (const px of [-4, 3.5]) { const a = P(px, -1.5, 7), b = P(px, 2.5, 7); if (a && b) best = Math.min(best, segDist(u, v, a.u, a.v, b.u, b.v)); }
  return best;
}
function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy || 1; let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
