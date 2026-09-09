"use client";
import { useEffect, useRef } from "react";
import { fleet, mine, rules, score } from "../../kit/fleet";
import { colors, fitCanvas, heat } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Rule editor: sweep one threshold and see precision/recall trade-off; a 2D grid of two thresholds shows F1 as a heatmap, current setting marked.
export default function RuleEditor({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const drives = fleet();
    const brakes = Array.from({ length: 12 }, (_, i) => 0.2 + i * 0.06), accels = Array.from({ length: 12 }, (_, i) => 1 + i * 0.5);
    const grid = brakes.map((b) => accels.map((a) => { const s = score(mine(drives, rules({ brake: b, accel: a, dropHz: 5, steerRate: 0.08 })), drives); return (2 * s.precision * s.recall) / Math.max(1e-6, s.precision + s.recall); }));
    let raf = 0, frames = 0, lastKey = "", cur = { p: 0, r: 0, f1: 0, n: 0 }, curve: { x: number; p: number; r: number }[] = [];
    const draw = () => {
      const q = p.current; const key = `${q.brake}|${q.accel}|${q.dropHz}|${q.steerRate}`;
      if (key !== lastKey) { lastKey = key; const s = score(mine(drives, rules({ brake: Number(q.brake), accel: Number(q.accel), dropHz: Number(q.dropHz), steerRate: Number(q.steerRate) })), drives); cur = { p: s.precision, r: s.recall, f1: (2 * s.precision * s.recall) / Math.max(1e-6, s.precision + s.recall), n: s.tp + s.fp }; curve = brakes.map((b) => { const t = score(mine(drives, rules({ brake: b, accel: Number(q.accel), dropHz: Number(q.dropHz), steerRate: Number(q.steerRate) })), drives); return { x: b, p: t.precision, r: t.recall }; }); }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      // left: PR curve vs brake threshold
      const lw = w * 0.5 - 24, lx = 16, ly = 30, lh = h - 60;
      ctx.fillStyle = "rgba(13,20,32,0.9)"; ctx.fillRect(lx, ly, lw, lh); ctx.strokeStyle = colors.line; ctx.strokeRect(lx, ly, lw, lh);
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("precision (cyan) & recall (amber) vs brake threshold", lx, 20);
      const X = (v: number) => lx + ((v - 0.2) / 0.66) * lw, Y = (v: number) => ly + lh - v * lh;
      for (const [k, col] of [["p", colors.live], ["r", colors.ref]] as const) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); curve.forEach((pt, i) => (i ? ctx.lineTo(X(pt.x), Y(pt[k])) : ctx.moveTo(X(pt.x), Y(pt[k])))); ctx.stroke(); }
      ctx.strokeStyle = colors.fg; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(Number(q.brake)), ly); ctx.lineTo(X(Number(q.brake)), ly + lh); ctx.stroke(); ctx.setLineDash([]);
      [0, 0.5, 1].forEach((v) => { ctx.fillStyle = colors.muted; ctx.fillText(v.toFixed(1), lx + 4, Y(v) + (v ? 12 : -4)); });
      // right: F1 heatmap brake × accel
      const rx = w * 0.5 + 8, rw = w - rx - 16, cell = Math.min(rw / accels.length, lh / brakes.length);
      ctx.fillStyle = colors.fg; ctx.fillText("F1 heatmap · rows: brake threshold · cols: decel threshold", rx, 20);
      brakes.forEach((b, i) => accels.forEach((a, j) => { ctx.fillStyle = heat(grid[i][j]); ctx.fillRect(rx + j * cell, ly + i * cell, cell - 1, cell - 1); }));
      const bi = brakes.findIndex((b) => Math.abs(b - Number(q.brake)) < 0.031), ai = accels.findIndex((a) => Math.abs(a - Number(q.accel)) < 0.26);
      if (bi >= 0 && ai >= 0) { ctx.strokeStyle = colors.fg; ctx.lineWidth = 2; ctx.strokeRect(rx + ai * cell, ly + bi * cell, cell - 1, cell - 1); }
      ctx.fillStyle = colors.muted; brakes.forEach((b, i) => { if (i % 3 === 0) ctx.fillText(b.toFixed(2), rx - 34, ly + i * cell + cell * 0.7); }); accels.forEach((a, j) => { if (j % 3 === 0) ctx.fillText(a.toFixed(1), rx + j * cell, ly + brakes.length * cell + 14); });
      if ((frames++ & 15) === 0) onTelemetry({ "Events mined": cur.n, Precision: cur.p, Recall: cur.r, F1: cur.f1, "Best F1 in grid": Math.max(...grid.flat()) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
