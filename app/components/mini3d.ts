// A tiny painter's-algorithm 3D renderer on canvas 2D: enough for shaded robot links, boxes and
// ground planes in the small preview cards, without spending a WebGL context per card.
export type V3 = [number, number, number];
export type Face = { pts: V3[]; color: [number, number, number]; alpha?: number; stroke?: string; glow?: boolean };

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export class Scene3 {
  faces: Face[] = [];
  lines: { a: V3; b: V3; color: string; width?: number }[] = [];
  points: { p: V3; color: string; size: number }[] = [];
  constructor(public yaw = 0.6, public pitch = 0.32, public dist = 9, public target: V3 = [0, 0.7, 0], public fov = 2.9) {}

  project(p: V3, w: number, h: number) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const d = sub(p, this.target);
    const x = d[0] * cy - d[2] * sy, z = d[0] * sy + d[2] * cy;
    const y = d[1] * cp - z * sp, zz = d[1] * sp + z * cp + this.dist;
    const s = (this.fov * Math.min(w, h)) / Math.max(0.2, zz);
    return { x: w / 2 + x * s, y: h / 2 - y * s, z: zz, s };
  }

  box(center: V3, size: V3, color: [number, number, number], rotY = 0, alpha = 1) {
    const [cx, cy, cz] = center, [sx, sy, sz] = size.map((v) => v / 2) as V3;
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const v = (dx: number, dy: number, dz: number): V3 => [cx + dx * c - dz * s, cy + dy, cz + dx * s + dz * c];
    const p = [v(-sx, -sy, -sz), v(sx, -sy, -sz), v(sx, -sy, sz), v(-sx, -sy, sz), v(-sx, sy, -sz), v(sx, sy, -sz), v(sx, sy, sz), v(-sx, sy, sz)];
    const idx = [[4, 5, 6, 7], [0, 3, 2, 1], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    for (const f of idx) this.faces.push({ pts: f.map((i) => p[i]), color, alpha });
  }

  // A capsule-ish limb drawn as a tapered prism between two points.
  limb(a: V3, b: V3, r: number, color: [number, number, number], sides = 6) {
    const dir = norm(sub(b, a));
    const up: V3 = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u = norm(cross(dir, up)), v = norm(cross(dir, u));
    const ring = (c: V3, rr: number) => Array.from({ length: sides }, (_, i) => { const t = (i / sides) * Math.PI * 2; return [c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * rr, c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * rr, c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * rr] as V3; });
    const r0 = ring(a, r), r1 = ring(b, r);
    for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; this.faces.push({ pts: [r0[i], r0[j], r1[j], r1[i]], color }); }
    this.faces.push({ pts: r1, color });
  }

  sphere(c: V3, r: number, color: [number, number, number]) { this.box(c, [r * 1.7, r * 1.7, r * 1.7], color); }

  grid(size = 6, step = 1, y = 0, color = "rgba(94,231,255,0.08)") {
    for (let i = -size; i <= size; i += step) { this.lines.push({ a: [i, y, -size], b: [i, y, size], color }); this.lines.push({ a: [-size, y, i], b: [size, y, i], color }); }
  }

  shadow(center: V3, rx: number, rz: number) { const n = 12; const pts: V3[] = Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return [center[0] + Math.cos(t) * rx, 0.005, center[2] + Math.sin(t) * rz]; }); this.faces.push({ pts, color: [0, 0, 0], alpha: 0.35 }); }

  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const L = norm([0.4, 1, 0.5] as V3);
    const items = this.faces.map((f) => { const ps = f.pts.map((p) => this.project(p, w, h)); const z = ps.reduce((a, p) => a + p.z, 0) / ps.length; let sh = 1; if (f.pts.length >= 3) { const n = norm(cross(sub(f.pts[1], f.pts[0]), sub(f.pts[2], f.pts[0]))); sh = 0.42 + 0.58 * Math.max(0, Math.abs(dot(n, L))); } return { f, ps, z, sh }; });
    items.sort((a, b) => b.z - a.z);
    for (const { f, ps, sh } of items) {
      ctx.beginPath(); ps.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath();
      const [r, g, b] = f.color; ctx.fillStyle = `rgba(${Math.round(r * sh)},${Math.round(g * sh)},${Math.round(b * sh)},${f.alpha ?? 1})`; ctx.fill();
      if (f.stroke) { ctx.strokeStyle = f.stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    for (const l of this.lines) { const a = this.project(l.a, w, h), b = this.project(l.b, w, h); ctx.strokeStyle = l.color; ctx.lineWidth = l.width ?? 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.lineWidth = 1;
    for (const p of this.points) { const q = this.project(p.p, w, h); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.7, p.size * q.s * 0.06), 0, Math.PI * 2); ctx.fill(); }
  }
}

export const STEEL: [number, number, number] = [126, 155, 190];
export const DARK: [number, number, number] = [38, 52, 74];
export const CYAN: [number, number, number] = [94, 231, 255];
export const AMBER: [number, number, number] = [255, 180, 84];
export const GREEN: [number, number, number] = [124, 243, 160];
export const VIOLET: [number, number, number] = [185, 156, 255];

// A 6-DoF arm posed by three joint angles; returns the tool-centre point.
export function armPose(sc: Scene3, base: V3, a0: number, a1: number, a2: number, a3: number) {
  const L = [1.05, 0.85, 0.32];
  const p0: V3 = [base[0], base[1] + 0.3, base[2]];
  const dir = (ang: number, len: number, from: V3): V3 => [from[0] + Math.cos(a0) * Math.cos(ang) * len, from[1] + Math.sin(ang) * len, from[2] + Math.sin(a0) * Math.cos(ang) * len];
  const p1 = dir(a1, L[0], p0);
  const p2 = dir(a1 + a2, L[1], p1);
  const p3 = dir(a1 + a2 + a3, L[2], p2);
  sc.box([base[0], base[1] + 0.1, base[2]], [0.8, 0.2, 0.8], DARK);
  sc.limb(p0, p1, 0.14, STEEL); sc.limb(p1, p2, 0.11, STEEL); sc.limb(p2, p3, 0.08, AMBER);
  [p0, p1, p2].forEach((p) => sc.sphere(p, 0.13, CYAN));
  return p3;
}
