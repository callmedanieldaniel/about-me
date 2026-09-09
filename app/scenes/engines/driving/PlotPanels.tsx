"use client";
import { useEffect, useRef, useState } from "react";
import { defaultLog, parseLog, series, type Log } from "../../kit/mcap";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { Timeline } from "../../kit/Timeline";
import type { EngineProps } from "../../types";

// Multi-panel plot with a shared cursor, hover readout and a derived signal (jerk from speed) — the "Plot" panel workflow.
export default function PlotPanels({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [log, setLog] = useState<Log | null>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const hover = useRef<number | null>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    let alive = true;
    (asset ? parseLog(new Uint8Array(asset), "uploaded MCAP") : defaultLog()).then((l) => alive && (setLog(l), (tRef.current = 0))).catch(() => defaultLog().then((l) => alive && setLog(l)));
    return () => { alive = false; };
  }, [asset, resetKey]);

  useEffect(() => {
    const c = cv.current; if (!c || !log) return;
    const numeric = [...log.topics.values()].filter((tp) => tp.msgs.length > 2 && Object.values(tp.msgs[0]).some((v) => typeof v === "number"));
    const panels: { title: string; series: { data: number[]; color: string; label: string }[] }[] = [];
    const palette = [colors.live, colors.ref, colors.ok, colors.violet, colors.bad];
    for (const tp of numeric.slice(0, 6)) {
      const keys = Object.keys(tp.msgs[0]).filter((k) => typeof tp.msgs[0][k] === "number");
      panels.push({ title: tp.topic, series: keys.slice(0, 3).map((k, i) => ({ data: series(tp, k), color: palette[i % palette.length], label: k })) });
    }
    const sp = log.topics.get("/vehicle/speed");
    if (sp && Boolean(p.current.derived)) {
      const v = series(sp, "value"); const acc = v.map((x, i) => (i ? (x - v[i - 1]) / Math.max(1e-3, sp.times[i] - sp.times[i - 1]) : 0));
      const win = Math.max(1, Number(p.current.smooth));
      const sm = acc.map((_, i) => { let s = 0, n = 0; for (let k = Math.max(0, i - win); k <= i; k++) { s += acc[k]; n++; } return s / n; });
      panels.push({ title: "derived: d/dt /vehicle/speed (smoothed)", series: [{ data: sm, color: colors.violet, label: "accel m/s²" }] });
    }
    const onMove = (e: MouseEvent) => { const r = c.getBoundingClientRect(); hover.current = (e.clientX - r.left) / r.width; };
    const onLeave = () => (hover.current = null);
    c.addEventListener("mousemove", onMove); c.addEventListener("mouseleave", onLeave);
    let last = performance.now(), raf = 0, frames = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (play.current) { tRef.current += dt * Number(p.current.rate); if (tRef.current > log.duration) tRef.current = 0; }
      const tt = tRef.current;
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const cols = w > 900 ? 2 : 1, rows = Math.ceil(panels.length / cols);
      const pw = (w - 16 * (cols + 1)) / cols, ph = (h - 16 * (rows + 1)) / rows;
      const frac = tt / log.duration;
      const hv = hover.current;
      const readout: Record<string, string | number> = {};
      panels.forEach((pn, i) => {
        const x = 16 + (i % cols) * (pw + 16), y = 16 + Math.floor(i / cols) * (ph + 16);
        const n = pn.series[0].data.length; const cur = Math.floor(frac * (n - 1));
        linePlot(ctx, { x, y, w: pw, h: ph }, pn.series, { title: pn.title, cursor: cur });
        if (hv !== null) {
          const hi = Math.floor(((hv * w - x - 8) / (pw - 16)) * (n - 1));
          if (hi >= 0 && hi < n) { const hx = x + 8 + (hi / (n - 1)) * (pw - 16); ctx.strokeStyle = colors.ref; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(hx, y + 20); ctx.lineTo(hx, y + ph - 8); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = colors.ref; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillText(pn.series.map((s) => `${s.label}=${s.data[hi].toFixed(3)}`).join("  "), x + 8, y + 30); }
        }
        readout[pn.title.replace("derived: ", "")] = pn.series[0].data[cur]?.toFixed(3) ?? "";
      });
      if ((frames++ & 5) === 0) { setT(tt); onTelemetry({ "t (s)": tt, Panels: panels.length, ...readout }); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("mousemove", onMove); c.removeEventListener("mouseleave", onLeave); };
  }, [log, onTelemetry, params.derived, params.smooth]);

  return (
    <div className="engine-host">
      <canvas ref={cv} className="engine-fill" />
      {log && <Timeline t={t} duration={log.duration} onSeek={(v) => { tRef.current = v; setT(v); }} />}
      {!log && <div className="engine-loading">Reading log…</div>}
    </div>
  );
}
