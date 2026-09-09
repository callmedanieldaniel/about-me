"use client";
import { useEffect, useRef } from "react";
import { fleet } from "../../kit/fleet";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Root-cause taxonomy: events by initiator (driver vs system) × cause (perception / planning / localization / control / other) as a matrix, plus a Sankey-like flow from event kind to cause.
export default function RootCause({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ev = fleet().flatMap((d) => d.events);
    const kinds = ["hard_brake", "disengagement", "sensor_dropout", "cut_in", "swerve"], causes = ["perception", "planning", "localization", "control", "other"];
    const kc: Record<string, string> = { hard_brake: colors.bad, disengagement: colors.ref, sensor_dropout: colors.violet, cut_in: colors.ok, swerve: colors.live };
    let raf = 0, frames = 0, t = 0;
    const draw = () => {
      t += 0.016;
      const q = p.current; const minSev = Number(q.minSeverity); const sel = ev.filter((e) => e.severity >= minSev && (q.version === "all" || e.version === q.version));
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      // flow: left column kinds, right column causes, ribbons width ∝ count
      const lx = 140, rx = w * 0.55, colH = h - 60;
      const kCount = kinds.map((k) => sel.filter((e) => e.kind === k).length), cCount = causes.map((k) => sel.filter((e) => e.cause === k).length);
      const total = Math.max(1, sel.length);
      let ly = 30; const kPos: Record<string, [number, number]> = {}; kinds.forEach((k, i) => { const hh = (kCount[i] / total) * colH; kPos[k] = [ly, hh]; ctx.fillStyle = kc[k]; ctx.fillRect(lx - 10, ly, 10, Math.max(1, hh)); ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "right"; ctx.fillText(`${k.replace("_", " ")} ${kCount[i]}`, lx - 16, ly + hh / 2 + 4); ly += hh + 6; });
      let ry = 30; const cPos: Record<string, [number, number]> = {}; causes.forEach((k, i) => { const hh = (cCount[i] / total) * colH; cPos[k] = [ry, hh]; ctx.fillStyle = colors.muted; ctx.fillRect(rx, ry, 10, Math.max(1, hh)); ctx.fillStyle = colors.fg; ctx.textAlign = "left"; ctx.fillText(`${k} ${cCount[i]}`, rx + 16, ry + hh / 2 + 4); ry += hh + 6; });
      const kOff: Record<string, number> = {}, cOff: Record<string, number> = {};
      kinds.forEach((k) => causes.forEach((cz) => { const n = sel.filter((e) => e.kind === k && e.cause === cz).length; if (!n) return; const hh = (n / total) * colH; const y0 = kPos[k][0] + (kOff[k] ?? 0), y1 = cPos[cz][0] + (cOff[cz] ?? 0); kOff[k] = (kOff[k] ?? 0) + hh; cOff[cz] = (cOff[cz] ?? 0) + hh; ctx.fillStyle = kc[k]; ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 2 + y0 * 0.05); ctx.beginPath(); ctx.moveTo(lx, y0); ctx.bezierCurveTo((lx + rx) / 2, y0, (lx + rx) / 2, y1, rx, y1); ctx.lineTo(rx, y1 + hh); ctx.bezierCurveTo((lx + rx) / 2, y1 + hh, (lx + rx) / 2, y0 + hh, lx, y0 + hh); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }));
      // right: initiator × cause matrix
      const mx = w * 0.72, my = 40, cw = (w - mx - 16) / causes.length, ch = 50;
      ctx.fillStyle = colors.fg; ctx.textAlign = "left"; ctx.fillText("initiator × cause", mx, 22);
      const inits = [{ n: "driver-initiated", f: (e: typeof ev[number]) => e.kind === "disengagement" }, { n: "system-flagged", f: (e: typeof ev[number]) => e.kind !== "disengagement" }];
      inits.forEach((it, i) => { causes.forEach((cz, j) => { const n = sel.filter((e) => it.f(e) && e.cause === cz).length; const mx2 = Math.max(1, ...causes.map((z) => sel.filter((e) => it.f(e) && e.cause === z).length)); ctx.fillStyle = `rgba(94,231,255,${0.1 + (0.8 * n) / mx2})`; ctx.fillRect(mx + j * cw, my + i * (ch + 4), cw - 3, ch); ctx.fillStyle = colors.fg; ctx.fillText(String(n), mx + j * cw + 6, my + i * (ch + 4) + 30); }); ctx.fillStyle = colors.muted; ctx.fillText(it.n, mx, my + i * (ch + 4) - 4); });
      causes.forEach((cz, j) => { ctx.fillStyle = colors.muted; ctx.fillText(cz.slice(0, 5), mx + j * cw + 4, my + 2 * (ch + 4) + 12); });
      if ((frames++ & 15) === 0) onTelemetry({ Events: sel.length, "Driver-initiated": sel.filter((e) => e.kind === "disengagement").length, "Top cause": causes[cCount.indexOf(Math.max(...cCount))], "Perception share %": (100 * cCount[0]) / total, "Control share %": (100 * cCount[3]) / total });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
