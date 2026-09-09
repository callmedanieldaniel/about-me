"use client";
import { useEffect, useRef } from "react";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Supply-chain dependency graph: tiered suppliers with a force layout; knock out a node and watch the disruption propagate through single-source edges with lead-time delay.
export default function SupplyChain({ params, playing, resetKey, command, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing; const cmd = useRef(command); cmd.current = command;
  useEffect(() => {
    const c = cv.current; if (!c) return; const rng = mulberry32(21);
    type Node = { id: number; tier: number; x: number; y: number; vx: number; vy: number; health: number; name: string }; const nodes: Node[] = []; const edges: [number, number][] = [];
    const names = ["OEM", "battery pack", "motor", "ECU", "cells", "magnets", "SoC", "lithium", "rare earths", "wafers", "cathode", "anode", "power IC", "connectors", "harness", "mining", "refining", "fab"];
    [1, 3, 5, 9].forEach((n, tier) => { for (let i = 0; i < n; i++) nodes.push({ id: nodes.length, tier, x: 0.15 + tier * 0.23 + (rng() - 0.5) * 0.05, y: (i + 1) / (n + 1), vx: 0, vy: 0, health: 1, name: names[nodes.length] ?? `T${tier}-${i}` }); });
    nodes.forEach((n) => { if (n.tier === 0) return; const parents = nodes.filter((m) => m.tier === n.tier - 1); const k = Number(p.current.redundancy) > rng() ? 2 : 1; for (let j = 0; j < k; j++) edges.push([parents[Math.floor(rng() * parents.length)].id, n.id]); });
    let t = 0, raf = 0, frames = 0, last = performance.now(), lastSeq = 0, knocked = -1;
    const draw = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current) t += dt;
      const cm = cmd.current; if (cm && cm.seq !== lastSeq) { lastSeq = cm.seq; if (cm.name === "knock") { knocked = Number(q.target); nodes[knocked].health = 0; } if (cm.name === "restore") { knocked = -1; nodes.forEach((n) => (n.health = 1)); } }
      // propagate: a node's health = min over suppliers if single-sourced, else max; with lead-time lag
      if (play.current) nodes.forEach((n) => { if (n.id === knocked) return; const sup = edges.filter(([, b]) => b === n.id).map(([a]) => nodes[a].health); if (!sup.length) return; const target = sup.length > 1 ? Math.max(...sup) : sup[0]; n.health += (target - n.health) * dt / Number(q.leadTime); });
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h); const X = (n: Node) => n.x * w, Y = (n: Node) => n.y * h;
      edges.forEach(([a, b]) => { const na = nodes[a], nb = nodes[b]; const single = edges.filter(([, y]) => y === b).length === 1; ctx.strokeStyle = na.health < 0.5 ? colors.bad : single ? colors.ref : colors.line; ctx.lineWidth = single ? 1.5 : 1; ctx.setLineDash(single ? [] : [3, 3]); ctx.beginPath(); ctx.moveTo(X(na), Y(na)); ctx.lineTo(X(nb), Y(nb)); ctx.stroke(); ctx.setLineDash([]); const s = (t * 0.5 + a * 0.1) % 1; ctx.fillStyle = colors.live; ctx.globalAlpha = na.health; ctx.beginPath(); ctx.arc(X(na) + (X(nb) - X(na)) * s, Y(na) + (Y(nb) - Y(na)) * s, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
      nodes.forEach((n) => { const r = 8 + (3 - n.tier) * 3; ctx.fillStyle = `rgba(${255 - n.health * 161},${93 + n.health * 150},${115 + n.health * 45},1)`; ctx.beginPath(); ctx.arc(X(n), Y(n), r, 0, Math.PI * 2); ctx.fill(); if (n.id === Number(q.target)) { ctx.strokeStyle = colors.fg; ctx.lineWidth = 2; ctx.stroke(); } ctx.fillStyle = colors.fg; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.fillText(`${n.id} ${n.name}`, X(n) + r + 4, Y(n) + 4); });
      ["tier 0 · OEM", "tier 1", "tier 2", "tier 3 · raw"].forEach((s, i) => { ctx.fillStyle = colors.muted; ctx.fillText(s, (0.15 + i * 0.23) * w - 20, 16); });
      const single = nodes.filter((n) => edges.filter(([, b]) => b === n.id).length === 1).length;
      if ((frames++ & 15) === 0) onTelemetry({ Nodes: nodes.length, Edges: edges.length, "Single-sourced nodes": single, "OEM health %": nodes[0].health * 100, "Impaired (< 50%)": nodes.filter((n) => n.health < 0.5).length, Knocked: knocked >= 0 ? nodes[knocked].name : "none" });
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, params.redundancy, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
