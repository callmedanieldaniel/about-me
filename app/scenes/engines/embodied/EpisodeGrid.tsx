"use client";
import { useEffect, useRef } from "react";
import { drawCam, makeEpisodes } from "../../kit/episode";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Episode grid: every episode as a live thumbnail with a success badge and an anomaly score bar; sort and threshold to find the ones worth watching.
export default function EpisodeGrid({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const eps = makeEpisodes(); const off = document.createElement("canvas"); off.width = 160; off.height = 100;
    let raf = 0, frames = 0, t = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt;
      const q = p.current; const thr = Number(q.threshold);
      let list = [...eps]; if (q.sort === "anomaly") list.sort((a, b) => b.anomaly - a.anomaly); if (q.sort === "failures") list.sort((a, b) => Number(a.success) - Number(b.success));
      if (Boolean(q.onlyFlagged)) list = list.filter((e) => e.anomaly > thr);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const cols = Math.max(2, Math.floor(w / 190)), cw = (w - 12) / cols, ch = cw * 0.72;
      list.forEach((ep, i) => {
        const x = 8 + (i % cols) * cw, y = 8 + Math.floor(i / cols) * (ch + 8); if (y > h) return;
        const step = Math.floor((t * 30) % ep.steps); drawCam(off.getContext("2d")!, 160, 100, ep, step, "front"); ctx.drawImage(off, x, y, cw - 8, ch - 26);
        ctx.strokeStyle = ep.anomaly > thr ? colors.bad : colors.line; ctx.lineWidth = ep.anomaly > thr ? 2 : 1; ctx.strokeRect(x + 0.5, y + 0.5, cw - 9, ch - 1);
        ctx.fillStyle = ep.success ? colors.ok : colors.bad; ctx.fillRect(x + 6, y + ch - 20, 8, 8); ctx.fillStyle = colors.fg; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillText(`ep${ep.id} ${ep.task}`, x + 18, y + ch - 12);
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(x + 6, y + ch - 6, cw - 20, 3); ctx.fillStyle = ep.anomaly > thr ? colors.bad : colors.live; ctx.fillRect(x + 6, y + ch - 6, (cw - 20) * Math.min(1, ep.anomaly / 1.6), 3);
      });
      if ((frames++ & 15) === 0) onTelemetry({ Episodes: eps.length, Shown: list.length, "Success rate %": (100 * eps.filter((e) => e.success).length) / eps.length, "Flagged (> thr)": eps.filter((e) => e.anomaly > thr).length, "Anomaly threshold": thr });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
