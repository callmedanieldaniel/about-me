"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Dataset statistics: class histogram with long tail (log toggle), scene attribute distributions (weather / time / geography) and a version diff (v12 → v13) with added/removed counts.
export default function DatasetStats({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(7);
    const classes = ["car", "pedestrian", "truck", "cyclist", "bus", "motorcycle", "traffic cone", "animal", "debris", "emergency vehicle", "stroller", "wheelchair"];
    const v12 = classes.map((_, i) => Math.round(120000 * Math.exp(-i * 0.75) * (0.8 + rng() * 0.4)));
    const v13 = v12.map((v, i) => Math.round(v * (1.05 + (i > 6 ? 0.6 + rng() * 0.6 : rng() * 0.1))));
    const attrs = { weather: [["clear", 62], ["rain", 18], ["fog", 7], ["snow", 5], ["night-rain", 8]], time: [["day", 58], ["dusk", 14], ["night", 28]], region: [["urban", 55], ["highway", 30], ["rural", 15]] } as Record<string, [string, number][]>;
    let raf = 0, frames = 0, reveal = 0, last = performance.now();
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; reveal = Math.min(1, reveal + dt * 1.2); const q = p.current; const log = Boolean(q.log); const ver = String(q.version);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); ctx.font = "11px 'IBM Plex Mono', monospace";
      const data = ver === "v13" ? v13 : v12; const maxV = Math.max(...v13); const lx = 110, bw = w * 0.55 - lx, rowH = (h * 0.62) / classes.length;
      ctx.fillStyle = colors.fg; ctx.fillText(`class distribution · ${ver} · ${log ? "log" : "linear"} scale`, lx, 20);
      classes.forEach((cl, i) => { const y = 34 + i * rowH; const v = data[i]; const len = (log ? Math.log10(v + 1) / Math.log10(maxV + 1) : v / maxV) * bw * reveal; ctx.fillStyle = colors.muted; ctx.textAlign = "right"; ctx.fillText(cl, lx - 8, y + rowH * 0.65); ctx.textAlign = "left"; ctx.fillStyle = i > 6 ? colors.ref : colors.live; ctx.fillRect(lx, y + 2, len, rowH - 6); if (Boolean(q.diff)) { const d = v13[i] - v12[i]; ctx.fillStyle = d > 0 ? colors.ok : colors.bad; ctx.fillText(`${d > 0 ? "+" : ""}${d.toLocaleString()}`, lx + len + 6, y + rowH * 0.65); } else { ctx.fillStyle = colors.fg; ctx.fillText(v.toLocaleString(), lx + len + 6, y + rowH * 0.65); } });
      const tailShare = data.slice(7).reduce((a, b) => a + b, 0) / data.reduce((a, b) => a + b, 0); ctx.fillStyle = colors.ref; ctx.fillText(`long tail (last 5 classes) = ${(100 * tailShare).toFixed(2)}% of labels`, lx, 34 + classes.length * rowH + 14);
      // attributes as stacked bars
      const ax = w * 0.62, aw = w - ax - 20; let ay = 34; Object.entries(attrs).forEach(([k, vals]) => { ctx.fillStyle = colors.fg; ctx.fillText(k, ax, ay); let x = ax; vals.forEach(([n, pct], i) => { const ww = (pct / 100) * aw * reveal; ctx.fillStyle = [colors.live, colors.ref, colors.violet, colors.ok, colors.bad][i]; ctx.fillRect(x, ay + 6, ww, 18); if (ww > 34) { ctx.fillStyle = "#070b12"; ctx.fillText(`${n} ${pct}%`, x + 4, ay + 19); } x += ww; }); ay += 52; });
      ctx.fillStyle = colors.muted; ["night + rain = 8% but 31% of disengagements", "→ targeted collection trigger recommended", `v13 adds ${(v13.reduce((a, b) => a + b, 0) - v12.reduce((a, b) => a + b, 0)).toLocaleString()} labels, ${(100 * (v13.slice(7).reduce((a, b) => a + b, 0) / v12.slice(7).reduce((a, b) => a + b, 0) - 1)).toFixed(0)}% more tail`].forEach((s, i) => ctx.fillText(s, ax, ay + i * 16));
      if ((frames++ & 15) === 0) onTelemetry({ Version: ver, "Total labels": data.reduce((a, b) => a + b, 0), Classes: classes.length, "Tail share %": tailShare * 100, "Night %": 28, "Δ labels v12→v13": v13.reduce((a, b) => a + b, 0) - v12.reduce((a, b) => a + b, 0) });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
