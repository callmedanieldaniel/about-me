"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, heat } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Outcome matrix: sweep reaction delay × initial speed for the same braking-lead scenario, 1D sim per cell, color = min gap (red = collision); animated fill.
function run(react: number, v0: number, decel: number, ttcThr: number) {
  let x = 0, v = v0, lx = 35, lv = v0, brakeT = -1, minGap = Infinity;
  for (let t = 0; t <= 12; t += 0.05) { lv = t < 2 ? v0 : Math.max(0, lv - 6 * 0.05); lx += lv * 0.05; const gap = lx - x - 4.5; const ttc = v > lv ? gap / (v - lv) : Infinity; if (brakeT < 0 && ttc < ttcThr) brakeT = t; const b = brakeT >= 0 && t - brakeT >= react; v = Math.max(0, v - (b ? decel : 0) * 0.05); x += v * 0.05; minGap = Math.min(minGap, gap); if (gap <= 0) return 0; }
  return minGap;
}
export default function OutcomeMatrix({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const reacts = Array.from({ length: 14 }, (_, i) => i * 0.15), speeds = Array.from({ length: 14 }, (_, i) => 6 + i * 1.5);
    let raf = 0, frames = 0, reveal = 0, last = performance.now(), key = "", grid: number[][] = [];
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const k = `${q.decel}|${q.ttc}`; if (k !== key) { key = k; grid = reacts.map((r) => speeds.map((v) => run(r, v, Number(q.decel), Number(q.ttc)))); reveal = 0; }
      if (play.current) reveal = Math.min(reacts.length * speeds.length, reveal + dt * 120);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const mx = 90, my = 40, cell = Math.min((w - mx - 220) / speeds.length, (h - my - 50) / reacts.length);
      let collisions = 0;
      reacts.forEach((r, i) => speeds.forEach((v, j) => { const idx = i * speeds.length + j; if (idx > reveal) return; const g = grid[i][j]; if (g <= 0) collisions++; ctx.fillStyle = g <= 0 ? colors.bad : heat(0.35 + Math.min(1, g / 20) * 0.6); ctx.fillRect(mx + j * cell, my + i * cell, cell - 2, cell - 2); if (cell > 34) { ctx.fillStyle = "#070b12"; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillText(g <= 0 ? "hit" : g.toFixed(0), mx + j * cell + 4, my + i * cell + cell * 0.65); } }));
      ctx.fillStyle = colors.muted; ctx.font = "11px 'IBM Plex Mono', monospace"; reacts.forEach((r, i) => { if (i % 2 === 0) ctx.fillText(`${r.toFixed(2)} s`, 20, my + i * cell + cell * 0.7); }); speeds.forEach((v, j) => { if (j % 2 === 0) ctx.fillText(`${v} m/s`, mx + j * cell, my + reacts.length * cell + 16); });
      ctx.fillStyle = colors.fg; ctx.fillText("rows: reaction delay · cols: initial speed · red = collision, brighter = larger min gap", mx, 24);
      // legend + boundary annotation
      const lx = mx + speeds.length * cell + 24; ctx.fillStyle = colors.fg; ctx.fillText("safe envelope", lx, my + 10); ctx.fillStyle = colors.muted;
      const sentences = [`decel ${Number(q.decel)} m/s², brake at TTC < ${Number(q.ttc)} s`, `${collisions} / ${reacts.length * speeds.length} cells collide`, "each cell = one 12 s 1-D simulation", "reveal animates in scenario order"];
      sentences.forEach((s, i) => ctx.fillText(s, lx, my + 30 + i * 16));
      if ((frames++ & 15) === 0) onTelemetry({ Scenarios: reacts.length * speeds.length, Simulated: Math.floor(reveal), Collisions: collisions, "Collision %": (100 * collisions) / Math.max(1, Math.floor(reveal)), "Max safe speed @0.3s": (() => { const i = 2; const j = grid[i]?.findIndex((g) => g <= 0) ?? -1; return j > 0 ? speeds[j - 1] : j === 0 ? "none" : speeds[speeds.length - 1]; })() });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
