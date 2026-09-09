"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Embedding map: 600 synthetic 32-d vectors from 6 clusters projected to 2-D with an in-browser t-SNE-like force layout (attraction to k-NN, repulsion from all); hover shows nearest neighbours.
export default function Embeddings({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(9); const N = 600, D = 32, K = 6;
    const centers = Array.from({ length: K }, () => Array.from({ length: D }, () => (rng() - 0.5) * 4)); const X = Array.from({ length: N }, (_, i) => centers[i % K].map((v) => v + (rng() - 0.5) * 1.6)); const label = Array.from({ length: N }, (_, i) => i % K);
    const dist = (a: number[], b: number[]) => { let s = 0; for (let i = 0; i < D; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s); };
    const knn = X.map((x, i) => X.map((y, j) => [dist(x, y), j]).filter((d) => d[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, 8).map((d) => d[1]));
    const Y = X.map(() => [(rng() - 0.5) * 100, (rng() - 0.5) * 100]); const V = Y.map(() => [0, 0]);
    let raf = 0, frames = 0, iter = 0, hover = -1; const names = ["car", "pedestrian", "cone", "night", "rain", "construction"];
    const onMove = (e: MouseEvent) => { const r = c.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top; let best = -1, bd = 12; Y.forEach((y, i) => { const d = Math.hypot(r.width / 2 + y[0] * 3 - mx, r.height / 2 + y[1] * 3 - my); if (d < bd) { bd = d; best = i; } }); hover = best; }; c.addEventListener("mousemove", onMove);
    const draw = () => { const q = p.current; const rep = Number(q.repulsion), att = Number(q.attraction);
      if (play.current && iter < 800) for (let s = 0; s < 3; s++) { iter++; for (let i = 0; i < N; i++) { let fx = 0, fy = 0; for (let j = 0; j < N; j++) { if (i === j) continue; const dx = Y[i][0] - Y[j][0], dy = Y[i][1] - Y[j][1]; const d2 = dx * dx + dy * dy + 0.5; const f = rep / d2; fx += dx * f; fy += dy * f; } for (const j of knn[i]) { const dx = Y[j][0] - Y[i][0], dy = Y[j][1] - Y[i][1]; fx += dx * att * 0.02; fy += dy * att * 0.02; } fx -= Y[i][0] * 0.002; fy -= Y[i][1] * 0.002; V[i][0] = (V[i][0] + fx) * 0.8; V[i][1] = (V[i][1] + fy) * 0.8; Y[i][0] += V[i][0]; Y[i][1] += V[i][1]; } }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const S = 3; const cols = [colors.live, colors.bad, colors.ref, colors.violet, colors.ok, colors.muted];
      if (hover >= 0) for (const j of knn[hover]) { ctx.strokeStyle = "rgba(230,238,248,0.4)"; ctx.beginPath(); ctx.moveTo(w / 2 + Y[hover][0] * S, h / 2 + Y[hover][1] * S); ctx.lineTo(w / 2 + Y[j][0] * S, h / 2 + Y[j][1] * S); ctx.stroke(); }
      Y.forEach((y, i) => { ctx.fillStyle = cols[label[i]]; ctx.globalAlpha = hover < 0 || i === hover || knn[hover].includes(i) ? 0.9 : 0.35; ctx.beginPath(); ctx.arc(w / 2 + y[0] * S, h / 2 + y[1] * S, i === hover ? 6 : 3, 0, Math.PI * 2); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.font = "11px 'IBM Plex Mono', monospace"; names.forEach((n, k) => { ctx.fillStyle = cols[k]; ctx.fillRect(16, 16 + k * 16, 10, 10); ctx.fillStyle = colors.fg; ctx.fillText(n, 32, 25 + k * 16); });
      ctx.fillStyle = colors.fg; ctx.fillText(hover >= 0 ? `#${hover} · ${names[label[hover]]} · 8-NN: ${knn[hover].map((j) => names[label[j]]).join(", ")}` : `iteration ${iter}/800 · hover a point for neighbours`, 16, h - 12);
      // cluster purity: fraction of kNN with same label
      let pure = 0; for (let i = 0; i < N; i++) pure += knn[i].filter((j) => label[j] === label[i]).length / 8;
      if ((frames++ & 15) === 0) onTelemetry({ Vectors: N, Dimensions: D, Iteration: iter, "kNN purity": pure / N, Clusters: K, Hover: hover >= 0 ? `${hover} (${names[label[hover]]})` : "—" });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); c.removeEventListener("mousemove", onMove); };
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
