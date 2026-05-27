"use client";

import { useEffect, useRef } from "react";

// renqi.map.baidu.com — commercial real-estate population heat with isochrone rings
export default function RenqiDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Point of interest center
    const poi = { x: 0.5, y: 0.5 };
    // population blobs
    const blobs: { x: number; y: number; r: number; w: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 0.1 + Math.random() * 0.35;
      blobs.push({
        x: poi.x + Math.cos(a) * d,
        y: poi.y + Math.sin(a) * d,
        r: 0.04 + Math.random() * 0.08,
        w: 0.4 + Math.random() * 0.6,
      });
    }

    let raf = 0, t = 0;
    const draw = () => {
      t += 0.012;
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(40,40,55,0.5)";
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // heat blobs
      blobs.forEach((b) => {
        const cx = b.x * w, cy = b.y * h;
        const r = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,126,182,${b.w * 0.7})`);
        g.addColorStop(0.5, `rgba(240,200,60,${b.w * 0.25})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      });

      // isochrone rings around POI
      const cx = poi.x * w, cy = poi.y * h;
      for (let i = 1; i <= 4; i++) {
        const r = (i * 0.09 + Math.sin(t + i) * 0.005) * Math.min(w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(121,255,225,${0.5 - i * 0.1})`;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
        // ring label
        ctx.fillStyle = `rgba(121,255,225,${0.8 - i * 0.15})`;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(`${i * 5}min`, cx + r - 24, cy - 4);
      }

      // POI marker
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ff7eb6";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // header
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("SITE SELECTION · 1km / 5/10/15/20 min isochrone", 12, 18);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("residential density · 24h average", 12, 34);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div style={{ height: 360 }}>
      <canvas ref={ref} />
    </div>
  );
}
