"use client";
import { useEffect, useRef } from "react";
import { drawStreet } from "../../kit/synthimage";
import type { EngineProps } from "../../types";

// Semantic segmentation brush on a downsampled label grid (4 px cells) with class palette, eraser, and per-class pixel statistics.
const CLASSES = [{ id: 1, name: "road", color: [94, 231, 255] }, { id: 2, name: "car", color: [185, 156, 255] }, { id: 3, name: "pedestrian", color: [255, 93, 115] }, { id: 4, name: "building", color: [255, 180, 84] }, { id: 5, name: "sky", color: [124, 243, 160] }];

export default function SegBrush({ params, resetKey, command, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const grid = useRef(new Uint8Array((1280 / 4) * (720 / 4)));
  const lastCmd = useRef(0);
  useEffect(() => { grid.current.fill(0); }, [resetKey]);
  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "clear") grid.current.fill(0); if (command.name === "fillSky") { for (let y = 0; y < 720 / 4; y++) for (let x = 0; x < 1280 / 4; x++) if (y * 4 < 720 * 0.55 && grid.current[y * 320 + x] === 0) grid.current[y * 320 + x] = 5; } }, [command]);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const off = document.createElement("canvas"); off.width = 1280; off.height = 720; drawStreet(off.getContext("2d")!, 1280, 720, 3);
    const mask = document.createElement("canvas"); mask.width = 320; mask.height = 180; const mctx = mask.getContext("2d")!; const imgData = mctx.createImageData(320, 180);
    let painting = false, cur = [0, 0], raf = 0, frames = 0;
    const toImg = (e: MouseEvent) => { const r = c.getBoundingClientRect(); const s = 1280 / r.width; return [(e.clientX - r.left) * s, (e.clientY - r.top) * s]; };
    const paint = () => { const r = Number(p.current.radius) / 4; const cls = Boolean(p.current.eraser) ? 0 : CLASSES.find((k) => k.name === String(p.current.cls))!.id; const cx = cur[0] / 4, cy = cur[1] / 4; for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(179, cy + r); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(319, cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) grid.current[y * 320 + x] = cls; };
    const down = (e: MouseEvent) => { painting = true; cur = toImg(e); paint(); }; const move = (e: MouseEvent) => { cur = toImg(e); if (painting) paint(); }; const up = () => (painting = false);
    c.addEventListener("mousedown", down); c.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const W = Math.max(1, c.clientWidth), H = W * 720 / 1280; if (c.width !== Math.round(W * dpr)) { c.width = W * dpr; c.height = H * dpr; } c.style.height = H + "px";
      const ctx = c.getContext("2d")!; ctx.setTransform(dpr * W / 1280, 0, 0, dpr * W / 1280, 0, 0); ctx.drawImage(off, 0, 0);
      const counts = new Array(6).fill(0); const g = grid.current; const d = imgData.data; const alpha = Math.round(Number(p.current.opacity) * 255);
      for (let i = 0; i < g.length; i++) { const k = g[i]; counts[k]++; if (k) { const col = CLASSES[k - 1].color; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = alpha; } else d[i * 4 + 3] = 0; }
      mctx.putImageData(imgData, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(mask, 0, 0, 1280, 720); ctx.imageSmoothingEnabled = true;
      ctx.strokeStyle = "#e6eef8"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cur[0], cur[1], Number(p.current.radius), 0, Math.PI * 2); ctx.stroke();
      if ((frames++ & 15) === 0) { const total = g.length; const tel: Record<string, string | number> = { "Labeled %": (100 * (total - counts[0])) / total }; CLASSES.forEach((k) => (tel[`${k.name} %`] = (100 * counts[k.id]) / total)); onTelemetry(tel); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("mousedown", down); c.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [resetKey, onTelemetry]);
  return <div className="engine-host img-host"><canvas ref={cv} className="img-canvas" style={{ cursor: "none" }} /></div>;
}
