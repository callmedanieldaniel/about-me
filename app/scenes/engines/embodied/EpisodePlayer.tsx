"use client";
import { useEffect, useRef, useState } from "react";
import { drawCam, makeEpisodes } from "../../kit/episode";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { Timeline } from "../../kit/Timeline";
import type { EngineProps } from "../../types";

// Episode player: two synthetic camera streams, joint-position and gripper plots, per-step reward, all locked to one scrubber (Rerun / LeRobot visualizer layout).
export default function EpisodePlayer({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0); const sRef = useRef(0);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  const eps = useRef(makeEpisodes());
  useEffect(() => { sRef.current = 0; }, [resetKey, params.episode]);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    let raf = 0, frames = 0, acc = 0, last = performance.now();
    const off = [document.createElement("canvas"), document.createElement("canvas")]; off.forEach((o) => { o.width = 320; o.height = 200; });
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const ep = eps.current[Math.min(eps.current.length - 1, Number(q.episode) - 1)];
      if (play.current) { acc += dt * 30 * Number(q.rate); sRef.current = (sRef.current + acc) % ep.steps; acc = 0; }
      const s = Math.floor(sRef.current);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const camW = Math.min(w * 0.42, 420), camH = camW * 0.625;
      (["front", "wrist"] as const).forEach((v, i) => { const o = off[i]; drawCam(o.getContext("2d")!, 320, 200, ep, s, v); ctx.drawImage(o, 12, 12 + i * (camH + 10), camW, camH); ctx.strokeStyle = colors.line; ctx.strokeRect(12.5, 12.5 + i * (camH + 10), camW - 1, camH - 1); });
      const px = camW + 24, pw = w - px - 12, ph = (h - 80) / 3;
      const cols = [colors.live, colors.ref, colors.ok, colors.violet, colors.bad, colors.muted];
      linePlot(ctx, { x: px, y: 12, w: pw, h: ph }, ep.q[0].map((_, j) => ({ data: ep.q.map((r) => r[j]), color: cols[j], label: `q${j}` })), { title: "observation.state · joint positions (rad)", cursor: s });
      linePlot(ctx, { x: px, y: 20 + ph, w: pw, h: ph }, [{ data: ep.grip, color: colors.ref, label: "gripper" }], { title: "action.gripper", cursor: s, min: 0, max: 1 });
      const cum = ep.reward.reduce<number[]>((a, r) => (a.push((a[a.length - 1] ?? 0) + r), a), []);
      linePlot(ctx, { x: px, y: 28 + ph * 2, w: pw, h: ph }, [{ data: cum, color: ep.success ? colors.ok : colors.bad, label: "cumulative reward" }], { title: `reward · ${ep.language}`, cursor: s, min: 0 });
      if ((frames++ & 5) === 0) { setStep(s); onTelemetry({ Episode: `${ep.id}/${eps.current.length}`, Task: ep.task, Step: `${s}/${ep.steps}`, Outcome: ep.success ? "success" : "failure", "Gripper": ep.grip[s] ? "closed" : "open", "Return": cum[cum.length - 1] }); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onTelemetry]);
  const ep = eps.current[Math.min(eps.current.length - 1, Number(params.episode) - 1)];
  return (<div className="engine-host"><canvas ref={cv} className="engine-fill" /><Timeline t={step} duration={ep.steps - 1} onSeek={(v) => { sRef.current = v; setStep(Math.floor(v)); }} /></div>);
}
