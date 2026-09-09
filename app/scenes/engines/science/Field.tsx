"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// 2-D wave equation on a grid (finite differences, absorbing edges) with click-to-drop sources and an obstacle slit — the interference pattern appears live.
export default function Field({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return; const N = 160; let u = new Float32Array(N * N), un = new Float32Array(N * N), up = new Float32Array(N * N); const img = new ImageData(N, N); const off = document.createElement("canvas"); off.width = N; off.height = N;
    let t = 0, raf = 0, frames = 0, last = performance.now(); const sources: [number, number][] = [];
    const onClick = (e: MouseEvent) => { const r = c.getBoundingClientRect(); sources.push([Math.floor(((e.clientX - r.left) / r.width) * N), Math.floor(((e.clientY - r.top) / r.height) * N)]); };
    c.addEventListener("click", onClick);
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const cc = Number(q.c), damp = Number(q.damping), slit = Boolean(q.slit);
      if (play.current) for (let s = 0; s < Number(q.substeps); s++) { t += 0.02; const src = sources.length ? sources : [[N / 4, N / 2] as [number, number]]; for (const [sx, sy] of src) { u[sy * N + sx] += Math.sin(t * Number(q.freq)) * 2; }
        for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x; if (slit && x === Math.floor(N * 0.55) && !(Math.abs(y - N * 0.42) < 4 || Math.abs(y - N * 0.58) < 4)) { un[i] = 0; continue; } const lap = u[i - 1] + u[i + 1] + u[i - N] + u[i + N] - 4 * u[i]; un[i] = (2 * u[i] - up[i] + cc * cc * lap) * (1 - damp); }
        for (let k = 0; k < N; k++) { un[k] *= 0.5; un[(N - 1) * N + k] *= 0.5; un[k * N] *= 0.5; un[k * N + N - 1] *= 0.5; } [up, u, un] = [u, un, up]; }
      let energy = 0; for (let i = 0; i < N * N; i++) { const v = u[i]; energy += v * v; const a = Math.max(-1, Math.min(1, v * 0.6)); const pos = Math.max(0, a), neg = Math.max(0, -a); img.data[i * 4] = 12 + neg * 243; img.data[i * 4 + 1] = 20 + pos * 211 * 0.9 + neg * 73; img.data[i * 4 + 2] = 32 + pos * 223 + neg * 83; img.data[i * 4 + 3] = 255; }
      off.getContext("2d")!.putImageData(img, 0, 0); const { ctx, w, h } = fitCanvas(c); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
      if (slit) { ctx.fillStyle = colors.fg; const x = (0.55) * w; ctx.fillRect(x - 1, 0, 3, h * 0.42 - 4 * (h / N)); ctx.fillRect(x - 1, h * 0.42 + 4 * (h / N), 3, h * 0.16 - 8 * (h / N)); ctx.fillRect(x - 1, h * 0.58 + 4 * (h / N), 3, h); }
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("click to add a source · double-slit obstacle toggle in parameters", 12, h - 10);
      if ((frames++ & 15) === 0) onTelemetry({ Grid: `${N}×${N}`, Sources: sources.length || 1, "Wave speed c": cc, "Energy": energy, "t": t }); raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("click", onClick); };
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" style={{ cursor: "crosshair" }} />;
}
