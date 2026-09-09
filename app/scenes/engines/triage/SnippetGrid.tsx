"use client";
import { useEffect, useRef, useState } from "react";
import { fleet, mine, rules } from "../../kit/fleet";
import { colors } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Snippet grid: every mined event becomes a card with a ±4 s sparkline of speed/brake and a trajectory glyph; filter by kind, click to expand.
export default function SnippetGrid({ params, resetKey, onTelemetry }: EngineProps) {
  const [open, setOpen] = useState<number | null>(null);
  const drives = useRef(fleet());
  const hits = mine(drives.current, rules({ brake: Number(params.brake), accel: 3, dropHz: 5, steerRate: 0.08 })).filter((h) => params.kind === "all" || h.kind === params.kind);
  useEffect(() => { onTelemetry({ Snippets: hits.length, Filter: String(params.kind), "Window (s)": Number(params.window) * 2, Expanded: open ?? "—" }); }, [hits.length, params.kind, params.window, open, onTelemetry]);
  useEffect(() => setOpen(null), [resetKey]);
  return (
    <div className="engine-host snip-host">
      {hits.slice(0, 60).map((h, i) => (
        <Snippet key={i} idx={i} h={h} win={Number(params.window)} open={open === i} onClick={() => setOpen(open === i ? null : i)} />
      ))}
      {!hits.length && <div className="engine-note">No events for this filter</div>}
    </div>
  );
}

function Snippet({ idx, h, win, open, onClick }: { idx: number; h: ReturnType<typeof mine>[number]; win: number; open: boolean; onClick: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current; if (!c) return; const d = fleet()[h.vehicle - 1];
    const i0 = Math.max(0, Math.floor((h.t - win) * 10)), i1 = Math.min(d.t.length - 1, Math.floor((h.t + win) * 10));
    const W = c.clientWidth || 200, H = c.clientHeight || 90; c.width = W * 2; c.height = H * 2; const ctx = c.getContext("2d")!; ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = "#0a0f18"; ctx.fillRect(0, 0, W, H);
    const n = i1 - i0; const X = (k: number) => ((k - i0) / n) * (W * 0.6); const maxS = Math.max(1, ...d.speed.slice(i0, i1));
    ctx.strokeStyle = colors.live; ctx.beginPath(); for (let k = i0; k <= i1; k++) { const y = H - 6 - (d.speed[k] / maxS) * (H - 12); k === i0 ? ctx.moveTo(X(k), y) : ctx.lineTo(X(k), y); } ctx.stroke();
    ctx.strokeStyle = colors.bad; ctx.beginPath(); for (let k = i0; k <= i1; k++) { const y = H - 6 - d.brake[k] * (H - 12); k === i0 ? ctx.moveTo(X(k), y) : ctx.lineTo(X(k), y); } ctx.stroke();
    ctx.strokeStyle = colors.fg; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(W * 0.3, 0); ctx.lineTo(W * 0.3, H); ctx.stroke(); ctx.setLineDash([]);
    // trajectory glyph (lat/lon around event)
    const cx = W * 0.8, cy = H / 2; const sc = 1200000 / 8; ctx.strokeStyle = colors.ref; ctx.beginPath(); for (let k = i0; k <= i1; k++) { const x = cx + (d.lon[k] - h.lon) * sc, y = cy - (d.lat[k] - h.lat) * sc; k === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.fillStyle = colors.bad; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  }, [h, win, open]);
  return (
    <div className={`snip ${open ? "open" : ""}`} onClick={onClick}>
      <div className="snip-head"><b>#{idx + 1} {h.kind.replace("_", " ")}</b><span>veh {h.vehicle} · t={h.t.toFixed(1)}s</span></div>
      <canvas ref={cv} />
      {open && <div className="snip-meta">lat {h.lat.toFixed(5)} · lon {h.lon.toFixed(5)} · window ±{win}s · cyan speed · red brake · amber path</div>}
    </div>
  );
}
