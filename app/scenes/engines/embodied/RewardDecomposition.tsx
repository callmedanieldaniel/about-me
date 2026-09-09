"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Reward decomposition: total reward over training split into shaped terms (reach, grasp, lift, penalty); re-weight terms and see which one dominates and when the policy "games" a term.
export default function RewardDecomposition({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(4); const N = 300;
    const base = { reach: Array.from({ length: N }, (_, i) => Math.min(1, i / 60) * (0.9 + rng() * 0.1)), grasp: Array.from({ length: N }, (_, i) => Math.max(0, Math.min(1, (i - 60) / 90)) * (0.8 + rng() * 0.2)), lift: Array.from({ length: N }, (_, i) => Math.max(0, Math.min(1, (i - 140) / 120)) * (0.7 + rng() * 0.3)), penalty: Array.from({ length: N }, (_, i) => -(0.4 * Math.exp(-i / 80) + 0.1 + rng() * 0.05)) };
    let raf = 0, frames = 0, reveal = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) reveal = Math.min(N, reveal + dt * 90);
      const q = p.current; const wgt = { reach: Number(q.wReach), grasp: Number(q.wGrasp), lift: Number(q.wLift), penalty: Number(q.wPenalty) };
      const n = Math.floor(reveal); const terms = (Object.keys(base) as (keyof typeof base)[]).map((k) => ({ k, data: base[k].slice(0, n).map((v) => v * wgt[k]) }));
      const total = Array.from({ length: n }, (_, i) => terms.reduce((s, t) => s + t.data[i], 0));
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const cols: Record<string, string> = { reach: colors.live, grasp: colors.ref, lift: colors.ok, penalty: colors.bad };
      const ph = (h - 40) / 2;
      linePlot(ctx, { x: 12, y: 12, w: w - 24, h: ph }, [...terms.map((t) => ({ data: t.data, color: cols[t.k], label: `${t.k} ×${wgt[t.k]}` })), { data: total, color: colors.fg, label: "total", width: 2.5 }], { title: "reward terms over training iterations" });
      // stacked share
      const y0 = 24 + ph; ctx.fillStyle = "rgba(13,20,32,0.85)"; ctx.fillRect(12, y0, w - 24, ph); ctx.strokeStyle = colors.line; ctx.strokeRect(12.5, y0 + 0.5, w - 25, ph - 1);
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("share of positive reward per term (stacked)", 20, y0 + 14);
      for (let i = 0; i < n; i++) { const pos = terms.filter((t) => t.data[i] > 0); const sum = pos.reduce((s, t) => s + t.data[i], 0) || 1; let acc = 0; const x = 20 + (i / N) * (w - 40); for (const t of pos) { const hh = (t.data[i] / sum) * (ph - 30); ctx.fillStyle = cols[t.k]; ctx.globalAlpha = 0.8; ctx.fillRect(x, y0 + ph - 8 - acc - hh, (w - 40) / N + 0.5, hh); acc += hh; } }
      ctx.globalAlpha = 1;
      const dom = n ? terms.reduce((m, t) => (t.data[n - 1] > m.data[n - 1] ? t : m), terms[0]).k : "—";
      if ((frames++ & 15) === 0) onTelemetry({ Iteration: n, "Total reward": total[n - 1] ?? 0, "Dominant term": dom, "Penalty share %": n ? (100 * Math.abs(terms[3].data[n - 1])) / Math.max(1e-6, Math.abs(total[n - 1])) : 0, "Lift started at": base.lift.findIndex((v) => v > 0.05) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
