"use client";

import { useEffect, useRef } from "react";

// LBS truck routing — animated truck following a polyline that
// avoids restricted zones (red polygons). Mimics the lbs.amap.com/solution/truck
// route-planning visual.
export default function TruckDemo() {
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

    // route waypoints (normalized)
    const route: [number, number][] = [
      [0.08, 0.78],
      [0.16, 0.62],
      [0.22, 0.55],
      [0.32, 0.5],
      [0.40, 0.42],
      [0.48, 0.34],
      [0.58, 0.36],
      [0.66, 0.28],
      [0.78, 0.22],
      [0.88, 0.18],
    ];

    // restricted zones
    const zones: [number, number, number, number][] = [
      [0.30, 0.20, 0.10, 0.08],
      [0.55, 0.55, 0.08, 0.10],
      [0.70, 0.45, 0.06, 0.08],
    ];

    // sample arc-length parametrization
    const points = route.map(([x, y]) => [x * w, y * h] as [number, number]);
    let totalLen = 0;
    const lens: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
      totalLen += d;
      lens.push(totalLen);
    }
    const sample = (s: number): [number, number, number] => {
      // returns [x, y, angle]
      for (let i = 1; i < lens.length; i++) {
        if (s <= lens[i]) {
          const t = (s - lens[i - 1]) / (lens[i] - lens[i - 1]);
          const x = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t;
          const y = points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t;
          const a = Math.atan2(points[i][1] - points[i - 1][1], points[i][0] - points[i - 1][0]);
          return [x, y, a];
        }
      }
      return [points[points.length - 1][0], points[points.length - 1][1], 0];
    };

    let s = 0;
    let raf = 0;
    let t0 = performance.now();

    const draw = () => {
      const now = performance.now();
      const dt = Math.min(50, now - t0);
      t0 = now;
      s = (s + dt * 0.06) % totalLen;

      // bg
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);

      // map grid
      ctx.strokeStyle = "rgba(50,50,70,0.5)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // pseudo roads (random diagonals)
      ctx.strokeStyle = "rgba(60,60,85,0.7)";
      ctx.lineWidth = 1.5;
      const roads = [
        [0, 0.3, 1, 0.7],
        [0.2, 0, 0.8, 1],
        [0, 0.5, 1, 0.4],
        [0.4, 0, 0.6, 1],
      ];
      roads.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1 * w, y1 * h);
        ctx.lineTo(x2 * w, y2 * h);
        ctx.stroke();
      });

      // restricted zones
      zones.forEach(([zx, zy, zw, zh]) => {
        ctx.fillStyle = "rgba(255, 90, 80, 0.10)";
        ctx.fillRect(zx * w, zy * h, zw * w, zh * h);
        ctx.strokeStyle = "rgba(255, 90, 80, 0.5)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeRect(zx * w, zy * h, zw * w, zh * h);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255, 90, 80, 0.6)";
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText("RESTRICTED", zx * w + 4, zy * h + 12);
      });

      // route — base line
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.strokeStyle = "rgba(121, 255, 225, 0.25)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // traveled portion
      ctx.beginPath();
      let traveled = 0;
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        const seg = lens[i] - lens[i - 1];
        if (traveled + seg < s) {
          ctx.lineTo(points[i][0], points[i][1]);
          traveled += seg;
        } else {
          const t = (s - traveled) / seg;
          const x = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t;
          const y = points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t;
          ctx.lineTo(x, y);
          break;
        }
      }
      ctx.strokeStyle = "#79ffe1";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#79ffe1";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // waypoints
      points.forEach((p, i) => {
        ctx.fillStyle = i === 0 || i === points.length - 1 ? "#ff7eb6" : "#79ffe1";
        ctx.beginPath();
        ctx.arc(p[0], p[1], i === 0 || i === points.length - 1 ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // truck icon
      const [tx, ty, ta] = sample(s);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(ta);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-10, -5, 16, 10);
      ctx.fillStyle = "#ff7eb6";
      ctx.fillRect(6, -4, 4, 8);
      // wheels
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(-8, -6, 3, 2);
      ctx.fillRect(-8, 4, 3, 2);
      ctx.fillRect(2, -6, 3, 2);
      ctx.fillRect(2, 4, 3, 2);
      ctx.restore();

      // start/end labels
      ctx.fillStyle = "#ff7eb6";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("WAREHOUSE", points[0][0] + 10, points[0][1] + 4);
      ctx.fillText("DROP-OFF", points[points.length - 1][0] - 56, points[points.length - 1][1] - 8);

      // header overlay
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`ETA: ${Math.round((1 - s / totalLen) * 42)} min`, 12, 18);
      ctx.fillText(`avoid: 3 truck-restricted zones`, 12, 34);

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
