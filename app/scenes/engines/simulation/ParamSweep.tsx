"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, heat } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Parameter sweep / regression matrix: the cut-in scenario is run headless for cut-in distance × adversary speed on two software versions; cells show min gap, the diff view shows where the new version regressed.
function run(trigger: number, advSpeed: number, egoDecel: number, headway: number, egoSpeed: number) {
  let ex = 0, ev = egoSpeed, ax = 40, az = 3.5, av = advSpeed, fired = false, minGap = 1e9; const dt = 0.05;
  for (let t = 0; t < 15; t += dt) { if (!fired && ax - ex < trigger) fired = true; if (fired && az > 0) az = Math.max(0, az - 1.2 * dt); ax += av * dt; const gap = ax - ex - 4.5; const inLane = az < 1.8; const desired = ev * headway + 4; const targetV = inLane && gap < desired ? Math.max(0, av - (desired - gap) * 0.6) : egoSpeed; ev += Math.max(-egoDecel, Math.min(2, (targetV - ev) * 1.2)) * dt; ev = Math.max(0, ev); ex += ev * dt; if (inLane) { minGap = Math.min(minGap, gap); if (gap <= 0) return 0; } }
  return minGap;
}
export default function ParamSweep({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const triggers = Array.from({ length: 12 }, (_, i) => 8 + i * 3), speeds = Array.from({ length: 12 }, (_, i) => 8 + i * 2);
    let raf = 0, frames = 0, key = "", A: number[][] = [], B: number[][] = [];
    const draw = () => {
      const q = p.current; const k = `${q.decelA}|${q.decelB}|${q.headway}|${q.view}`;
      if (k !== key) { key = k; A = triggers.map((tr) => speeds.map((v) => run(tr, v, Number(q.decelA), Number(q.headway), 20))); B = triggers.map((tr) => speeds.map((v) => run(tr, v, Number(q.decelB), Number(q.headway), 20))); }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const view = String(q.view); const panels = view === "diff" ? [{ title: "Δ min gap (B − A) · red = regression", g: A.map((r, i) => r.map((v, j) => B[i][j] - v)), diff: true }] : [{ title: `A · decel ${Number(q.decelA)} m/s²`, g: A, diff: false }, { title: `B · decel ${Number(q.decelB)} m/s²`, g: B, diff: false }];
      const pw = (w - 60 - (panels.length - 1) * 30) / panels.length; let coll = [0, 0], reg = 0;
      panels.forEach((pn, pi) => { const mx = 60 + pi * (pw + 30), my = 40, cell = Math.min(pw / speeds.length, (h - my - 40) / triggers.length); ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(pn.title, mx, 24);
        triggers.forEach((tr, i) => speeds.forEach((v, j) => { const g = pn.g[i][j]; ctx.fillStyle = pn.diff ? (g < -0.5 ? `rgba(255,93,115,${Math.min(1, -g / 6)})` : g > 0.5 ? `rgba(124,243,160,${Math.min(1, g / 6)})` : "#0d1420") : g <= 0 ? colors.bad : heat(0.35 + Math.min(1, g / 25) * 0.6); ctx.fillRect(mx + j * cell, my + i * cell, cell - 2, cell - 2); if (pn.diff && g < -0.5) reg++; }));
        if (pi === 0) triggers.forEach((tr, i) => { if (i % 2 === 0) { ctx.fillStyle = colors.muted; ctx.fillText(`${tr} m`, 16, my + i * cell + cell * 0.7); } }); speeds.forEach((v, j) => { if (j % 3 === 0) { ctx.fillStyle = colors.muted; ctx.fillText(`${v} m/s`, mx + j * cell, my + triggers.length * cell + 14); } }); });
      coll = [A.flat().filter((g) => g <= 0).length, B.flat().filter((g) => g <= 0).length];
      ctx.fillStyle = colors.muted; ctx.fillText("rows: cut-in trigger distance · cols: adversary speed", 60, h - 8);
      if ((frames++ & 15) === 0) onTelemetry({ Scenarios: triggers.length * speeds.length, "A collisions": coll[0], "B collisions": coll[1], "Regressed cells (Δ < −0.5 m)": view === "diff" ? reg : A.flat().filter((g, i) => B.flat()[i] - g < -0.5).length, "Headway (s)": Number(q.headway) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
