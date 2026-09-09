"use client";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_XODR, parseOpenDrive, type Network } from "../../kit/opendrive";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// 2D lane graph: click a lane to highlight predecessors (amber), successors (green) and neighbours (violet) — the query every planner runs.
export default function LaneTopology({ params, resetKey, asset, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const net = useRef<Network | null>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => { try { net.current = parseOpenDrive(asset ? new TextDecoder().decode(asset) : SAMPLE_XODR); } catch { net.current = parseOpenDrive(SAMPLE_XODR); } setSel(null); }, [asset, resetKey]);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    let raf = 0, frames = 0;
    const fit = (w: number, h: number) => { const [minx, miny, maxx, maxy] = net.current!.bbox; const s = Math.min((w - 60) / (maxx - minx), (h - 60) / (maxy - miny)); return (x: number, y: number): [number, number] => [30 + (x - minx) * s, h - 30 - (y - miny) * s]; };
    const pick = (mx: number, my: number, w: number, h: number) => { const T = fit(w, h); let best: string | null = null, bd = 12; for (const l of net.current!.lanes) { if (l.type !== "driving") continue; for (const [x, y] of l.center) { const [px, py] = T(x, y); const d = Math.hypot(px - mx, py - my); if (d < bd) { bd = d; best = l.key; } } } return best; };
    const onClick = (e: MouseEvent) => { const r = c.getBoundingClientRect(); setSel(pick(e.clientX - r.left, e.clientY - r.top, r.width, r.height)); };
    c.addEventListener("click", onClick);
    const draw = () => {
      const n = net.current; if (!n) { raf = requestAnimationFrame(draw); return; }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const T = fit(w, h);
      const L = new Map(n.lanes.map((l) => [l.key, l]));
      const s = sel ? L.get(sel) : undefined;
      const neigh = s ? n.lanes.filter((x) => x.road === s.road && x.type === "driving" && Math.sign(x.id) === Math.sign(s.id) && Math.abs(x.id - s.id) === 1).map((x) => x.key) : [];
      for (const l of n.lanes) {
        const poly = (pts: [number, number][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const [px, py] = T(x, y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); };
        ctx.beginPath(); l.inner.forEach(([x, y], i) => { const [px, py] = T(x, y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); [...l.outer].reverse().forEach(([x, y]) => { const [px, py] = T(x, y); ctx.lineTo(px, py); }); ctx.closePath();
        let fill = l.type === "driving" ? "#13202f" : "#1b2533";
        if (sel === l.key) fill = "rgba(94,231,255,0.55)"; else if (s?.succ.includes(l.key)) fill = "rgba(124,243,160,0.5)"; else if (s?.pred.includes(l.key)) fill = "rgba(255,180,84,0.5)"; else if (neigh.includes(l.key)) fill = "rgba(185,156,255,0.45)";
        ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = "#2a3b52"; ctx.lineWidth = 1; ctx.stroke();
        if (Boolean(p.current.arrows) && l.type === "driving") { const m = Math.floor(l.center.length / 2); const a = l.center[m], b = l.center[Math.min(l.center.length - 1, m + 2)]; const [ax, ay] = T(a[0], a[1]), [bx, by] = T(b[0], b[1]); const ang = Math.atan2(by - ay, bx - ax) + (l.id > 0 ? Math.PI : 0); ctx.strokeStyle = colors.muted; poly([]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + Math.cos(ang) * 10, ay + Math.sin(ang) * 10); ctx.lineTo(ax + Math.cos(ang + 2.6) * 6 + Math.cos(ang) * 10, ay + Math.sin(ang + 2.6) * 6 + Math.sin(ang) * 10); ctx.stroke(); }
        if (Boolean(p.current.labels)) { const m = l.center[Math.floor(l.center.length / 3)]; const [lx, ly] = T(m[0], m[1]); ctx.fillStyle = colors.muted; ctx.font = "9px 'IBM Plex Mono', monospace"; ctx.fillText(l.key, lx - 8, ly + 3); }
      }
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillText(s ? `lane ${s.key} · ${s.length.toFixed(0)} m · pred ${s.pred.join(",") || "—"} · succ ${s.succ.join(",") || "—"} · neighbours ${neigh.join(",") || "—"}` : "Click a driving lane", 12, 18);
      if ((frames++ & 15) === 0) onTelemetry({ Lanes: n.lanes.length, "Driving lanes": n.lanes.filter((x) => x.type === "driving").length, Selected: sel ?? "—", Successors: s?.succ.length ?? 0, Predecessors: s?.pred.length ?? 0, Neighbours: neigh.length, "Graph edges": n.lanes.reduce((k, l) => k + l.succ.length, 0) });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("click", onClick); };
  }, [sel, resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" style={{ cursor: "crosshair" }} />;
}
