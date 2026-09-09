"use client";
import { useEffect, useRef } from "react";

// Runs a draw loop on a full-size canvas. `draw` gets (ctx, w, h, t seconds, dt).
export function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void, deps: unknown[], playing = true) {
  const ref = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let raf = 0, last = performance.now(), alive = true;
    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      if (playing) tRef.current += dt;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const ctx = cv.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, tRef.current, playing ? dt : 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ...deps]);
  return { ref, tRef };
}
