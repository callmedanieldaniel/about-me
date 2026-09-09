"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, heat } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Liquidation heatmap: leveraged positions opened along a random-walk price imply liquidation levels (long below, short above); the map accumulates over time and price hunts the densest band.
export default function Liquidation({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(13); const BINS = 160, W = 240; const price: number[] = [100]; const map: Float32Array[] = []; let warm = 0; let raf = 0, frames = 0, acc = 0, last = performance.now(), liqTotal = 0;
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const vol = Number(q.vol), lev = Number(q.leverage), bias = Number(q.bias);
      if (warm < 1) { warm = 1; acc += 24; }
      if (play.current) { acc += dt * Number(q.speed); while (acc > 0.1) { acc -= 0.1; const last = price[price.length - 1]; const col = map.length ? map[map.length - 1].slice() : new Float32Array(BINS); col.forEach((v, i) => (col[i] = v * 0.985));
        for (let k = 0; k < 6; k++) { const long = rng() < 0.5 + bias; const size = rng(); const liq = long ? last * (1 - 1 / lev) : last * (1 + 1 / lev); const bi = Math.round(((liq - 60) / 80) * BINS); if (bi >= 0 && bi < BINS) col[bi] += size * (long ? 1 : -1); }
        // price drifts toward densest liquidity within ±8%
        let best = 0, bd = 0; for (let i = 0; i < BINS; i++) { const pv = 60 + (i / BINS) * 80; if (Math.abs(pv - last) / last < 0.08 && Math.abs(col[i]) > bd) { bd = Math.abs(col[i]); best = pv; } }
        const hunt = Number(q.hunt); const next = last * (1 + (rng() - 0.5) * vol * 0.02) + (best ? (best - last) * hunt * 0.05 : 0); const cur = Math.round(((next - 60) / 80) * BINS); if (cur >= 0 && cur < BINS) { liqTotal += Math.abs(col[cur]); col[cur] = 0; }
        price.push(next); map.push(col); if (price.length > W) { price.shift(); map.shift(); } } }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const pw = w - 80, ph = h - 40; const X = (i: number) => 60 + (i / W) * pw, Y = (pr: number) => 20 + (1 - (pr - 60) / 80) * ph;
      map.forEach((col, ci) => { for (let i = 0; i < BINS; i++) { const v = col[i]; if (Math.abs(v) < 0.05) continue; ctx.fillStyle = v > 0 ? `rgba(94,231,255,${Math.min(1, v / 4)})` : `rgba(255,93,115,${Math.min(1, -v / 4)})`; ctx.fillRect(X(ci), Y(60 + ((i + 1) / BINS) * 80), pw / W + 0.5, ph / BINS + 0.5); } });
      ctx.strokeStyle = colors.ref; ctx.lineWidth = 2; ctx.beginPath(); price.forEach((pr, i) => (i ? ctx.lineTo(X(i), Y(pr)) : ctx.moveTo(X(i), Y(pr)))); ctx.stroke();
      ctx.fillStyle = colors.muted; ctx.font = "11px 'IBM Plex Mono', monospace"; [60, 80, 100, 120, 140].forEach((v) => ctx.fillText(String(v), 20, Y(v) + 4)); ctx.fillStyle = colors.fg; ctx.fillText("cyan = long liquidation levels · red = short · amber = price · leverage " + lev + "×", 60, h - 8);
      void heat; if ((frames++ & 15) === 0) onTelemetry({ Price: price[price.length - 1], "Leverage": lev, "Long bias": bias, "Liquidated (notional)": liqTotal, Columns: map.length });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
