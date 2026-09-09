"use client";
import { useEffect, useRef } from "react";
import { mulberry32 } from "../scenes/kit/rng";
import { scenePreviews } from "./scenePreviews";

// Live procedural previews of each domain, drawn on a small canvas. Cheap enough to run twelve at once.
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, r: () => number) => void;
const C = { live: "#5ee7ff", ref: "#ffb454", ok: "#7cf3a0", bad: "#ff5d73", violet: "#b99cff", muted: "#7e90a8", fg: "#e6eef8" };

const draws: Record<string, Draw> = {
  driving: (ctx, w, h, t, r) => {
    const cx = w * 0.5, cy = h * 0.6; ctx.strokeStyle = "rgba(94,231,255,0.15)"; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, k * w * 0.16, k * h * 0.11, 0, 0, Math.PI * 2); ctx.stroke(); }
    const a = t * 1.6; for (let i = 0; i < 220; i++) { const ang = (i / 220) * Math.PI * 2; const d = ((ang - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); const fade = 1 - d / (Math.PI * 2); const rr = 0.35 + r() * 0.6; const bx = cx + Math.cos(ang) * rr * w * 0.48, by = cy + Math.sin(ang) * rr * h * 0.33; ctx.fillStyle = `rgba(94,231,255,${fade * 0.9})`; ctx.fillRect(bx, by, 2, 2); }
    ctx.strokeStyle = C.live; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * h * 0.35); ctx.stroke();
    ctx.fillStyle = C.ref; ctx.fillRect(cx - 6, cy - 3, 12, 6);
    [[0.25, 0.3], [0.7, 0.45], [0.55, 0.85]].forEach(([x, y], i) => { const px = w * x + Math.sin(t + i) * 6, py = h * y; ctx.strokeStyle = C.ok; ctx.strokeRect(px - 9, py - 5, 18, 10); });
  },
  triage: (ctx, w, h, t, r) => {
    const lanes = 5; for (let l = 0; l < lanes; l++) { const y = 14 + l * ((h - 28) / lanes); ctx.fillStyle = "rgba(13,20,32,0.9)"; ctx.fillRect(10, y, w - 20, (h - 28) / lanes - 6); for (let k = 0; k < 6; k++) { const x = 10 + ((r() * (w - 20) + t * 18) % (w - 20)); ctx.fillStyle = [C.bad, C.ref, C.violet, C.live][Math.floor(r() * 4)]; ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x + 4, y + 9); ctx.lineTo(x, y + 15); ctx.lineTo(x - 4, y + 9); ctx.closePath(); ctx.fill(); } }
    const cx = 10 + ((t * 30) % (w - 20)); ctx.strokeStyle = C.fg; ctx.beginPath(); ctx.moveTo(cx, 8); ctx.lineTo(cx, h - 8); ctx.stroke();
  },
  geo: (ctx, w, h, t, r) => {
    ctx.strokeStyle = "rgba(94,231,255,0.12)"; for (let x = 0; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, v = r(); const hh = 6 + v * 26 * (0.7 + 0.3 * Math.sin(t * 2 + i)); ctx.fillStyle = v > 0.7 ? C.bad : v > 0.4 ? C.ref : C.live; ctx.globalAlpha = 0.8; ctx.fillRect(x - 4, y - hh, 8, hh); ctx.globalAlpha = 0.35; ctx.fillRect(x - 4, y - 3, 8, 3); ctx.globalAlpha = 1; }
    for (let i = 0; i < 5; i++) { const x0 = r() * w, y0 = r() * h, x1 = r() * w, y1 = r() * h; ctx.strokeStyle = C.violet; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 40, x1, y1); ctx.stroke(); const s = (t * 0.3 + i * 0.2) % 1; const u = 1 - s; ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(u * u * x0 + 2 * u * s * ((x0 + x1) / 2) + s * s * x1, u * u * y0 + 2 * u * s * (Math.min(y0, y1) - 40) + s * s * y1, 2.5, 0, Math.PI * 2); ctx.fill(); }
  },
  embodied: (ctx, w, h, t) => {
    const bx = w * 0.35, by = h * 0.85; const a1 = -1.2 + Math.sin(t * 0.9) * 0.5, a2 = 1.4 + Math.cos(t * 1.1) * 0.6, a3 = 0.6 + Math.sin(t * 1.4) * 0.5; const L = [h * 0.34, h * 0.3, h * 0.16];
    let x = bx, y = by, a = a1; const pts = [[x, y]]; for (let i = 0; i < 3; i++) { x += Math.cos(a) * L[i]; y += Math.sin(a) * L[i]; pts.push([x, y]); a += [a2, a3, 0][i]; }
    ctx.fillStyle = "#101a2a"; ctx.fillRect(0, by, w, 4);
    ctx.lineCap = "round"; ctx.lineWidth = 9; ctx.strokeStyle = "#27394f"; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = C.live; ctx.stroke(); ctx.lineWidth = 1;
    pts.forEach(([px, py]) => { ctx.fillStyle = C.ref; ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill(); });
    const [ex, ey] = pts[3]; ctx.strokeStyle = C.ok; ctx.strokeRect(ex - 6, ey - 6, 12, 12);
    for (let i = 0; i < 60; i++) { const ang = i * 2.4, rr = Math.sqrt(i / 60) * w * 0.4; ctx.fillStyle = `rgba(124,243,160,${0.25 + 0.2 * Math.sin(t * 2 + i)})`; ctx.fillRect(bx + Math.cos(ang) * rr, by - Math.abs(Math.sin(ang)) * rr, 2, 2); }
  },
  simulation: (ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38; ctx.strokeStyle = "#1c2a3d"; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    for (let i = 0; i < 28; i++) { const s = (i / 28) * Math.PI * 2; const jam = Math.sin(s * 3 - t * 0.8); const ang = s + t * (0.6 + 0.25 * jam); const col = jam > 0.6 ? C.bad : jam > 0.1 ? C.ref : C.live; ctx.fillStyle = col; ctx.save(); ctx.translate(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.rotate(ang + Math.PI / 2); ctx.fillRect(-2.5, -5, 5, 10); ctx.restore(); }
    ctx.fillStyle = C.ref; const bx = cx + Math.sin(t * 2) * 10, byy = cy - Math.abs(Math.sin(t * 3)) * 20; ctx.fillRect(bx - 5, byy - 5, 10, 10);
  },
  annotation: (ctx, w, h, t, r) => {
    ctx.fillStyle = "#0e1626"; ctx.fillRect(0, 0, w, h * 0.55); for (let x = 0; x < w; x += 22) { const bh = h * (0.12 + ((x * 7) % 5) * 0.06); ctx.fillStyle = `hsl(215 30% ${16 + ((x * 3) % 4) * 4}%)`; ctx.fillRect(x, h * 0.55 - bh, 16, bh); } ctx.fillStyle = "#1a2333"; ctx.fillRect(0, h * 0.55, w, h * 0.45); ctx.fillStyle = "#3b4d68"; ctx.fillRect(w * 0.25, h * 0.7, w * 0.16, h * 0.14); ctx.fillStyle = "#4a6b5a"; ctx.fillRect(w * 0.62, h * 0.62, w * 0.22, h * 0.2);
    ctx.strokeStyle = "#c8d2df"; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.55); ctx.lineTo(w * 0.1, h); ctx.moveTo(w * 0.5, h * 0.55); ctx.lineTo(w * 0.9, h); ctx.stroke(); ctx.setLineDash([]);
    const boxes: [number, number, number, number, string][] = [[0.25, 0.7, 0.16, 0.14, C.live], [0.62, 0.62, 0.22, 0.2, C.live], [0.15, 0.55, 0.05, 0.14, C.bad]]; boxes.forEach(([x, y, bw, bh, col], i) => { const drawn = Math.min(1, Math.max(0, (t * 0.5 - i * 0.6) % 4)); const px = x * w, py = y * h; ctx.strokeStyle = col; ctx.fillStyle = col + "33"; ctx.fillRect(px, py, bw * w * drawn, bh * h * drawn); ctx.strokeRect(px, py, bw * w * drawn, bh * h * drawn); });
    const mx = w * 0.5 + Math.sin(t) * w * 0.3, my = h * 0.5 + Math.cos(t * 0.7) * h * 0.25; ctx.strokeStyle = "rgba(230,238,248,0.35)"; ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, h); ctx.moveTo(0, my); ctx.lineTo(w, my); ctx.stroke(); void r;
  },
  dataloop: (ctx, w, h, t, r) => {
    const n = 6; const gap = (w - 20) / n; const y = h * 0.4; for (let i = 0; i < n; i++) { const x = 10 + i * gap; ctx.fillStyle = "rgba(13,20,32,0.9)"; ctx.strokeStyle = i === 3 && Math.sin(t * 3) > 0 ? C.bad : "#1c2a3d"; ctx.beginPath(); ctx.roundRect(x, y - 12, gap - 8, 24, 5); ctx.fill(); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const s = (r() + t * 0.12) % 1; const x = 10 + s * (w - 20); ctx.fillStyle = s > 0.5 && s < 0.66 ? C.ref : C.live; ctx.beginPath(); ctx.arc(x, y + 22 + (i % 4) * 5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < n; i++) { const hh = (1 - i / n) * h * 0.3 * (0.8 + 0.2 * Math.sin(t + i)); ctx.fillStyle = `hsl(${200 + i * 10} 80% 60% / 0.7)`; ctx.fillRect(10 + i * gap, h - 8 - hh, gap - 8, hh); }
  },
  spatial: (ctx, w, h, t, r) => {
    const cx = w / 2, cy = h / 2; for (let i = 0; i < 700; i++) { const u = r(), v = r(); const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1); const R = 0.22 * Math.min(w, h) * (i % 3 === 0 ? 1.6 : 1); let x = Math.sin(ph) * Math.cos(th) * R, y = Math.cos(ph) * R * 0.6, z = Math.sin(ph) * Math.sin(th) * R; const rot = t * 0.5; const xr = x * Math.cos(rot) - z * Math.sin(rot), zr = x * Math.sin(rot) + z * Math.cos(rot); const s = 1 + zr / (R * 2); ctx.fillStyle = i % 3 === 0 ? `rgba(255,180,84,${0.25 * s})` : `rgba(94,231,255,${0.5 * s})`; ctx.beginPath(); ctx.arc(cx + xr, cy + y, 2.2 * s, 0, Math.PI * 2); ctx.fill(); }
  },
  ai: (ctx, w, h, t) => {
    const n = 9; const xs = Array.from({ length: n }, (_, i) => 14 + (i / (n - 1)) * (w - 28)); const y = h * 0.7;
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const a = 0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.7 - j * 1.1); if (a < 0.55) continue; ctx.strokeStyle = `rgba(94,231,255,${(a - 0.5) * 1.6})`; ctx.lineWidth = 1 + (a - 0.5) * 3; ctx.beginPath(); ctx.moveTo(xs[i], y); ctx.quadraticCurveTo((xs[i] + xs[j]) / 2, y - (xs[i] - xs[j]) * 0.8, xs[j], y); ctx.stroke(); }
    ctx.lineWidth = 1; xs.forEach((x, i) => { ctx.fillStyle = i === Math.floor(t * 1.5) % n ? C.ref : C.fg; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#101a2a"; ctx.fillRect(x - 8, y + 8, 16, 10); });
  },
  markets: (ctx, w, h, t, r) => {
    const mid = w / 2; for (let i = 0; i < 24; i++) { const d = i / 24; const bh = (0.2 + d * 0.8) * h * 0.7 * (0.9 + 0.1 * Math.sin(t * 4 + i)); ctx.fillStyle = "rgba(124,243,160,0.7)"; ctx.fillRect(mid - 4 - i * 6, h - 8 - bh, 5, bh); ctx.fillStyle = "rgba(255,93,115,0.7)"; ctx.fillRect(mid + 1 + i * 6, h - 8 - bh * (0.85 + 0.15 * r()), 5, bh * (0.85 + 0.15 * r())); }
    let px = 8, py = h * 0.35; ctx.strokeStyle = C.ref; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, py); for (let i = 1; i < 40; i++) { px = 8 + (i / 39) * (w - 16); py += (r() - 0.5) * 10 + Math.sin(t + i * 0.3) * 1.5; ctx.lineTo(px, py); } ctx.stroke(); ctx.lineWidth = 1;
  },
  science: (ctx, w, h, t) => {
    let x = 0.1, y = 0, z = 0; const sg = 10, rho = 28, b = 8 / 3; const dt = 0.01; const N = 1800; const skip = Math.floor(t * 40) % 400; const cx = w / 2, cy = h * 0.95; ctx.strokeStyle = C.live; ctx.beginPath();
    for (let i = 0; i < N + skip; i++) { const dx = sg * (y - x), dy = x * (rho - z) - y, dz = x * y - b * z; x += dx * dt; y += dy * dt; z += dz * dt; if (i < skip) continue; const px = cx + x * (w / 60), py = cy - z * (h / 55); const hue = 190 + ((i - skip) / N) * 120; ctx.strokeStyle = `hsl(${hue} 90% 65% / 0.8)`; if (i === skip) ctx.moveTo(px, py); else { ctx.lineTo(px, py); ctx.stroke(); ctx.beginPath(); ctx.moveTo(px, py); } }
  },
  industry: (ctx, w, h, t, r) => {
    const nodes = [[0.1, 0.5], [0.3, 0.2], [0.3, 0.8], [0.55, 0.35], [0.55, 0.65], [0.8, 0.2], [0.8, 0.8], [0.93, 0.5]]; const edges = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7], [3, 4], [1, 2]];
    edges.forEach(([a, b], i) => { const [ax, ay] = nodes[a], [bx, by] = nodes[b]; const load = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + i)); ctx.strokeStyle = load > 0.9 ? C.bad : load > 0.7 ? C.ref : "#27394f"; ctx.lineWidth = 1 + load * 3; ctx.beginPath(); ctx.moveTo(ax * w, ay * h); ctx.lineTo(bx * w, by * h); ctx.stroke(); for (let k = 0; k < 3; k++) { const s = (t * 0.4 * load + k / 3 + r() * 0.01) % 1; ctx.fillStyle = C.live; ctx.beginPath(); ctx.arc(ax * w + (bx - ax) * w * s, ay * h + (by - ay) * h * s, 2, 0, Math.PI * 2); ctx.fill(); } });
    ctx.lineWidth = 1; nodes.forEach(([x, y], i) => { ctx.fillStyle = i === 0 || i === 7 ? C.ok : C.ref; ctx.beginPath(); ctx.arc(x * w, y * h, i === 0 || i === 7 ? 7 : 5, 0, Math.PI * 2); ctx.fill(); });
  },
};

export function Preview({ kind, className = "", seed = 1 }: { kind: string; className?: string; seed?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const alias: Record<string, string> = { embodied: "mujoco", spatial: "viewer", simulation: "physics", science: "dynamics", industry: "networks", markets: "microstructure", ai: "inside-models" };
    const draw = scenePreviews[alias[kind] ?? kind] ?? scenePreviews[kind] ?? draws[kind] ?? draws.spatial;
    let raf = 0, alive = true, visible = true; const t0 = performance.now();
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting)); io.observe(cv);
    const loop = (now: number) => { if (!alive) return; if (visible) { const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const ctx = cv.getContext("2d")!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); draw(ctx, w, h, (now - t0) / 1000, mulberry32(seed)); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }, [kind, seed]);
  return <canvas ref={ref} className={`preview ${className}`} aria-hidden="true" />;
}
