"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Parallel environments: N cart-pole envs stepped in lockstep; a linear policy is improved by random-search hill climbing on the mean return (Isaac-Lab-style vectorized training, tiny version). Grid view like Viser/Isaac.
type Env = { x: number; v: number; th: number; w: number; t: number; ret: number; done: boolean };
function stepEnv(e: Env, force: number) { const g = 9.8, mc = 1, mp = 0.1, l = 0.5, dt = 0.02; const ct = Math.cos(e.th), st = Math.sin(e.th); const tmp = (force + mp * l * e.w * e.w * st) / (mc + mp); const tha = (g * st - ct * tmp) / (l * (4 / 3 - (mp * ct * ct) / (mc + mp))); const xa = tmp - (mp * l * tha * ct) / (mc + mp); e.x += dt * e.v; e.v += dt * xa; e.th += dt * e.w; e.w += dt * tha; e.t++; e.ret++; if (Math.abs(e.x) > 2.4 || Math.abs(e.th) > 0.21 || e.t > 500) e.done = true; }
export default function ParallelEnvs({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(1); const N = 64; const mk = (): Env => ({ x: (rng() - 0.5) * 0.1, v: 0, th: (rng() - 0.5) * 0.1, w: 0, t: 0, ret: 0, done: false });
    let envs = Array.from({ length: N }, mk); let best = [0, 0, 0, 0], bestScore = 0, cand = best.slice(), gen = 0; const history: number[] = [];
    let raf = 0, frames = 0;
    const draw = () => {
      const q = p.current; const noise = Number(q.noise); const steps = Number(q.stepsPerFrame);
      if (play.current) for (let s = 0; s < steps; s++) {
        envs.forEach((e) => { if (e.done) return; const a = cand[0] * e.x + cand[1] * e.v + cand[2] * e.th + cand[3] * e.w; stepEnv(e, a > 0 ? 10 : -10); });
        if (envs.every((e) => e.done)) { const score = envs.reduce((a, e) => a + e.ret, 0) / N; history.push(score); if (history.length > 200) history.shift(); if (score >= bestScore) { bestScore = score; best = cand.slice(); } cand = best.map((v) => v + (rng() - 0.5) * noise); gen++; envs = Array.from({ length: N }, mk); }
      }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const gridW = w * 0.68, cols = 8, cw = gridW / cols, ch = (h - 16) / 8;
      envs.forEach((e, i) => { const x = 8 + (i % cols) * cw, y = 8 + Math.floor(i / cols) * ch; ctx.fillStyle = e.done ? "rgba(255,93,115,0.08)" : "rgba(13,20,32,0.9)"; ctx.fillRect(x, y, cw - 4, ch - 4); const cx = x + (cw - 4) / 2 + (e.x / 2.4) * (cw / 2 - 10), cy = y + ch * 0.75; ctx.fillStyle = colors.live; ctx.fillRect(cx - 8, cy - 4, 16, 8); ctx.strokeStyle = e.done ? colors.bad : colors.ref; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(e.th) * ch * 0.5, cy - Math.cos(e.th) * ch * 0.5); ctx.stroke(); ctx.fillStyle = colors.muted; ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillText(`${e.ret}`, x + 4, y + 10); });
      linePlot(ctx, { x: gridW + 16, y: 8, w: w - gridW - 24, h: h * 0.5 }, [{ data: history, color: colors.ok, label: "mean return / generation" }], { title: "training curve", min: 0, max: 500 });
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ["policy = sign(w·[x, v, θ, ω])", `best w = [${best.map((v) => v.toFixed(2)).join(", ")}]`, `generation ${gen} · best mean return ${bestScore.toFixed(0)}`, `${N} envs stepped in lockstep · ${steps} steps/frame`, "random-search hill climbing, not PPO"].forEach((s, i) => ctx.fillText(s, gridW + 20, h * 0.5 + 30 + i * 16));
      if ((frames++ & 15) === 0) onTelemetry({ Envs: N, Generation: gen, "Best mean return": bestScore, "Alive now": envs.filter((e) => !e.done).length, "Sim steps/s": steps * 60 * N });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
