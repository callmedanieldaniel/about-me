"use client";

import { useEffect, useRef, useState } from "react";

// Stylized "AMap JS API v2" — pan/zoom canvas with vector "tiles"
// (procedural roads + landmarks), markers, and an info window.
export default function AmapSdkDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

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

    // Drag
    let dragging = false;
    let lastX = 0, lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      setCenter((c) => [c[0] - dx / zoom, c[1] - dy / zoom]);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.5, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // Procedural map elements (seeded)
    const seedRand = (s: number) => {
      let x = Math.sin(s) * 10000;
      return () => {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
      };
    };
    const rng = seedRand(42);
    const roads: [number, number, number, number][] = [];
    for (let i = 0; i < 40; i++) {
      const horiz = rng() > 0.5;
      const off = (rng() - 0.5) * 1600;
      const len = 800 + rng() * 800;
      if (horiz) roads.push([-800, off, 800, off]);
      else roads.push([off, -800, off, 800]);
    }
    const parks: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      parks.push([(rng() - 0.5) * 1200, (rng() - 0.5) * 800, 40 + rng() * 60]);
    }
    const markers: { x: number; y: number; label: string }[] = [
      { x: 0, y: 0, label: "Site A" },
      { x: 220, y: -140, label: "Site B" },
      { x: -180, y: 80, label: "Site C" },
      { x: 80, y: 260, label: "Site D" },
    ];

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-center[0], -center[1]);

      // bg grid (tiles)
      ctx.strokeStyle = "rgba(40,40,55,0.4)";
      const tile = 64;
      const x0 = Math.floor((center[0] - w / 2 / zoom) / tile) * tile;
      const x1 = Math.ceil((center[0] + w / 2 / zoom) / tile) * tile;
      const y0 = Math.floor((center[1] - h / 2 / zoom) / tile) * tile;
      const y1 = Math.ceil((center[1] + h / 2 / zoom) / tile) * tile;
      for (let x = x0; x <= x1; x += tile) {
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      }
      for (let y = y0; y <= y1; y += tile) {
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      }

      // parks
      parks.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(121,255,225,0.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(121,255,225,0.25)";
        ctx.stroke();
      });

      // roads
      roads.forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(120,120,150,0.5)";
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      });

      // markers
      markers.forEach((m) => {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 6 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#ff7eb6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = `${11 / zoom}px ui-monospace, monospace`;
        ctx.fillText(m.label, m.x + 10 / zoom, m.y + 3 / zoom);
      });

      ctx.restore();

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`zoom ${zoom.toFixed(2)} · pan: drag · zoom: scroll`, 12, 18);
      ctx.fillText(`center [${Math.round(center[0])}, ${Math.round(center[1])}]`, 12, 32);

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [zoom, center]);

  return (
    <div style={{ height: 360 }}>
      <canvas ref={ref} style={{ cursor: "grab" }} />
    </div>
  );
}
