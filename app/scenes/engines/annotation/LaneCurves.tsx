"use client";
import { useEffect, useRef } from "react";
import { drawStreet } from "../../kit/synthimage";
import { colors } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Lane annotation with draggable cubic Bézier control points; the curve is sampled and compared to the painted lane line (mean pixel error).
export default function LaneCurves({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const off = document.createElement("canvas"); off.width = 1280; off.height = 720; const gt = drawStreet(off.getContext("2d")!, 1280, 720, 3);
    const curves = gt.lanes.map((ln) => { const a = ln[0], b = ln[ln.length - 1]; return [[a[0] + 40, a[1]], [a[0] + 30, (a[1] + b[1]) / 2], [b[0] - 60, (a[1] + b[1]) * 0.6], [b[0] + 30, b[1]]] as [number, number][]; });
    let dragging: [number, number] | null = null, raf = 0, frames = 0;
    const toImg = (e: MouseEvent) => { const r = c.getBoundingClientRect(); const s = 1280 / r.width; return [(e.clientX - r.left) * s, (e.clientY - r.top) * s] as [number, number]; };
    const down = (e: MouseEvent) => { const [x, y] = toImg(e); curves.forEach((cp, ci) => cp.forEach((pt, pi) => { if (Math.hypot(pt[0] - x, pt[1] - y) < 14) dragging = [ci, pi]; })); };
    const move = (e: MouseEvent) => { if (!dragging) return; const [x, y] = toImg(e); curves[dragging[0]][dragging[1]] = [x, y]; };
    const up = () => (dragging = null);
    c.addEventListener("mousedown", down); c.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    const bez = (cp: [number, number][], t: number): [number, number] => { const u = 1 - t; return [u * u * u * cp[0][0] + 3 * u * u * t * cp[1][0] + 3 * u * t * t * cp[2][0] + t * t * t * cp[3][0], u * u * u * cp[0][1] + 3 * u * u * t * cp[1][1] + 3 * u * t * t * cp[2][1] + t * t * t * cp[3][1]]; };
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); const W = Math.max(1, c.clientWidth), H = W * 720 / 1280; if (c.width !== Math.round(W * dpr)) { c.width = W * dpr; c.height = H * dpr; } c.style.height = H + "px";
      const ctx = c.getContext("2d")!; ctx.setTransform(dpr * W / 1280, 0, 0, dpr * W / 1280, 0, 0); ctx.drawImage(off, 0, 0);
      const errs: number[] = [];
      curves.forEach((cp, ci) => {
        const col = [colors.live, colors.ref, colors.ok][ci]; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
        let err = 0; const S = Number(p.current.samples);
        for (let i = 0; i <= S; i++) { const [x, y] = bez(cp, i / S); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); let best = 1e9; for (const [gx, gy] of gt.lanes[ci]) best = Math.min(best, Math.hypot(gx - x, gy - y)); err += best; }
        ctx.stroke(); errs.push(err / (S + 1));
        if (Boolean(p.current.handles)) { ctx.strokeStyle = "rgba(230,238,248,0.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cp[0][0], cp[0][1]); ctx.lineTo(cp[1][0], cp[1][1]); ctx.moveTo(cp[2][0], cp[2][1]); ctx.lineTo(cp[3][0], cp[3][1]); ctx.stroke(); cp.forEach((pt, i) => { ctx.fillStyle = i === 0 || i === 3 ? col : colors.fg; ctx.beginPath(); ctx.arc(pt[0], pt[1], 7, 0, Math.PI * 2); ctx.fill(); }); }
        if (Boolean(p.current.samplesDots)) for (let i = 0; i <= S; i++) { const [x, y] = bez(cp, i / S); ctx.fillStyle = col; ctx.fillRect(x - 2, y - 2, 4, 4); }
      });
      ctx.fillStyle = colors.fg; ctx.font = "14px 'IBM Plex Mono', monospace"; ctx.fillText("Drag control points to fit the painted lines · " + errs.map((e, i) => `L${i + 1}: ${e.toFixed(1)}px`).join("  "), 12, 24);
      if ((frames++ & 15) === 0) onTelemetry({ Lanes: curves.length, "Mean error L1 (px)": errs[0], "Mean error L2 (px)": errs[1], "Mean error L3 (px)": errs[2], "Samples per lane": Number(p.current.samples) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("mousedown", down); c.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [resetKey, onTelemetry]);
  return <div className="engine-host img-host"><canvas ref={cv} className="img-canvas" style={{ cursor: "grab" }} /></div>;
}
