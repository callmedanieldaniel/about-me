"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Data-loop pipeline: stages from fleet logs to deployed model as a live flow (particles = batches), with per-stage throughput, backlog and failure rates; a funnel shows how many frames survive to training.
const STAGES = ["fleet logs", "ingest", "trigger mining", "auto-label", "human QA", "dataset", "training", "eval", "deploy"];
export default function Pipeline({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(2);
    type P = { s: number; f: number; id: number }; let parts: P[] = []; const backlog = STAGES.map(() => 0); const done = STAGES.map(() => 0); const failed = STAGES.map(() => 0);
    let t = 0, last = performance.now(), raf = 0, frames = 0, nid = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const rate = Number(q.rate), qaCap = Number(q.qaCapacity), failP = Number(q.failRate);
      if (play.current) { t += dt; if (rng() < rate * dt) parts.push({ s: 0, f: 0, id: nid++ }); const cap = STAGES.map((_, i) => (i === 4 ? qaCap : 30)); const moving = STAGES.map(() => 0);
        for (const pt of parts) { const speed = 0.5 + (pt.id % 3) * 0.1; if (moving[pt.s] < cap[pt.s]) { pt.f += dt * speed; moving[pt.s]++; } if (pt.f >= 1) { if (rng() < failP && pt.s > 1 && pt.s < 8) { failed[pt.s]++; pt.s = -1; } else { done[pt.s]++; pt.s++; pt.f = 0; } } }
        parts = parts.filter((pt) => pt.s >= 0 && pt.s < STAGES.length); STAGES.forEach((_, i) => (backlog[i] = parts.filter((pt) => pt.s === i && pt.f === 0).length)); }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const n = STAGES.length, gap = (w - 40) / n, y = h * 0.32; ctx.font = "11px 'IBM Plex Mono', monospace";
      STAGES.forEach((s, i) => { const x = 20 + i * gap; const hot = backlog[i] > 8; ctx.fillStyle = hot ? "rgba(255,93,115,0.2)" : "rgba(13,20,32,0.9)"; ctx.strokeStyle = hot ? colors.bad : colors.line; ctx.beginPath(); ctx.roundRect(x, y - 24, gap - 14, 48, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = colors.fg; ctx.fillText(s, x + 8, y - 6); ctx.fillStyle = colors.muted; ctx.fillText(`✓${done[i]} ✗${failed[i]} ⏳${backlog[i]}`, x + 8, y + 12); if (i < n - 1) { ctx.strokeStyle = colors.line; ctx.beginPath(); ctx.moveTo(x + gap - 14, y); ctx.lineTo(x + gap, y); ctx.stroke(); } });
      for (const pt of parts) { const x = 20 + pt.s * gap + pt.f * (gap - 14); ctx.fillStyle = pt.s === 4 ? colors.ref : colors.live; ctx.beginPath(); ctx.arc(x + 8, y + 30 + (pt.id % 5) * 4, 3, 0, Math.PI * 2); ctx.fill(); }
      // funnel
      const fy = h * 0.58, fh = h - fy - 30; ctx.fillStyle = colors.fg; ctx.fillText("funnel · items that reached each stage", 20, fy - 8);
      const maxD = Math.max(1, done[0]); STAGES.forEach((_, i) => { const x = 20 + i * gap; const hh = (done[i] / maxD) * fh; ctx.fillStyle = `hsl(${190 + i * 8} 80% 60% / 0.7)`; ctx.fillRect(x, fy + fh - hh, gap - 14, hh); ctx.fillStyle = colors.muted; ctx.fillText(done[i] ? `${((100 * done[i]) / maxD).toFixed(0)}%` : "", x + 8, fy + fh - hh - 4); });
      if ((frames++ & 15) === 0) onTelemetry({ "t (s)": t, "In flight": parts.length, "QA backlog": backlog[4], "Deployed": done[8], "Yield to training %": done[0] ? (100 * done[6]) / done[0] : 0, "Failures": failed.reduce((a, b) => a + b, 0) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
