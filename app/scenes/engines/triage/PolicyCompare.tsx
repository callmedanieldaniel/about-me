"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Two policies after the same disengagement, simulated side-by-side in 1D (following a braking lead): speed, gap and TTC traces plus the outcome.
function simulate(pol: { react: number; decel: number; ttc: number; headway: number }, T = 12, dt = 0.05) {
  const out = { t: [] as number[], v: [] as number[], gap: [] as number[], ttc: [] as number[], collided: false, minGap: Infinity, stopT: -1 };
  let x = 0, v = 15, lx = 35, lv = 15, brakeT = -1;
  for (let t = 0; t <= T; t += dt) {
    lv = t < 2 ? 15 : Math.max(0, lv - 6 * dt); lx += lv * dt;
    const gap = lx - x - 4.5; const ttc = v > lv ? gap / (v - lv) : Infinity;
    if (brakeT < 0 && (ttc < pol.ttc || gap < pol.headway * v)) brakeT = t;
    const braking = brakeT >= 0 && t - brakeT >= pol.react;
    v = Math.max(0, v - (braking ? pol.decel : 0) * dt); x += v * dt;
    if (gap <= 0) { out.collided = true; }
    out.minGap = Math.min(out.minGap, gap);
    if (v === 0 && out.stopT < 0) out.stopT = t;
    out.t.push(t); out.v.push(v); out.gap.push(Math.max(0, gap)); out.ttc.push(Math.min(10, ttc));
  }
  return out;
}

export default function PolicyCompare({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    let raf = 0, frames = 0, cur = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      const A = simulate({ react: Number(q.reactA), decel: Number(q.decelA), ttc: Number(q.ttcA), headway: 1.2 }), B = simulate({ react: Number(q.reactB), decel: Number(q.decelB), ttc: Number(q.ttcB), headway: 1.2 });
      if (play.current) cur = (cur + dt) % 12;
      const ci = Math.floor((cur / 12) * (A.t.length - 1));
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const ph = (h - 130) / 3;
      linePlot(ctx, { x: 16, y: 12, w: w - 32, h: ph }, [{ data: A.v, color: colors.live, label: "policy A speed" }, { data: B.v, color: colors.ref, label: "policy B speed" }], { title: "speed (m/s)", cursor: ci, min: 0 });
      linePlot(ctx, { x: 16, y: 20 + ph, w: w - 32, h: ph }, [{ data: A.gap, color: colors.live, label: "A gap" }, { data: B.gap, color: colors.ref, label: "B gap" }], { title: "gap to lead (m)", cursor: ci, min: 0 });
      linePlot(ctx, { x: 16, y: 28 + ph * 2, w: w - 32, h: ph }, [{ data: A.ttc, color: colors.live, label: "A TTC" }, { data: B.ttc, color: colors.ref, label: "B TTC" }], { title: "time to collision (s, capped 10)", cursor: ci, min: 0 });
      // outcome strip: 1D lane at the bottom
      const y = h - 70; ctx.fillStyle = "rgba(13,20,32,0.9)"; ctx.fillRect(16, y, w - 32, 60);
      const S = (w - 80) / 120; const car = (x: number, yy: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(40 + x * S, yy, 4.5 * S, 12); };
      let lx = 35, lv = 15; for (let t = 0; t <= cur; t += 0.05) { lv = t < 2 ? 15 : Math.max(0, lv - 6 * 0.05); lx += lv * 0.05; }
      car(lx, y + 8, colors.violet); car(lx, y + 34, colors.violet);
      let xa = 0, xb = 0; for (let i = 0; i <= ci; i++) { xa += A.v[i] * 0.05; xb += B.v[i] * 0.05; }
      car(xa, y + 8, A.collided && A.gap[ci] <= 0.01 ? colors.bad : colors.live); car(xb, y + 34, B.collided && B.gap[ci] <= 0.01 ? colors.bad : colors.ref);
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`A: ${A.collided ? "COLLISION" : `clear · min gap ${A.minGap.toFixed(1)} m`}`, 24, y + 18); ctx.fillText(`B: ${B.collided ? "COLLISION" : `clear · min gap ${B.minGap.toFixed(1)} m`}`, 24, y + 44);
      if ((frames++ & 15) === 0) onTelemetry({ "t (s)": cur, "A outcome": A.collided ? "collision" : "clear", "A min gap (m)": A.minGap, "B outcome": B.collided ? "collision" : "clear", "B min gap (m)": B.minGap, "A stop (s)": A.stopT >= 0 ? A.stopT : "—", "B stop (s)": B.stopT >= 0 ? B.stopT : "—" });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
