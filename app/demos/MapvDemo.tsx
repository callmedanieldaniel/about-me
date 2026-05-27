"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; w: number; vx: number; vy: number };

export default function MapvDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Stylized "China" cluster points + scattered noise — mimics mapv gallery population heat
    const points: Point[] = [];
    const cluster = (cx: number, cy: number, n: number, spread: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.pow(Math.random(), 2) * spread;
        points.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          w: 0.4 + Math.random() * 0.6,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    const seed = () => {
      points.length = 0;
      // approx city anchors (normalized 0-1 grid)
      const anchors: [number, number, number, number][] = [
        [0.72, 0.55, 220, 60], // shanghai
        [0.60, 0.45, 160, 50], // wuhan
        [0.55, 0.32, 200, 55], // beijing
        [0.78, 0.62, 140, 45], // hangzhou
        [0.30, 0.55, 110, 50], // chengdu
        [0.85, 0.72, 120, 40], // shenzhen
        [0.50, 0.62, 100, 45], // changsha
        [0.40, 0.40, 90, 50],  // xian
      ];
      for (const [nx, ny, n, s] of anchors) {
        cluster(nx * w, ny * h, n, s);
      }
      // sparse noise
      for (let i = 0; i < 200; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          w: 0.2 + Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
        });
      }
    };
    seed();
    window.addEventListener("resize", () => { resize(); seed(); });

    // Off-screen accumulation buffer
    const acc = document.createElement("canvas");
    acc.width = canvas.width;
    acc.height = canvas.height;
    const actx = acc.getContext("2d")!;
    actx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = (t: number) => {
      // mapv-like cool→hot
      if (t < 0.25) return `rgba(20, 50, 140, ${t * 4})`;
      if (t < 0.5) return `rgba(40, 160, 200, ${0.6 + t * 0.4})`;
      if (t < 0.75) return `rgba(240, 200, 60, 0.85)`;
      return `rgba(255, 90, 80, 0.95)`;
    };

    let raf = 0;
    let t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(50, now - t0);
      t0 = now;

      for (const p of points) {
        p.x += p.vx * dt * 0.05;
        p.y += p.vy * dt * 0.05;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      // background grid
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(40,40,55,0.6)";
      ctx.lineWidth = 1;
      const grid = 40;
      for (let x = 0; x <= w; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // density grid (simple binning, mapv heatmap style)
      const cell = 12;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const bins = new Float32Array(cols * rows);
      let max = 0;
      for (const p of points) {
        const cx = Math.floor(p.x / cell);
        const cy = Math.floor(p.y / cell);
        // splat 3x3
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = cx + dx, yy = cy + dy;
            if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
            const k = (1 - Math.hypot(dx, dy) / 1.5) * p.w;
            const idx = yy * cols + xx;
            bins[idx] += Math.max(0, k);
            if (bins[idx] > max) max = bins[idx];
          }
        }
      }

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = bins[y * cols + x] / Math.max(1, max);
          if (v < 0.05) continue;
          ctx.fillStyle = palette(v);
          ctx.fillRect(x * cell, y * cell, cell - 1, cell - 1);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ height: 360 }}>
      <canvas ref={ref} />
    </div>
  );
}
