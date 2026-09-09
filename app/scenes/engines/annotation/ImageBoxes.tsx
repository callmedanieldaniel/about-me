"use client";
import { useEffect, useRef } from "react";
import { drawStreet, iou2d, type ImgObj } from "../../kit/synthimage";
import { colors } from "../../kit/plot";
import type { EngineProps } from "../../types";

// 2D box & polygon tool: drag to draw a box, click to add polygon vertices (double-click closes), Delete removes the hovered shape; boxes are scored against ground truth.
type Shape = { kind: "box"; cls: string; x: number; y: number; w: number; h: number } | { kind: "poly"; cls: string; pts: [number, number][] };

export default function ImageBoxes({ params, resetKey, command, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const shapes = useRef<Shape[]>([]);
  const lastCmd = useRef(0);
  useEffect(() => { shapes.current = []; }, [resetKey]);
  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "undo") shapes.current.pop(); if (command.name === "clear") shapes.current = []; }, [command]);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const off = document.createElement("canvas"); off.width = 1280; off.height = 720; const gt = drawStreet(off.getContext("2d")!, 1280, 720, 3);
    let drag: { x: number; y: number } | null = null, cur = { x: 0, y: 0 }, poly: [number, number][] = [], raf = 0, frames = 0;
    const toImg = (e: MouseEvent) => { const r = c.getBoundingClientRect(); const s = 1280 / r.width; return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s }; };
    const down = (e: MouseEvent) => { const m = toImg(e); if (p.current.tool === "box") drag = m; else { poly.push([m.x, m.y]); } };
    const move = (e: MouseEvent) => { cur = toImg(e); };
    const up = (e: MouseEvent) => { if (drag) { const m = toImg(e); const x = Math.min(drag.x, m.x), y = Math.min(drag.y, m.y), w = Math.abs(m.x - drag.x), h = Math.abs(m.y - drag.y); if (w > 6 && h > 6) shapes.current.push({ kind: "box", cls: String(p.current.cls), x, y, w, h }); drag = null; } };
    const dbl = () => { if (poly.length >= 3) shapes.current.push({ kind: "poly", cls: String(p.current.cls), pts: poly.slice(0, -1) }); poly = []; };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { poly = []; drag = null; } if (e.key === "z" && (e.metaKey || e.ctrlKey)) shapes.current.pop(); };
    c.addEventListener("mousedown", down); c.addEventListener("mousemove", move); c.addEventListener("mouseup", up); c.addEventListener("dblclick", dbl); window.addEventListener("keydown", key);
    const colorOf = (cls: string) => (cls === "car" ? colors.live : cls === "pedestrian" ? colors.bad : cls === "sign" ? colors.ref : colors.violet);
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const W = Math.max(1, c.clientWidth), H = W * 720 / 1280; if (c.width !== Math.round(W * dpr)) { c.width = W * dpr; c.height = H * dpr; } c.style.height = H + "px";
      const ctx = c.getContext("2d")!; ctx.setTransform(dpr * W / 1280, 0, 0, dpr * W / 1280, 0, 0);
      ctx.drawImage(off, 0, 0);
      if (Boolean(p.current.showGt)) for (const g of gt.objects) { ctx.strokeStyle = "rgba(126,144,168,0.5)"; ctx.setLineDash([4, 4]); ctx.strokeRect(g.x, g.y, g.w, g.h); ctx.setLineDash([]); }
      let matched = 0;
      for (const s of shapes.current) { ctx.strokeStyle = colorOf(s.cls); ctx.lineWidth = 2; ctx.fillStyle = colorOf(s.cls) + "33"; if (s.kind === "box") { ctx.fillRect(s.x, s.y, s.w, s.h); ctx.strokeRect(s.x, s.y, s.w, s.h); ctx.fillStyle = colorOf(s.cls); ctx.font = "13px 'IBM Plex Mono', monospace"; ctx.fillText(s.cls, s.x + 3, s.y - 4); if (gt.objects.some((g: ImgObj) => g.cls === s.cls && iou2d(g, s) > 0.5)) matched++; } else { ctx.beginPath(); s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
      if (drag) { ctx.strokeStyle = colors.fg; ctx.setLineDash([6, 4]); ctx.strokeRect(Math.min(drag.x, cur.x), Math.min(drag.y, cur.y), Math.abs(cur.x - drag.x), Math.abs(cur.y - drag.y)); ctx.setLineDash([]); }
      if (poly.length) { ctx.strokeStyle = colors.fg; ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineTo(cur.x, cur.y); ctx.stroke(); poly.forEach(([x, y]) => { ctx.fillStyle = colors.fg; ctx.fillRect(x - 3, y - 3, 6, 6); }); }
      // crosshair
      ctx.strokeStyle = "rgba(230,238,248,0.25)"; ctx.beginPath(); ctx.moveTo(cur.x, 0); ctx.lineTo(cur.x, 720); ctx.moveTo(0, cur.y); ctx.lineTo(1280, cur.y); ctx.stroke();
      if ((frames++ & 15) === 0) onTelemetry({ Shapes: shapes.current.length, Boxes: shapes.current.filter((s) => s.kind === "box").length, Polygons: shapes.current.filter((s) => s.kind === "poly").length, "GT objects": gt.objects.length, "Boxes matched (IoU>0.5)": matched, Cursor: `${cur.x.toFixed(0)},${cur.y.toFixed(0)}` });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("mousedown", down); c.removeEventListener("mousemove", move); c.removeEventListener("mouseup", up); c.removeEventListener("dblclick", dbl); window.removeEventListener("keydown", key); };
  }, [resetKey, onTelemetry]);
  return <div className="engine-host img-host"><canvas ref={cv} className="img-canvas" /></div>;
}
