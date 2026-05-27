"use client";

import { useEffect, useRef } from "react";

// Traffic — stylized road network with animated speed segments
// (jam=red, slow=yellow, free=green), mimics jiaotong.baidu.com
export default function JiaotongDemo() {
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

    // Build a road network: ring road + radials + grid streets
    type Seg = { x1: number; y1: number; x2: number; y2: number; speed: number; flow: number };
    const segs: Seg[] = [];

    const seedNetwork = () => {
      segs.length = 0;
      const cx = w / 2, cy = h / 2;

      // ring road
      const N = 36;
      for (let i = 0; i < N; i++) {
        const a1 = (i / N) * Math.PI * 2;
        const a2 = ((i + 1) / N) * Math.PI * 2;
        const r = Math.min(w, h) * 0.32;
        segs.push({
          x1: cx + Math.cos(a1) * r,
          y1: cy + Math.sin(a1) * r,
          x2: cx + Math.cos(a2) * r,
          y2: cy + Math.sin(a2) * r,
          speed: 0.3 + Math.random() * 0.7,
          flow: Math.random(),
        });
      }
      // radials
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const inner = Math.min(w, h) * 0.32;
        const outer = Math.min(w, h) * 0.48;
        segs.push({
          x1: cx + Math.cos(a) * inner,
          y1: cy + Math.sin(a) * inner,
          x2: cx + Math.cos(a) * outer,
          y2: cy + Math.sin(a) * outer,
          speed: 0.3 + Math.random() * 0.7,
          flow: Math.random(),
        });
      }
      // grid streets inside ring
      for (let i = -3; i <= 3; i++) {
        const x = cx + i * (w * 0.07);
        segs.push({ x1: x, y1: cy - h * 0.25, x2: x, y2: cy + h * 0.25, speed: 0.3 + Math.random() * 0.7, flow: Math.random() });
      }
      for (let i = -2; i <= 2; i++) {
        const y = cy + i * (h * 0.1);
        segs.push({ x1: cx - w * 0.28, y1: y, x2: cx + w * 0.28, y2: y, speed: 0.3 + Math.random() * 0.7, flow: Math.random() });
      }
    };
    seedNetwork();
    window.addEventListener("resize", () => { resize(); seedNetwork(); });

    const colorFor = (s: number) => {
      if (s < 0.35) return ["#ff5a50", "rgba(255,90,80,0.5)"]; // jam
      if (s < 0.65) return ["#f0c83c", "rgba(240,200,60,0.5)"]; // slow
      return ["#79ffe1", "rgba(121,255,225,0.5)"]; // free
    };

    let raf = 0;
    let t0 = performance.now();
    let tick = 0;

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(50, now - t0);
      t0 = now;
      tick += dt * 0.001;

      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);

      // grid bg
      ctx.strokeStyle = "rgba(35,35,50,0.6)";
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // every second, perturb speeds
      segs.forEach((s) => {
        s.speed += (Math.random() - 0.5) * 0.02;
        s.speed = Math.max(0.1, Math.min(1, s.speed));
        s.flow = (s.flow + dt * 0.0003 * s.speed) % 1;
      });

      // draw road layers
      // 1) base wide gray
      segs.forEach((s) => {
        ctx.strokeStyle = "rgba(50,50,65,0.9)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      });
      // 2) speed color
      segs.forEach((s) => {
        const [c] = colorFor(s.speed);
        ctx.strokeStyle = c;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      });
      // 3) flow particles
      segs.forEach((s) => {
        const [, glow] = colorFor(s.speed);
        const t = s.flow;
        const x = s.x1 + (s.x2 - s.x1) * t;
        const y = s.y1 + (s.y2 - s.y1) * t;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // center marker
      const cx = w / 2, cy = h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + Math.sin(tick * 3) * 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ff7eb6";
      ctx.fill();

      // legend
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("CITY OPS · realtime road speed", 12, 18);
      const legends: [string, string][] = [
        ["#ff5a50", "jam"],
        ["#f0c83c", "slow"],
        ["#79ffe1", "free"],
      ];
      legends.forEach(([c, lbl], i) => {
        ctx.fillStyle = c;
        ctx.fillRect(12 + i * 70, h - 22, 10, 10);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(lbl, 26 + i * 70, h - 13);
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
