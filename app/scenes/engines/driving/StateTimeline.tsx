"use client";
import { useEffect, useRef, useState } from "react";
import { at, defaultLog, parseLog, series, type Log } from "../../kit/mcap";
import { colors, fitCanvas, linePlot } from "../../kit/plot";
import { Timeline } from "../../kit/Timeline";
import type { EngineProps } from "../../types";

// State-transition swimlanes with brake events and a synchronized speed plot (Foxglove "State Transitions" panel style).
const STATE_COLORS: Record<string, string> = { LANE_FOLLOW: colors.live, PREPARE_LANE_CHANGE: colors.violet, LANE_CHANGE: colors.ok, YIELD: colors.ref, STOP: colors.bad };

export default function StateTimeline({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [log, setLog] = useState<Log | null>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    let alive = true;
    (asset ? parseLog(new Uint8Array(asset), "uploaded MCAP") : defaultLog()).then((l) => alive && (setLog(l), (tRef.current = 0))).catch(() => defaultLog().then((l) => alive && setLog(l)));
    return () => { alive = false; };
  }, [asset, resetKey]);

  useEffect(() => {
    const c = cv.current; if (!c || !log) return;
    const stateT = log.topics.get("/planner/state"), brakeT = log.topics.get("/vehicle/brake"), speedT = log.topics.get("/vehicle/speed"), steerT = log.topics.get("/vehicle/steer");
    const speed = series(speedT, "value"), steer = series(steerT, "value");
    const brakes: number[] = []; if (brakeT) brakeT.msgs.forEach((m, i) => { if (Number(m.value) > Number(p.current.brakeThreshold) && (i === 0 || Number(brakeT.msgs[i - 1].value) <= Number(p.current.brakeThreshold))) brakes.push(brakeT.times[i]); });
    let last = performance.now(), raf = 0, frames = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (play.current) { tRef.current += dt * Number(p.current.rate); if (tRef.current > log.duration) tRef.current = 0; }
      const tt = tRef.current;
      const { ctx, w, h } = fitCanvas(c);
      ctx.clearRect(0, 0, w, h);
      const pad = 16, laneH = 34, top = 30;
      const x = (time: number) => pad + (time / log.duration) * (w - pad * 2);
      ctx.font = "11px 'IBM Plex Mono', monospace";
      // lane 1: planner state
      ctx.fillStyle = colors.muted; ctx.fillText("/planner/state", pad, top - 8);
      if (stateT) for (let i = 0; i < stateT.times.length; i++) {
        const s = String(stateT.msgs[i].state); const x0 = x(stateT.times[i]), x1 = x(i + 1 < stateT.times.length ? stateT.times[i + 1] : log.duration);
        ctx.fillStyle = STATE_COLORS[s] ?? colors.violet; ctx.globalAlpha = tt >= stateT.times[i] ? 0.85 : 0.35; ctx.fillRect(x0, top, Math.max(1, x1 - x0 - 1), laneH); ctx.globalAlpha = 1;
        if (x1 - x0 > 60) { ctx.fillStyle = "#070b12"; ctx.fillText(s, x0 + 6, top + 21); }
      }
      // lane 2: brake events
      const y2 = top + laneH + 26;
      ctx.fillStyle = colors.muted; ctx.fillText(`/vehicle/brake > ${Number(p.current.brakeThreshold).toFixed(2)}  (${brakes.length} events)`, pad, y2 - 8);
      ctx.fillStyle = "rgba(255,93,115,0.15)"; ctx.fillRect(pad, y2, w - pad * 2, laneH);
      for (const b of brakes) { ctx.fillStyle = colors.bad; ctx.fillRect(x(b) - 1, y2, 2, laneH); }
      // lane 3: speed + steer plots
      const y3 = y2 + laneH + 16;
      const plotH = (h - y3 - 40) / 2;
      const cursorIdx = speed.length ? Math.floor((tt / log.duration) * (speed.length - 1)) : 0;
      linePlot(ctx, { x: pad, y: y3, w: w - pad * 2, h: plotH }, [{ data: speed, color: colors.live, label: "speed m/s" }], { title: "/vehicle/speed", cursor: cursorIdx });
      linePlot(ctx, { x: pad, y: y3 + plotH + 8, w: w - pad * 2, h: plotH }, [{ data: steer, color: colors.ref, label: "steer rad" }], { title: "/vehicle/steer", cursor: cursorIdx });
      // cursor over lanes
      ctx.strokeStyle = colors.fg; ctx.beginPath(); ctx.moveTo(x(tt), top - 12); ctx.lineTo(x(tt), y2 + laneH); ctx.stroke();
      if ((frames++ & 5) === 0) { setT(tt); const st = at(stateT, tt); onTelemetry({ "t (s)": tt, State: st ? String(st.state) : "—", "Brake events": brakes.length, "State changes": stateT ? stateT.msgs.length : 0, "Speed (m/s)": speed[cursorIdx] ?? 0 }); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [log, onTelemetry, params.brakeThreshold]);

  return (
    <div className="engine-host">
      <canvas ref={cv} className="engine-fill" />
      {log && <Timeline t={t} duration={log.duration} onSeek={(v) => { tRef.current = v; setT(v); }} />}
      {!log && <div className="engine-loading">Reading log…</div>}
    </div>
  );
}
