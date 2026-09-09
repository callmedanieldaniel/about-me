"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Signalized intersection: four approaches with queues, a fixed-time or actuated controller; delay and queue length are measured (the SUMO/TraCI experiment, simplified).
export default function Signals({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(3); type V = { x: number; v: number; w: number }; const lanes: V[][] = [[], [], [], []]; // N,E,S,W
    lanes.forEach((ln) => { for (let k = 0; k < 6; k++) ln.push({ x: 6 + k * 9 + rng() * 3, v: 0, w: 0 }); });
    let phase = 0, phaseT = 0, t = 0, last = performance.now(), raf = 0, frames = 0, served = 0, totalDelay = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const green = Number(q.green), arrival = Number(q.arrival), actuated = Boolean(q.actuated);
      if (play.current) { t += dt; phaseT += dt;
        lanes.forEach((ln, i) => { const rate = arrival * (i % 2 ? Number(q.eastWestBias) : 1); if (rng() < rate * dt && (!ln.length || ln[ln.length - 1].x > 8)) ln.push({ x: 120, v: 12, w: 0 }); });
        const greenFor = (i: number) => (phase === 0 ? i % 2 === 0 : i % 2 === 1);
        lanes.forEach((ln, i) => { ln.forEach((veh, k) => { const ahead = k ? ln[k - 1].x + 5 : greenFor(i) || veh.x < 0 ? -1e9 : 2; const gap = veh.x - ahead; const target = gap > 15 ? 12 : Math.max(0, (gap - 2) * 0.8); veh.v += Math.max(-4, Math.min(2, target - veh.v)) * dt; veh.v = Math.max(0, veh.v); veh.x -= veh.v * dt; if (veh.v < 0.5 && veh.x > 0) { veh.w += dt; totalDelay += dt; } }); for (let k = ln.length - 1; k >= 0; k--) if (ln[k].x < -60) { ln.splice(k, 1); served++; } });
        const queueOther = (phase === 0 ? lanes[1].length + lanes[3].length : lanes[0].length + lanes[2].length), queueCur = (phase === 0 ? lanes[0].length + lanes[2].length : lanes[1].length + lanes[3].length);
        const minG = 5; if (phaseT > (actuated ? minG : green) && (!actuated || phaseT > green || queueOther > queueCur * 1.5 || queueCur === 0)) { phase = 1 - phase; phaseT = 0; }
      }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const cx = w * 0.4, cy = h / 2, S = Math.min(w * 0.4, h * 0.45) / 120;
      ctx.fillStyle = "#0b1320"; ctx.fillRect(cx - 14, 0, 28, h); ctx.fillRect(0, cy - 14, w * 0.8, 28);
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      lanes.forEach((ln, i) => { const [dx, dy] = dirs[i]; const off = 6; for (const veh of ln) { const x = cx + dx * veh.x * S + (i === 0 ? off : i === 2 ? -off : 0), y = cy + dy * veh.x * S + (i === 1 ? -off : i === 3 ? off : 0); ctx.fillStyle = veh.v < 0.5 ? colors.bad : colors.live; ctx.fillRect(x - 3, y - 3, 6, 6); } const g = phase === 0 ? i % 2 === 0 : i % 2 === 1; ctx.fillStyle = g ? colors.ok : colors.bad; ctx.beginPath(); ctx.arc(cx + dx * 22, cy + dy * 22, 4, 0, Math.PI * 2); ctx.fill(); });
      // stats panel
      const qx = w * 0.8 + 10; ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; const qs = lanes.map((ln) => ln.filter((v) => v.v < 0.5).length); ["N", "E", "S", "W"].forEach((n, i) => { ctx.fillStyle = colors.muted; ctx.fillText(`${n} queue`, qx, 40 + i * 40); ctx.fillStyle = colors.bad; ctx.fillRect(qx, 46 + i * 40, qs[i] * 8, 10); ctx.fillStyle = colors.fg; ctx.fillText(String(qs[i]), qx + qs[i] * 8 + 6, 55 + i * 40); });
      ctx.fillStyle = colors.fg; ctx.fillText(`${actuated ? "actuated" : "fixed-time"} · phase ${phase === 0 ? "N–S" : "E–W"} · ${phaseT.toFixed(1)} s`, qx, 220);
      if ((frames++ & 15) === 0) onTelemetry({ "t (s)": t, Controller: actuated ? "actuated" : "fixed", "Vehicles served": served, "Mean delay (s/veh)": served ? totalDelay / served : 0, "Total queued": qs.reduce((a, b) => a + b, 0), Phase: phase === 0 ? "N–S green" : "E–W green" });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
