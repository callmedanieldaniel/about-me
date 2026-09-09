"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineProps } from "../../types";

const DIM = 24;

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embed(tok: string): number[] {
  const r = rng(hashStr(tok.toLowerCase()));
  const v = Array.from({ length: DIM }, () => r() * 2 - 1);
  // Shared "semantic" component for simple word classes so heads have structure to find
  const cls = /^(the|a|an)$/.test(tok) ? 1 : /^(it|he|she|they|this|that)$/.test(tok) ? 2 : /ed$|s$/.test(tok) ? 3 : 0;
  for (let i = 0; i < 6; i++) v[i] += cls * 0.6;
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}
function projection(seed: number) {
  const r = rng(seed);
  return Array.from({ length: DIM }, () => Array.from({ length: DIM }, () => (r() * 2 - 1) * 0.6));
}
const mat = (M: number[][], v: number[]) => M.map((row) => row.reduce((s, w, j) => s + w * v[j], 0));

export default function Attention({ params, playing, onTelemetry }: EngineProps) {
  const tokens = useMemo(
    () => String(params.text).trim().split(/\s+/).filter(Boolean).slice(0, 16),
    [params.text],
  );
  const head = Number(params.head);
  const temp = Number(params.temperature);
  const causal = Boolean(params.causal);
  const [hover, setHover] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const attn = useMemo(() => {
    const n = tokens.length;
    const E = tokens.map(embed);
    const Wq = projection(11 + head * 101), Wk = projection(29 + head * 103);
    const Q = E.map((e) => mat(Wq, e)), K = E.map((e) => mat(Wk, e));
    const A: number[][] = [];
    for (let i = 0; i < n; i++) {
      const scores: number[] = [];
      for (let j = 0; j < n; j++) {
        let s = Q[i].reduce((acc, x, d) => acc + x * K[j][d], 0) / Math.sqrt(DIM);
        if (head === 3) s = -Math.abs(i - j - 1) * 1.6; // positional head: previous token
        if (head === 2) s += E[i].reduce((acc, x, d) => acc + x * E[j][d], 0) * 2.2; // similarity head
        if (causal && j > i) s = -Infinity;
        scores.push(s / temp);
      }
      const m = Math.max(...scores);
      const ex = scores.map((s) => (s === -Infinity ? 0 : Math.exp(s - m)));
      const z = ex.reduce((a, b) => a + b, 0) || 1;
      A.push(ex.map((e) => e / z));
    }
    return A;
  }, [tokens, head, temp, causal]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setCursor((c) => (c + 1) % Math.max(1, tokens.length)), 1100);
    return () => clearInterval(id);
  }, [playing, tokens.length]);

  const sel = hover ?? Math.min(cursor, tokens.length - 1);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const n = tokens.length;
    const S = c.width;
    ctx.fillStyle = "#070b12";
    ctx.fillRect(0, 0, S, S);
    if (!n) return;
    const cell = S / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const w = attn[i][j];
        const a = Math.min(1, w * 1.1);
        ctx.fillStyle = i === sel ? `rgba(185,156,255,${0.15 + a * 0.85})` : `rgba(94,231,255,${0.06 + a * 0.9})`;
        ctx.fillRect(j * cell + 1, i * cell + 1, cell - 2, cell - 2);
      }
  }, [attn, tokens.length, sel]);

  useEffect(() => {
    if (!tokens.length) return;
    const row = attn[sel] ?? [];
    const ent = -row.reduce((s, w) => (w > 0 ? s + w * Math.log2(w) : s), 0);
    const top = row.reduce((bi, w, i) => (w > row[bi] ? i : bi), 0);
    onTelemetry({
      Tokens: tokens.length,
      "Query token": tokens[sel] ?? "—",
      "Top attended": `${tokens[top]} (${(row[top] * 100).toFixed(0)}%)`,
      "Row entropy (bits)": Math.round(ent * 100) / 100,
      "Head type": ["content A", "content B", "similarity", "previous-token"][head],
      Mask: causal ? "causal" : "bidirectional",
    });
  }, [attn, sel, tokens, head, causal, onTelemetry]);

  const n = tokens.length;
  const W = 720, top = 40, bottom = 190;
  const xs = tokens.map((_, i) => ((i + 0.5) / n) * W);

  return (
    <div className="engine-host attention">
      <div className="attention-arcs">
        <svg viewBox={`0 0 ${W} 230`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Attention arcs from the selected query token to every key token">
          {n > 0 &&
            attn[sel].map((w, j) => {
              if (w < 0.02 || j === sel) return null;
              const x0 = xs[sel], x1 = xs[j];
              const midY = top + 20 + Math.abs(x1 - x0) * 0.35;
              return (
                <path
                  key={j}
                  d={`M ${x0} ${top} Q ${(x0 + x1) / 2} ${midY} ${x1} ${top}`}
                  fill="none"
                  stroke="#5ee7ff"
                  strokeOpacity={0.15 + w * 0.85}
                  strokeWidth={1 + w * 7}
                />
              );
            })}
          {tokens.map((t, i) => (
            <g key={i} transform={`translate(${xs[i]}, ${top})`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle r={7} fill={i === sel ? "#b99cff" : "#0d1420"} stroke={i === sel ? "#b99cff" : "#5ee7ff"} strokeWidth={1.5} />
              <text y={-14} textAnchor="middle" fill={i === sel ? "#b99cff" : "#e6eef8"} fontSize={n > 10 ? 12 : 14} fontFamily="'IBM Plex Mono', monospace">
                {t}
              </text>
              {n > 0 && (
                <text y={bottom - top} textAnchor="middle" fill="#7e90a8" fontSize={11} fontFamily="'IBM Plex Mono', monospace">
                  {(attn[sel][i] * 100).toFixed(0)}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="attention-matrix">
        <canvas ref={canvas} width={320} height={320} />
        <span>Rows: query · columns: key</span>
      </div>
    </div>
  );
}
