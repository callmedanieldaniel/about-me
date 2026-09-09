"use client";
import { useEffect, useRef } from "react";
import { drawCam, makeEpisodes } from "../../kit/episode";
import { colors, fitCanvas, heat } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Attention overlay: a policy's visual attention (patch-level softmax) drawn over the camera frame as a heatmap; the peak should follow the object being grasped — when it drifts, the policy is looking at the wrong thing.
export default function AttentionOverlay({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const eps = makeEpisodes(); const off = document.createElement("canvas"); off.width = 320; off.height = 200; const rng = mulberry32(2);
    let raf = 0, frames = 0, t = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt;
      const q = p.current; const ep = eps[Math.min(eps.length - 1, Number(q.episode) - 1)]; const step = Math.floor((t * 30) % ep.steps); const G = Number(q.patches); const temp = Number(q.temperature);
      drawCam(off.getContext("2d")!, 320, 200, ep, step, "front");
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const iw = Math.min(w - 24, (h - 24) * 1.6), ih = iw / 1.6, ox = (w - iw) / 2, oy = (h - ih) / 2;
      ctx.drawImage(off, ox, oy, iw, ih);
      // synthetic attention: peak on the cube (or drifts on failures), softmax over patches
      const qq = ep.q[step]; const f = step / ep.steps; const cubeX = 0.5 + (ep.grip[step] ? qq[0] * 0.25 : 0), cubeY = ep.grip[step] ? 0.55 - qq[2] * 0.25 + 0.06 : 0.62;
      const drift = ep.success ? 0 : Math.min(0.35, f * 0.5); const px = cubeX + drift, py = cubeY - drift * 0.5;
      const logits: number[] = []; for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { const cx = (gx + 0.5) / G, cy = (gy + 0.5) / G; logits.push(-((cx - px) ** 2 + (cy - py) ** 2) * 40 + (rng() - 0.5) * 0.6); }
      const m = Math.max(...logits); const ex = logits.map((l) => Math.exp((l - m) / temp)); const Z = ex.reduce((a, b) => a + b, 0); const att = ex.map((e) => e / Z); const peak = Math.max(...att);
      ctx.globalAlpha = Number(q.opacity); att.forEach((a, i) => { const gx = i % G, gy = Math.floor(i / G); ctx.fillStyle = heat(Math.min(1, a / peak)); ctx.fillRect(ox + (gx / G) * iw, oy + (gy / G) * ih, iw / G + 0.5, ih / G + 0.5); }); ctx.globalAlpha = 1;
      const pi = att.indexOf(peak); ctx.strokeStyle = colors.fg; ctx.lineWidth = 2; ctx.strokeRect(ox + ((pi % G) / G) * iw, oy + (Math.floor(pi / G) / G) * ih, iw / G, ih / G);
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`ep${ep.id} · ${ep.language} · peak attention ${(peak * 100).toFixed(1)}% · entropy ${(-att.reduce((s, a) => s + (a > 0 ? a * Math.log(a) : 0), 0)).toFixed(2)}`, ox + 8, oy + ih - 8);
      if ((frames++ & 15) === 0) onTelemetry({ Episode: ep.id, Step: step, Patches: G * G, "Peak attention %": peak * 100, "Attention drift": drift, Outcome: ep.success ? "success" : "failure" });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
