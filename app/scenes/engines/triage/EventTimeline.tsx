"use client";
import { useEffect, useRef } from "react";
import { fleet, mine, rules, score } from "../../kit/fleet";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Fleet event timeline: one lane per vehicle, auto-extracted events as markers, GT events as ticks; select a vehicle to see its signals.
const KIND_COLOR: Record<string, string> = { hard_brake: colors.bad, disengagement: colors.ref, sensor_dropout: colors.violet, swerve: colors.live, cut_in: colors.ok };

export default function EventTimeline({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const drives = fleet(); const T = drives[0].t[drives[0].t.length - 1];
    let raf = 0, frames = 0, cursor = 0, last = performance.now(), lastKey = "", hits = mine(drives, rules({ brake: 0.5, accel: 3, dropHz: 5, steerRate: 0.08 })), sc = score(hits, drives);
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const key = `${q.brake}|${q.accel}|${q.dropHz}|${q.steerRate}`;
      if (key !== lastKey) { lastKey = key; hits = mine(drives, rules({ brake: Number(q.brake), accel: Number(q.accel), dropHz: Number(q.dropHz), steerRate: Number(q.steerRate) })); sc = score(hits, drives); }
      if (play.current) cursor = (cursor + dt * Number(q.rate)) % T;
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const pad = 90, laneH = 26, top = 30; const x = (t: number) => pad + (t / T) * (w - pad - 16);
      ctx.font = "11px 'IBM Plex Mono', monospace";
      drives.forEach((d, i) => {
        const y = top + i * (laneH + 6);
        ctx.fillStyle = "rgba(13,20,32,0.9)"; ctx.fillRect(pad, y, w - pad - 16, laneH);
        // autonomy on/off shading
        for (let k = 0; k < d.auto.length; k += 10) if (d.auto[k] === 0) { ctx.fillStyle = "rgba(255,180,84,0.25)"; ctx.fillRect(x(d.t[k]), y, Math.max(1, x(d.t[Math.min(k + 10, d.t.length - 1)]) - x(d.t[k])), laneH); }
        ctx.fillStyle = Number(q.vehicle) === d.vehicle ? colors.fg : colors.muted; ctx.fillText(`vehicle ${d.vehicle}`, 8, y + 17);
        if (Boolean(q.showGt)) for (const e of d.events) { ctx.fillStyle = KIND_COLOR[e.kind]; ctx.globalAlpha = 0.35; ctx.fillRect(x(e.t) - 1, y, 2, laneH); ctx.globalAlpha = 1; }
        for (const hh of hits.filter((z) => z.vehicle === d.vehicle)) { ctx.fillStyle = KIND_COLOR[hh.kind]; ctx.beginPath(); ctx.moveTo(x(hh.t), y + 4); ctx.lineTo(x(hh.t) + 5, y + laneH / 2); ctx.lineTo(x(hh.t), y + laneH - 4); ctx.lineTo(x(hh.t) - 5, y + laneH / 2); ctx.closePath(); ctx.fill(); }
      });
      const yEnd = top + drives.length * (laneH + 6);
      ctx.strokeStyle = colors.fg; ctx.beginPath(); ctx.moveTo(x(cursor), top - 6); ctx.lineTo(x(cursor), yEnd); ctx.stroke();
      ctx.fillStyle = colors.fg; ctx.fillText(`${hits.length} events mined · precision ${(sc.precision * 100).toFixed(0)}% · recall ${(sc.recall * 100).toFixed(0)}% · amber shading = manual driving`, pad, 18);
      const d = drives[Math.min(drives.length - 1, Number(q.vehicle) - 1)];
      const ph = (h - yEnd - 24) / 2; const ci = Math.floor((cursor / T) * (d.t.length - 1));
      linePlot(ctx, { x: 16, y: yEnd + 12, w: w - 32, h: ph }, [{ data: d.speed, color: colors.live, label: "speed m/s" }, { data: d.brake.map((b) => b * 10), color: colors.bad, label: "brake ×10" }], { title: `vehicle ${d.vehicle} · speed & brake`, cursor: ci });
      linePlot(ctx, { x: 16, y: yEnd + 18 + ph, w: w - 32, h: ph }, [{ data: d.lidarHz, color: colors.violet, label: "lidar Hz" }, { data: d.steer.map((s) => s * 50), color: colors.ok, label: "steer ×50" }], { title: "lidar rate & steer", cursor: ci });
      if ((frames++ & 15) === 0) onTelemetry({ Vehicles: drives.length, "Log hours": ((drives.length * T) / 3600).toFixed(2), "Events mined": hits.length, "GT events": sc.tp + sc.fn, Precision: sc.precision, Recall: sc.recall, "t (s)": cursor });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
