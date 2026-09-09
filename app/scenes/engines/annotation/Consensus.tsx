"use client";
import { useEffect, useRef } from "react";
import { makeObjects, iou3d } from "../../kit/pointcloud";
import { colors, fitCanvas, heat } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Inter-annotator agreement: two annotators label the same BEV scene with different noise; pairwise IoU matrix, disagreements flagged, Cohen-style agreement rate.
export default function Consensus({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const gt = makeObjects(41, 9);
    let raf = 0, frames = 0, lastKey = "";
    let A: typeof gt = [], B: typeof gt = [];
    const draw = () => {
      const q = p.current; const key = `${q.noiseA}|${q.noiseB}|${q.missB}|${q.thr}`;
      if (key !== lastKey) { lastKey = key; const ra = mulberry32(1), rb = mulberry32(2); A = gt.map((o) => ({ ...o, x: o.x + (ra() - 0.5) * Number(q.noiseA), z: o.z + (ra() - 0.5) * Number(q.noiseA), l: o.l * (1 + (ra() - 0.5) * 0.1) })); B = gt.filter(() => rb() > Number(q.missB)).map((o) => ({ ...o, x: o.x + (rb() - 0.5) * Number(q.noiseB), z: o.z + (rb() - 0.5) * Number(q.noiseB), yaw: o.yaw + (rb() - 0.5) * 0.2, cls: rb() < 0.1 ? (o.cls === "car" ? "cyclist" : "car") : o.cls })); }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const mapW = w * 0.6; const S = Math.min(mapW, h) / 70; const X = (x: number) => mapW / 2 + x * S, Y = (z: number) => h / 2 + z * S;
      ctx.strokeStyle = colors.line; for (let r = 10; r <= 30; r += 10) { ctx.beginPath(); ctx.arc(mapW / 2, h / 2, r * S, 0, Math.PI * 2); ctx.stroke(); }
      const box = (o: { x: number; z: number; l: number; w: number; yaw: number }, col: string, dash: number[]) => { ctx.save(); ctx.translate(X(o.x), Y(o.z)); ctx.rotate(-o.yaw); ctx.strokeStyle = col; ctx.setLineDash(dash); ctx.lineWidth = 1.5; ctx.strokeRect((-o.l * S) / 2, (-o.w * S) / 2, o.l * S, o.w * S); ctx.restore(); };
      const thr = Number(q.thr); let agree = 0, classMismatch = 0, missing = 0;
      const M: number[][] = A.map((a) => B.map((b) => iou3d(a, b)));
      A.forEach((a, i) => { const best = Math.max(0, ...M[i]); const j = M[i].indexOf(best); const ok = best >= thr; if (ok) { agree++; if (B[j].cls !== a.cls) classMismatch++; } else missing++; box(a, ok ? colors.live : colors.bad, []); if (!ok) { ctx.fillStyle = colors.bad; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`#${a.id} no match`, X(a.x) + 8, Y(a.z) - 8); } });
      B.forEach((b) => box(b, colors.ref, [4, 3]));
      // matrix
      const mx = mapW + 20, my = 40, cell = Math.min((w - mx - 20) / Math.max(1, B.length), (h - my - 40) / Math.max(1, A.length));
      ctx.fillStyle = colors.muted; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("IoU matrix · rows: annotator A · cols: annotator B", mx, 24);
      A.forEach((_, i) => B.forEach((_, j) => { const v = M[i][j]; ctx.fillStyle = v > 0 ? heat(v) : "#0d1420"; ctx.fillRect(mx + j * cell, my + i * cell, cell - 1, cell - 1); if (v >= thr) { ctx.fillStyle = "#070b12"; ctx.fillText(v.toFixed(2), mx + j * cell + 3, my + i * cell + cell * 0.65); } }));
      ctx.fillStyle = colors.fg; ctx.fillText(`A: ${A.length} labels · B: ${B.length} labels · agreement ${((100 * agree) / A.length).toFixed(0)}% @ IoU≥${thr}`, 12, 20);
      if ((frames++ & 15) === 0) onTelemetry({ "Annotator A": A.length, "Annotator B": B.length, "Matched pairs": agree, "Class mismatch": classMismatch, "Unmatched (A)": missing, "Agreement %": (100 * agree) / A.length, "Mean matched IoU": agree ? M.flat().filter((v) => v >= thr).reduce((s, v) => s + v, 0) / agree : 0 });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
