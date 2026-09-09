"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Training-run comparison: loss / mAP / lr curves for several runs with smoothing, log x, and a divergence detector that flags where a run leaves the envelope of the others.
export default function TrainingRuns({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(11); const N = 400;
    const runs = [{ name: "baseline", lr: 1e-3, c: colors.muted }, { name: "+tail-data", lr: 1e-3, c: colors.live }, { name: "lr 3e-3", lr: 3e-3, c: colors.ref }, { name: "+aug", lr: 1e-3, c: colors.ok }].map((r, k) => { const loss: number[] = [], map: number[] = [], lrs: number[] = []; let l = 2.4; for (let i = 0; i < N; i++) { const warm = Math.min(1, i / 30); const lr = r.lr * warm * 0.5 * (1 + Math.cos((Math.PI * i) / N)); l = l * (1 - lr * 8) + (0.25 + (k === 2 && i > 220 ? (i - 220) * 0.01 : 0)) * lr * 8 + (rng() - 0.5) * 0.04; loss.push(l); map.push(Math.max(0, Math.min(0.9, (1 - l / 2.4) * (0.7 + k * 0.05) - (k === 2 && i > 220 ? (i - 220) * 0.003 : 0)))); lrs.push(lr); } return { ...r, loss, map, lrs }; });
    let raf = 0, frames = 0, reveal = 0, last = performance.now();
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) reveal = Math.min(N, reveal + dt * 120); const q = p.current; const n = Math.max(2, Math.floor(reveal)); const win = Number(q.smooth);
      const sm = (a: number[]) => a.slice(0, n).map((_, i) => { let s = 0, k = 0; for (let j = Math.max(0, i - win + 1); j <= i; j++) { s += a[j]; k++; } return s / k; });
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const ph = (h - 40) / 3;
      const vis = runs.filter((r, i) => Boolean(q[`r${i}`] ?? true));
      linePlot(ctx, { x: 12, y: 12, w: w - 24, h: ph }, vis.map((r) => ({ data: sm(r.loss), color: r.c, label: r.name })), { title: `train loss · smoothing ${win}`, min: 0 });
      linePlot(ctx, { x: 12, y: 20 + ph, w: w - 24, h: ph }, vis.map((r) => ({ data: sm(r.map), color: r.c, label: r.name })), { title: "val mAP", min: 0, max: 1 });
      linePlot(ctx, { x: 12, y: 28 + ph * 2, w: w - 24, h: ph }, vis.map((r) => ({ data: r.lrs.slice(0, n), color: r.c, label: r.name })), { title: "learning rate (warmup + cosine)", min: 0 });
      // divergence detection: run whose loss exceeds median of others by > thr for 10 consecutive steps
      const thr = Number(q.divergence); let flagged = "none", at = -1; runs.forEach((r, i) => { let streak = 0; for (let s = 0; s < n; s++) { const others = runs.filter((_, j) => j !== i).map((o) => o.loss[s]).sort((a, b) => a - b); const med = others[Math.floor(others.length / 2)]; streak = r.loss[s] - med > thr ? streak + 1 : 0; if (streak >= 10 && at < 0) { flagged = r.name; at = s; } } });
      if (at >= 0) { const x = 20 + (at / (n - 1)) * (w - 40); ctx.strokeStyle = colors.bad; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, 12 + ph - 8); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = colors.bad; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`${flagged} diverges @ step ${at}`, x + 6, 44); }
      if ((frames++ & 15) === 0) onTelemetry({ Step: n, Runs: vis.length, "Best mAP": Math.max(...vis.map((r) => r.map[n - 1])), "Best run": vis.reduce((m, r) => (r.map[n - 1] > m.map[n - 1] ? r : m), vis[0])?.name ?? "—", Diverged: flagged, "Divergence threshold": thr });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
