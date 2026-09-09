"use client";
import { useEffect, useRef } from "react";
import { fleet } from "../../kit/fleet";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Version comparison: v2.3 vs v2.4 across event kinds and causes — paired bars, per-1,000 km normalization and a delta column with significance shading.
export default function VersionCompare({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const drives = fleet(); const ev = drives.flatMap((d) => d.events);
    const kmOf = (v: string) => drives.filter((d) => (d.vehicle % 2 ? "v2.3" : "v2.4") === v).reduce((s, d) => { let km = 0; for (let i = 1; i < d.t.length; i++) km += (d.speed[i] * 0.1) / 1000; return s + km; }, 0);
    const kmA = kmOf("v2.3"), kmB = kmOf("v2.4");
    let raf = 0, frames = 0, t = 0;
    const draw = () => {
      t += 0.02; const q = p.current; const dim = String(q.dimension); const cats = dim === "kind" ? ["hard_brake", "disengagement", "sensor_dropout", "cut_in", "swerve"] : ["perception", "planning", "localization", "control", "other"];
      const norm = Boolean(q.normalize); const minSev = Number(q.minSeverity);
      const count = (v: string, cat: string) => ev.filter((e) => e.version === v && e.severity >= minSev && (dim === "kind" ? e.kind : e.cause) === cat).length / (norm ? (v === "v2.3" ? kmA : kmB) / 1000 : 1);
      const rows = cats.map((cat) => ({ cat, a: count("v2.3", cat), b: count("v2.4", cat) }));
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const lx = 150, rowH = (h - 80) / rows.length, maxV = Math.max(...rows.flatMap((r) => [r.a, r.b])) * 1.1 || 1; const bw = w - lx - 160;
      ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillStyle = colors.fg; ctx.fillText(`${norm ? "events per 1,000 km" : "event count"} by ${dim} · v2.3 (amber) vs v2.4 (cyan) · severity ≥ ${minSev}`, lx, 22);
      const anim = Math.min(1, t);
      rows.forEach((r, i) => {
        const y = 40 + i * rowH; ctx.fillStyle = colors.fg; ctx.textAlign = "right"; ctx.fillText(r.cat.replace("_", " "), lx - 12, y + rowH / 2 + 4); ctx.textAlign = "left";
        ctx.fillStyle = colors.ref; ctx.fillRect(lx, y + rowH * 0.15, (r.a / maxV) * bw * anim, rowH * 0.3); ctx.fillStyle = colors.live; ctx.fillRect(lx, y + rowH * 0.55, (r.b / maxV) * bw * anim, rowH * 0.3);
        ctx.fillStyle = colors.muted; ctx.fillText(r.a.toFixed(norm ? 2 : 0), lx + (r.a / maxV) * bw + 6, y + rowH * 0.15 + 12); ctx.fillText(r.b.toFixed(norm ? 2 : 0), lx + (r.b / maxV) * bw + 6, y + rowH * 0.55 + 12);
        const delta = r.a > 0 ? ((r.b - r.a) / r.a) * 100 : r.b > 0 ? 100 : 0; const sig = Math.abs(r.b - r.a) > 1.5 * Math.sqrt(Math.max(1, r.a));
        ctx.fillStyle = delta < 0 ? colors.ok : delta > 0 ? colors.bad : colors.muted; ctx.globalAlpha = sig ? 1 : 0.5; ctx.fillText(`${delta > 0 ? "+" : ""}${delta.toFixed(0)}%${sig ? "" : " (n.s.)"}`, w - 140, y + rowH / 2 + 4); ctx.globalAlpha = 1;
      });
      if ((frames++ & 15) === 0) { const tA = rows.reduce((s, r) => s + r.a, 0), tB = rows.reduce((s, r) => s + r.b, 0); onTelemetry({ "v2.3 km": kmA.toFixed(1), "v2.4 km": kmB.toFixed(1), "v2.3 total": tA, "v2.4 total": tB, "Overall Δ %": tA ? ((100 * (tB - tA)) / tA).toFixed(1) : "—", "Worst category": rows.reduce((m, r) => (r.b - r.a > m.b - m.a ? r : m), rows[0]).cat }); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
