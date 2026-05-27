"use client";

import { useEffect, useRef } from "react";

// mapv-pro / 大屏 dashboard mock — composed: map + sparkline + KPI tiles + bar chart
export default function MapvProDemo() {
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

    // sparkline history
    const series: number[] = Array.from({ length: 60 }, () => 0.4 + Math.random() * 0.3);

    const bars = Array.from({ length: 8 }, () => 0.3 + Math.random() * 0.7);

    let raf = 0, t = 0;
    const draw = () => {
      t += 0.02;
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);

      // layout: left big map panel, right column with kpi/spark/bars
      const pad = 12;
      const leftW = w * 0.55;
      const mapBox = { x: pad, y: pad, w: leftW - pad * 1.5, h: h - pad * 2 };
      const rightX = leftW + pad * 0.5;
      const rightW = w - rightX - pad;

      const panel = (x: number, y: number, ww: number, hh: number, title: string) => {
        ctx.fillStyle = "rgba(255,255,255,0.025)";
        ctx.fillRect(x, y, ww, hh);
        ctx.strokeStyle = "rgba(255,126,182,0.3)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1);
        ctx.fillStyle = "rgba(255,126,182,0.9)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(title, x + 8, y + 14);
      };

      // MAP panel
      panel(mapBox.x, mapBox.y, mapBox.w, mapBox.h, "GEO · LIVE MAP");
      // inner grid
      ctx.save();
      ctx.beginPath();
      ctx.rect(mapBox.x + 6, mapBox.y + 22, mapBox.w - 12, mapBox.h - 28);
      ctx.clip();
      ctx.strokeStyle = "rgba(40,40,55,0.6)";
      for (let x = mapBox.x; x < mapBox.x + mapBox.w; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, mapBox.y); ctx.lineTo(x, mapBox.y + mapBox.h); ctx.stroke();
      }
      for (let y = mapBox.y; y < mapBox.y + mapBox.h; y += 24) {
        ctx.beginPath(); ctx.moveTo(mapBox.x, y); ctx.lineTo(mapBox.x + mapBox.w, y); ctx.stroke();
      }
      // pulsing nodes
      for (let i = 0; i < 30; i++) {
        const seed = i * 13.37;
        const px = mapBox.x + 20 + ((Math.sin(seed) * 0.5 + 0.5) * (mapBox.w - 40));
        const py = mapBox.y + 30 + ((Math.cos(seed * 1.3) * 0.5 + 0.5) * (mapBox.h - 50));
        const phase = (t + i * 0.3) % 1.5;
        const r = phase < 1 ? phase * 12 : 0;
        const op = phase < 1 ? 1 - phase : 0;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(121,255,225,${op * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#79ffe1";
        ctx.fill();
      }
      ctx.restore();

      // RIGHT column
      const rowGap = 8;
      const kpiH = 56;
      const sparkH = 100;
      const barH = h - pad * 2 - kpiH - sparkH - rowGap * 2;

      // KPI row (3 tiles)
      const kpiW = (rightW - rowGap * 2) / 3;
      const kpiData: [string, string, string][] = [
        ["DEVICES", "12.4k", "+3.2%"],
        ["EVENTS/s", "2,891", "+7.8%"],
        ["LATENCY", "84ms", "-1.4%"],
      ];
      kpiData.forEach(([k, v, d], i) => {
        const x = rightX + i * (kpiW + rowGap);
        panel(x, pad, kpiW, kpiH, k);
        ctx.fillStyle = "#fff";
        ctx.font = "600 18px Inter, sans-serif";
        ctx.fillText(v, x + 8, pad + 38);
        ctx.fillStyle = d.startsWith("+") ? "#79ffe1" : "#ff7eb6";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText(d, x + 8, pad + 50);
      });

      // sparkline
      const sx = rightX, sy = pad + kpiH + rowGap;
      panel(sx, sy, rightW, sparkH, "THROUGHPUT · 60s");
      series.shift();
      series.push(Math.max(0.1, Math.min(0.95, series[series.length - 1] + (Math.random() - 0.5) * 0.08)));
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx + 6, sy + 22, rightW - 12, sparkH - 28);
      ctx.clip();
      ctx.beginPath();
      series.forEach((v, i) => {
        const px = sx + 8 + (i / (series.length - 1)) * (rightW - 16);
        const py = sy + 22 + (1 - v) * (sparkH - 32);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.lineTo(sx + rightW - 8, sy + sparkH - 8);
      ctx.lineTo(sx + 8, sy + sparkH - 8);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, sy, 0, sy + sparkH);
      grad.addColorStop(0, "rgba(121,255,225,0.5)");
      grad.addColorStop(1, "rgba(121,255,225,0)");
      ctx.fillStyle = grad;
      ctx.fill();
      // line
      ctx.beginPath();
      series.forEach((v, i) => {
        const px = sx + 8 + (i / (series.length - 1)) * (rightW - 16);
        const py = sy + 22 + (1 - v) * (sparkH - 32);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = "#79ffe1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // bars
      const bx = rightX, by = sy + sparkH + rowGap;
      panel(bx, by, rightW, barH, "BY CITY · top 8");
      const barWidth = (rightW - 30) / bars.length - 4;
      bars.forEach((b, i) => {
        b = Math.max(0.15, Math.min(1, b + (Math.random() - 0.5) * 0.04));
        bars[i] = b;
        const barX = bx + 14 + i * (barWidth + 4);
        const barTop = by + 26;
        const innerH = barH - 36;
        ctx.fillStyle = "rgba(255,126,182,0.7)";
        ctx.fillRect(barX, barTop + (1 - b) * innerH, barWidth, b * innerH);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "9px ui-monospace, monospace";
        ctx.fillText(String.fromCharCode(65 + i), barX + 2, by + barH - 6);
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div style={{ height: 380 }}>
      <canvas ref={ref} />
    </div>
  );
}
