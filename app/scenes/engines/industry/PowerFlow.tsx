"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// DC power flow on a 9-bus network: generation / load setpoints solve B·θ = P each frame; line flows animate as particles, overloads turn red; trip a line to see re-dispatch.
export default function PowerFlow({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const buses = [[0.1, 0.5], [0.3, 0.2], [0.3, 0.8], [0.5, 0.35], [0.5, 0.65], [0.7, 0.2], [0.7, 0.8], [0.9, 0.5], [0.5, 0.5]];
    const lines: [number, number, number, number][] = [[0, 1, 5, 2.5], [0, 2, 5, 2.5], [1, 3, 8, 2], [2, 4, 8, 2], [3, 8, 6, 1.6], [4, 8, 6, 1.6], [3, 5, 8, 1.8], [4, 6, 8, 1.8], [5, 7, 5, 2.5], [6, 7, 5, 2.5], [1, 2, 3, 1.2], [5, 6, 3, 1.2]]; // from,to,susceptance,capacity
    let t = 0, raf = 0, frames = 0, last = performance.now();
    const solve = (P: number[], tripped: number) => { const n = buses.length; const B = Array.from({ length: n }, () => Array(n).fill(0)); lines.forEach(([a, b, y], i) => { if (i === tripped) return; B[a][a] += y; B[b][b] += y; B[a][b] -= y; B[b][a] -= y; }); const m = n - 1; const A = Array.from({ length: m }, (_, i) => B[i + 1].slice(1).concat([P[i + 1]])); for (let i = 0; i < m; i++) { let piv = i; for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r; [A[i], A[piv]] = [A[piv], A[i]]; if (Math.abs(A[i][i]) < 1e-9) continue; for (let r = 0; r < m; r++) { if (r === i) continue; const f = A[r][i] / A[i][i]; for (let k = i; k <= m; k++) A[r][k] -= f * A[i][k]; } } const th = [0, ...A.map((row, i) => (Math.abs(row[i]) < 1e-9 ? 0 : row[m] / row[i]))]; return lines.map(([a, b, y], i) => (i === tripped ? 0 : y * (th[a] - th[b]))); };
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current) t += dt;
      const load = Number(q.load); const gen = [Number(q.gen0), 0, 0, 0, 0, 0, 0, Number(q.gen7), Number(q.gen8)]; const demand = [0, load * 0.15, load * 0.15, load * 0.12, load * 0.12, load * 0.18, load * 0.18, 0, load * 0.1]; const totalGen = gen.reduce((a, b) => a + b, 0), totalLoad = demand.reduce((a, b) => a + b, 0); const scale = totalLoad / Math.max(1e-6, totalGen); const P = gen.map((g, i) => g * scale - demand[i]);
      const tripped = Number(q.trip) - 1; const flows = solve(P, tripped);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const X = (i: number) => buses[i][0] * (w - 80) + 40, Y = (i: number) => buses[i][1] * (h - 60) + 30; let overloads = 0;
      lines.forEach(([a, b, , cap], i) => { const f = flows[i]; const ratio = Math.abs(f) / cap; if (i === tripped) { ctx.strokeStyle = colors.bad; ctx.setLineDash([4, 6]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke(); ctx.setLineDash([]); return; } if (ratio > 1) overloads++; ctx.strokeStyle = ratio > 1 ? colors.bad : ratio > 0.8 ? colors.ref : colors.line; ctx.lineWidth = 2 + ratio * 4; ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke(); const dir = f > 0 ? 1 : -1; for (let k = 0; k < 4; k++) { const s = ((t * Math.abs(f) * 0.4 + k / 4) % 1); const u = dir > 0 ? s : 1 - s; ctx.fillStyle = colors.live; ctx.beginPath(); ctx.arc(X(a) + (X(b) - X(a)) * u, Y(a) + (Y(b) - Y(a)) * u, 2.5 + ratio * 2, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = colors.muted; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillText(`${Math.abs(f).toFixed(2)}/${cap}`, (X(a) + X(b)) / 2 + 4, (Y(a) + Y(b)) / 2 - 4); });
      buses.forEach((_, i) => { const g = gen[i] > 0; ctx.fillStyle = g ? colors.ok : demand[i] > 0 ? colors.ref : colors.violet; ctx.beginPath(); ctx.arc(X(i), Y(i), g ? 14 : 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#070b12"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(String(i + 1), X(i) - 3, Y(i) + 4); ctx.fillStyle = colors.fg; ctx.fillText(g ? `G ${(gen[i] * scale).toFixed(2)}` : demand[i] ? `L ${demand[i].toFixed(2)}` : "hub", X(i) - 14, Y(i) + 26); });
      if ((frames++ & 15) === 0) onTelemetry({ "Load (p.u.)": totalLoad, "Gen scaled ×": scale, Overloads: overloads, "Max line loading %": Math.max(...lines.map(([, , , cap], i) => (100 * Math.abs(flows[i])) / cap)), Tripped: tripped >= 0 ? `line ${tripped + 1}` : "none" });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
