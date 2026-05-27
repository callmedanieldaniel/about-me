"use client";

import { useEffect, useRef } from "react";

// Baidu Qianxi-style migration flow — animated arcs between city nodes
export default function QianxiDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0;
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

    const cities: { name: string; x: number; y: number; size: number }[] = [
      { name: "Beijing",   x: 0.55, y: 0.25, size: 7 },
      { name: "Shanghai",  x: 0.78, y: 0.50, size: 8 },
      { name: "Guangzhou", x: 0.62, y: 0.78, size: 6 },
      { name: "Shenzhen",  x: 0.66, y: 0.82, size: 6 },
      { name: "Chengdu",   x: 0.30, y: 0.55, size: 6 },
      { name: "Wuhan",     x: 0.55, y: 0.55, size: 5 },
      { name: "Xi'an",     x: 0.40, y: 0.42, size: 5 },
      { name: "Hangzhou",  x: 0.74, y: 0.55, size: 5 },
      { name: "Chongqing", x: 0.36, y: 0.58, size: 5 },
    ];

    type Flow = { a: number; b: number; phase: number; speed: number; weight: number };
    const flows: Flow[] = [];
    const seedFlows = () => {
      flows.length = 0;
      for (let i = 0; i < 24; i++) {
        let a = Math.floor(Math.random() * cities.length);
        let b = Math.floor(Math.random() * cities.length);
        if (a === b) b = (b + 1) % cities.length;
        flows.push({
          a, b,
          phase: Math.random(),
          speed: 0.0008 + Math.random() * 0.0015,
          weight: 0.3 + Math.random() * 0.7,
        });
      }
    };
    seedFlows();

    const arc = (
      ax: number, ay: number, bx: number, by: number, t: number
    ): [number, number, number, number] => {
      // quadratic bezier with control offset perpendicular
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy);
      const cx = mx - (dy / len) * len * 0.3;
      const cy = my + (dx / len) * len * 0.3;
      const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx;
      const y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by;
      // tangent
      const tx = 2 * (1 - t) * (cx - ax) + 2 * t * (bx - cx);
      const ty = 2 * (1 - t) * (cy - ay) + 2 * t * (by - cy);
      return [x, y, tx, ty];
    };

    let raf = 0;
    let t0 = performance.now();
    const draw = () => {
      const now = performance.now();
      const dt = Math.min(50, now - t0);
      t0 = now;

      ctx.fillStyle = "rgba(10,10,16,0.25)";
      ctx.fillRect(0, 0, w, h);

      // map silhouette grid
      ctx.strokeStyle = "rgba(40,40,55,0.4)";
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // arcs (faint base)
      flows.forEach((f) => {
        const a = cities[f.a];
        const b = cities[f.b];
        ctx.beginPath();
        const N = 24;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          const [x, y] = arc(a.x * w, a.y * h, b.x * w, b.y * h, t);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255,126,182,${0.05 + f.weight * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // moving particles
      flows.forEach((f) => {
        f.phase = (f.phase + f.speed * dt) % 1;
        const a = cities[f.a];
        const b = cities[f.b];
        for (let k = 0; k < 3; k++) {
          const t = (f.phase + k * 0.33) % 1;
          const [x, y] = arc(a.x * w, a.y * h, b.x * w, b.y * h, t);
          const op = (1 - Math.abs(t - 0.5) * 2) * 0.9;
          ctx.beginPath();
          ctx.arc(x, y, 1.5 + f.weight * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,126,182,${op * f.weight})`;
          ctx.fill();
        }
      });

      // city nodes
      cities.forEach((c) => {
        const cx = c.x * w, cy = c.y * h;
        // glow
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.size * 3);
        g.addColorStop(0, "rgba(121,255,225,0.4)");
        g.addColorStop(1, "rgba(121,255,225,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - c.size * 3, cy - c.size * 3, c.size * 6, c.size * 6);
        // dot
        ctx.beginPath();
        ctx.arc(cx, cy, c.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#79ffe1";
        ctx.fill();
        // label
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(c.name, cx + 8, cy + 3);
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

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
