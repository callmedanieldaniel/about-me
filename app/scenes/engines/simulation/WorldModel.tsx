"use client";
import { useEffect, useRef } from "react";
import { drawStreet } from "../../kit/synthimage";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// World model: recorded frames vs "generated" continuations (a procedural stand-in for a video world model) side by side; per-frame divergence is measured and grows with horizon and sampling temperature.
export default function WorldModel({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const off = [0, 1, 2].map(() => { const o = document.createElement("canvas"); o.width = 320; o.height = 180; return o; });
    let t = 0, last = performance.now(), raf = 0, frames = 0; const rng = mulberry32(6); const div: number[] = [];
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current) t += dt;
      const horizon = Number(q.horizon), temp = Number(q.temperature); const f = (t % horizon) / horizon; const seedT = Math.floor(t / horizon);
      // recorded: seed 3 shifted with time; generated: same seed for context then perturbed by temperature*f
      const cams = [{ name: "recorded", seed: 3, jitter: 0 }, { name: "generated · sample A", seed: 3, jitter: temp * f }, { name: "generated · sample B", seed: 3, jitter: temp * f * 1.3 }];
      let d1 = 0, d2 = 0;
      cams.forEach((cm, i) => { const ctx2 = off[i].getContext("2d")!; drawStreet(ctx2, 320, 180, cm.seed); ctx2.save(); const jx = cm.jitter * 40 * Math.sin(seedT + i * 2 + f * 6), jy = cm.jitter * 20 * Math.cos(seedT * 3 + i); ctx2.translate(jx, jy); ctx2.globalAlpha = Math.min(1, cm.jitter); if (cm.jitter > 0) { ctx2.fillStyle = "#ffb454"; for (let k = 0; k < Math.floor(cm.jitter * 6); k++) ctx2.fillRect(60 + ((k * 97 + seedT * 13) % 200), 100 + ((k * 53) % 40), 30 - k * 3, 14); } ctx2.restore(); if (i === 1) d1 = cm.jitter; if (i === 2) d2 = cm.jitter; });
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const cw = (w - 48) / 3, ch = cw * 0.5625; cams.forEach((cm, i) => { ctx.drawImage(off[i], 12 + i * (cw + 12), 12, cw, ch); ctx.strokeStyle = i ? colors.ref : colors.live; ctx.strokeRect(12.5 + i * (cw + 12), 12.5, cw - 1, ch - 1); ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`${cm.name} · frame ${Math.floor(f * 30 * horizon)}`, 18 + i * (cw + 12), 28); });
      if ((frames & 3) === 0) { div.push(Math.max(d1, d2)); if (div.length > 240) div.shift(); }
      linePlot(ctx, { x: 12, y: ch + 24, w: w - 24, h: h - ch - 36 }, [{ data: div, color: colors.bad, label: "max divergence from recorded (normalized)" }], { title: `divergence vs horizon · T=${temp} · horizon ${horizon}s (resets each rollout)`, min: 0, max: 2 });
      if ((frames++ & 15) === 0) onTelemetry({ Rollout: seedT, "Horizon (s)": horizon, Temperature: temp, "Divergence A": d1, "Divergence B": d2, "Consistency A–B": 1 - Math.abs(d1 - d2) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
