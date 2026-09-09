"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import type { EngineProps } from "../../types";

// Lorenz attractor: 24 trajectories from nearby initial conditions integrated with RK4; divergence shows sensitivity to initial conditions.
export default function Lorenz({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [40, 30, 60], target: [0, 25, 0], grid: 0, fov: 45 }); if (!stage) return; const { scene } = stage;
    const K = 24, L = 1500; const lines = Array.from({ length: K }, (_, k) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(L * 3), 3)); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(0.5 + (k / K) * 0.35, 0.9, 0.62), transparent: true, opacity: 0.8 })); scene.add(l); return l; });
    const state = Array.from({ length: K }, (_, k) => [1 + k * Number(p.current.spread) * 1e-3, 1, 1]); const heads: number[] = Array(K).fill(0); const hist = Array.from({ length: K }, () => new Float32Array(L * 3));
    const f = (s: number[], sg: number, r: number, b: number) => [sg * (s[1] - s[0]), s[0] * (r - s[2]) - s[1], s[0] * s[1] - b * s[2]];
    let raf = 0, frames = 0, t = 0, last = performance.now();
    const frame = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; const sg = Number(q.sigma), r = Number(q.rho), b = Number(q.beta), h = 0.005;
      if (play.current) { const steps = Math.round(dt * Number(q.speed) / h); for (let s = 0; s < Math.min(steps, 60); s++) { t += h; state.forEach((st, k) => { const k1 = f(st, sg, r, b), s2 = st.map((v, i) => v + (h / 2) * k1[i]), k2 = f(s2, sg, r, b), s3 = st.map((v, i) => v + (h / 2) * k2[i]), k3 = f(s3, sg, r, b), s4 = st.map((v, i) => v + h * k3[i]), k4 = f(s4, sg, r, b); for (let i = 0; i < 3; i++) st[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); const hh = heads[k]; hist[k].set([st[0], st[2], st[1]], (hh % L) * 3); heads[k] = hh + 1; }); } }
      lines.forEach((l, k) => { const arr = l.geometry.attributes.position.array as Float32Array; const n = Math.min(L, heads[k]); const start = heads[k] > L ? heads[k] % L : 0; for (let i = 0; i < n; i++) { const src = ((start + i) % L) * 3; arr[i * 3] = hist[k][src]; arr[i * 3 + 1] = hist[k][src + 1]; arr[i * 3 + 2] = hist[k][src + 2]; } l.geometry.setDrawRange(0, n); l.geometry.attributes.position.needsUpdate = true; });
      let spread = 0; for (let k = 1; k < K; k++) spread = Math.max(spread, Math.hypot(state[k][0] - state[0][0], state[k][1] - state[0][1], state[k][2] - state[0][2]));
      stage.render(); if ((frames++ & 15) === 0) onTelemetry({ "t": t, σ: sg, ρ: r, β: b, "Trajectories": K, "Max separation": spread, "Lyapunov ≈": t > 1 ? Math.log(Math.max(1e-9, spread) / (Number(q.spread) * 1e-3 * K)) / t : 0 }); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
