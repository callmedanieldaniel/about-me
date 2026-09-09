"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Fleet trends: weekly disengagements per 1,000 km stacked by cause, miles driven bars and a rolling-average line; animated draw-in.
export default function FleetTrends({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(12); const W = 26; const causes = ["perception", "planning", "localization", "control", "other"]; const cc = [colors.live, colors.ok, colors.violet, colors.ref, colors.muted];
    const weeks = Array.from({ length: W }, (_, i) => { const km = 8000 + i * 900 + rng() * 2000; const base = 3.2 * Math.exp(-i / 14) + 0.4; const byCause = causes.map((_, k) => Math.max(0.02, base * [0.38, 0.27, 0.12, 0.15, 0.08][k] * (0.7 + rng() * 0.6) * (k === 3 && i > 16 ? 1.9 : 1))); return { km, byCause, total: byCause.reduce((a, b) => a + b, 0) }; });
    let raf = 0, frames = 0, prog = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (play.current) prog = Math.min(1, prog + dt * 0.5);
      const q = p.current; const win = Number(q.window); const shown = Math.floor(prog * W);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const lx = 60, top = 40, plotH = h * 0.55, bw = (w - lx - 30) / W; const maxV = Math.max(...weeks.map((x) => x.total)) * 1.15;
      const Y = (v: number) => top + plotH - (v / maxV) * plotH;
      ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillStyle = colors.fg; ctx.fillText("disengagements per 1,000 km · stacked by root cause", lx, 22);
      for (let g = 0; g <= 4; g++) { const v = (maxV * g) / 4; ctx.strokeStyle = colors.line; ctx.beginPath(); ctx.moveTo(lx, Y(v)); ctx.lineTo(w - 30, Y(v)); ctx.stroke(); ctx.fillStyle = colors.muted; ctx.fillText(v.toFixed(1), 16, Y(v) + 4); }
      weeks.forEach((wk, i) => { if (i >= shown) return; let y = Y(0); causes.forEach((_, k) => { if (!Boolean(q[`c${k}`] ?? true)) return; const hh = (wk.byCause[k] / maxV) * plotH; ctx.fillStyle = cc[k]; ctx.globalAlpha = 0.85; ctx.fillRect(lx + i * bw + 2, y - hh, bw - 4, hh); y -= hh; }); ctx.globalAlpha = 1; });
      // rolling average line
      ctx.strokeStyle = colors.fg; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < shown; i++) { let s = 0, n = 0; for (let k = Math.max(0, i - win + 1); k <= i; k++) { s += weeks[k].total; n++; } const x = lx + i * bw + bw / 2; i ? ctx.lineTo(x, Y(s / n)) : ctx.moveTo(x, Y(s / n)); } ctx.stroke();
      // km bars below
      const ky = top + plotH + 40, kh = h - ky - 24; const maxKm = Math.max(...weeks.map((x) => x.km)); ctx.fillStyle = colors.fg; ctx.fillText("km driven per week", lx, ky - 8);
      weeks.forEach((wk, i) => { if (i >= shown) return; const hh = (wk.km / maxKm) * kh; ctx.fillStyle = "rgba(94,231,255,0.35)"; ctx.fillRect(lx + i * bw + 2, ky + kh - hh, bw - 4, hh); if (i % 5 === 0) { ctx.fillStyle = colors.muted; ctx.fillText(`W${i + 1}`, lx + i * bw + 2, h - 8); } });
      // legend
      causes.forEach((cz, k) => { ctx.fillStyle = cc[k]; ctx.fillRect(w - 150, 40 + k * 16, 10, 10); ctx.fillStyle = colors.fg; ctx.fillText(cz, w - 134, 49 + k * 16); });
      // annotation for the control regression
      if (shown > 18) { ctx.fillStyle = colors.ref; ctx.fillText("↑ control-related rise from W17 (v2.4 rollout)", lx + 17 * bw, top + 12); }
      if ((frames++ & 15) === 0) { const lastW = weeks[Math.max(0, shown - 1)]; onTelemetry({ "Weeks shown": shown, "Latest rate /1000 km": lastW.total, "Latest km": lastW.km, "Improvement vs W1 %": (100 * (1 - lastW.total / weeks[0].total)).toFixed(0), "Rolling window": win }); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
