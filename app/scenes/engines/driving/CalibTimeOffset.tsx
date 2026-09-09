"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Time-offset diagnosis: LiDAR-derived and camera-derived lateral position of a passing car diverge when the sensors are not synchronized.
// Cross-correlation of the two signals estimates the offset.
export default function CalibTimeOffset({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(9);
    const N = 400, dtS = 0.02; // 8 s at 50 Hz
    const truth = Array.from({ length: N }, (_, i) => { const t = i * dtS; return 6 * Math.sin(t * 1.1) + 2 * Math.sin(t * 3.3 + 1); });
    let t = 0, last = performance.now(), raf = 0, frames = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (play.current) t += dt;
      const q = p.current;
      const offset = Number(q.offset); // camera lag in ms
      const noise = Number(q.noise);
      const shift = Math.round(offset / 1000 / dtS);
      const lidar = truth.map((v) => v + (rng() - 0.5) * noise);
      const cam = truth.map((_, i) => truth[Math.max(0, Math.min(N - 1, i - shift))] + (rng() - 0.5) * noise * 1.5);
      // cross-correlation
      let bestLag = 0, best = -Infinity; const xc: number[] = [];
      for (let lag = -40; lag <= 40; lag++) { let s = 0, n = 0; for (let i = 0; i < N; i++) { const j = i + lag; if (j < 0 || j >= N) continue; s += lidar[i] * cam[j]; n++; } const v = s / Math.max(1, n); xc.push(v); if (v > best) { best = v; bestLag = lag; } }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const cur = Math.floor(((t * 0.5) % 1) * (N - 1));
      const ph = (h - 40) / 3;
      linePlot(ctx, { x: 12, y: 12, w: w - 24, h: ph }, [{ data: lidar, color: colors.live, label: "LiDAR lateral (m)" }, { data: cam, color: colors.ref, label: "camera lateral (m)" }], { title: "same object, two sensors", cursor: cur });
      const diff = lidar.map((v, i) => v - cam[i]);
      linePlot(ctx, { x: 12, y: 20 + ph, w: w - 24, h: ph }, [{ data: diff, color: colors.bad, label: "difference (m)" }], { title: "LiDAR − camera", cursor: cur });
      linePlot(ctx, { x: 12, y: 28 + ph * 2, w: w - 24, h: ph }, [{ data: xc, color: colors.ok, label: "cross-correlation vs lag" }], { title: `cross-correlation · peak at ${(-bestLag * dtS * 1000).toFixed(0)} ms`, cursor: bestLag + 40 });
      const rms = Math.sqrt(diff.reduce((s, v) => s + v * v, 0) / N);
      if ((frames++ & 7) === 0) onTelemetry({ "Injected offset (ms)": offset, "Estimated offset (ms)": -bestLag * dtS * 1000, "RMS difference (m)": rms, "Object speed (m/s)": Number(q.speed), "Error @speed (m)": (Number(q.speed) * offset) / 1000 });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
