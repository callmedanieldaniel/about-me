"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Microscopic traffic on a ring road: IDM car-following + MOBIL-style lane changes; density sweeps show the phantom jam emerge (SUMO's core models, in the browser).
type Car = { lane: number; s: number; v: number; l: number; a0: number; id: number };
export default function Traffic({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(8); const L = 600; let cars: Car[] = [];
    const spawn = (n: number) => { cars = []; for (let i = 0; i < n; i++) cars.push({ lane: i % 2, s: (i / n) * L + rng() * 5, v: 20 + rng() * 5, l: 4.5, a0: 0.8 + rng() * 0.8, id: i }); };
    let lastN = -1, raf = 0, frames = 0, t = 0, last = performance.now(), lcCount = 0; const hist: number[][] = [];
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const n = Number(q.count); if (n !== lastN) { lastN = n; spawn(n); hist.length = 0; }
      const v0 = Number(q.v0), T = Number(q.T), s0 = 2, b = 2, a = Number(q.a), pert = Boolean(q.perturb);
      if (play.current) { t += dt; const step = Math.min(dt, 0.05);
        for (const lane of [0, 1]) { const ln = cars.filter((cc) => cc.lane === lane).sort((x, y) => x.s - y.s); ln.forEach((cc, i) => { const lead = ln[(i + 1) % ln.length]; const gap = ((lead.s - cc.s + L) % L) - lead.l || L; const dv = cc.v - lead.v; const sStar = s0 + Math.max(0, cc.v * T + (cc.v * dv) / (2 * Math.sqrt(a * b))); let acc = a * (1 - Math.pow(cc.v / v0, 4) - Math.pow(sStar / Math.max(0.1, gap), 2)); if (pert && cc.id === 0 && t % 20 < 2) acc = -3; cc.v = Math.max(0, cc.v + acc * step); cc.s = (cc.s + cc.v * step) % L; }); }
        // lane change: if gap ahead in own lane is small and the other lane offers more, switch (MOBIL-lite)
        if (Boolean(q.laneChange)) for (const cc of cars) { const gapIn = (lane: number) => { const others = cars.filter((o) => o.lane === lane && o !== cc); let ahead = L, behind = L; for (const o of others) { const d = (o.s - cc.s + L) % L; if (d < ahead) ahead = d; const db = (cc.s - o.s + L) % L; if (db < behind) behind = db; } return { ahead, behind }; }; const own = gapIn(cc.lane), oth = gapIn(1 - cc.lane); if (own.ahead < cc.v * T * 1.2 && oth.ahead > own.ahead * 1.6 && oth.behind > 8 && rng() < 0.05) { cc.lane = 1 - cc.lane; lcCount++; } }
        if ((frames & 3) === 0) { const bins = 60; const row = new Array(bins).fill(0); const cnt = new Array(bins).fill(0); for (const cc of cars) { const bi = Math.floor((cc.s / L) * bins); row[bi] += cc.v; cnt[bi]++; } hist.push(row.map((v, i) => (cnt[i] ? v / cnt[i] : NaN))); if (hist.length > 120) hist.shift(); }
      }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      // ring
      const cx = w * 0.32, cy = h / 2, R = Math.min(w * 0.28, h * 0.42); ctx.strokeStyle = colors.line; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = "#3a4c66"; ctx.lineWidth = 1; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      for (const cc of cars) { const ang = (cc.s / L) * Math.PI * 2; const r = R + (cc.lane ? 9 : -9); const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r; ctx.fillStyle = cc.v < 5 ? colors.bad : cc.v < 15 ? colors.ref : colors.live; ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.fillRect(-2.5, -5, 5, 10); ctx.restore(); }
      // space-time diagram
      const sx = w * 0.62, sw = w - sx - 16, sy = 30, sh = h - 60; ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("space–time · mean speed per segment (red = jam)", sx, 20);
      hist.forEach((row, ri) => row.forEach((v, bi) => { if (Number.isNaN(v)) return; ctx.fillStyle = v < 5 ? colors.bad : v < 15 ? colors.ref : `rgba(94,231,255,${0.3 + (v / v0) * 0.6})`; ctx.fillRect(sx + (bi / row.length) * sw, sy + (ri / 120) * sh, sw / row.length + 0.5, sh / 120 + 0.5); }));
      const mean = cars.reduce((s2, cc) => s2 + cc.v, 0) / Math.max(1, cars.length);
      if ((frames++ & 15) === 0) onTelemetry({ Vehicles: cars.length, "Density (veh/km/lane)": (cars.length / 2 / L) * 1000, "Mean speed (m/s)": mean, "Flow (veh/h/lane)": ((cars.length / 2 / L) * mean * 3600), "Jammed (< 5 m/s)": cars.filter((cc) => cc.v < 5).length, "Lane changes": lcCount });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
