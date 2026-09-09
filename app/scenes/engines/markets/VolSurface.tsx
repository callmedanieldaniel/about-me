"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import type { EngineProps } from "../../types";

// Implied-volatility surface: SVI-style smile per expiry with term structure, rendered as a live 3-D mesh; skew and curvature knobs deform it.
export default function VolSurface({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [14, 12, 16], target: [0, 3, 0], grid: 0, fov: 42 }); if (!stage) return; const { scene } = stage;
    const NX = 40, NT = 24; const geo = new THREE.PlaneGeometry(16, 12, NX - 1, NT - 1); geo.rotateX(-Math.PI / 2);
    const col = new Float32Array(NX * NT * 3); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, transparent: true, opacity: 0.92 })); scene.add(mesh);
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 })); scene.add(wire);
    [["log-moneyness →", 9, 0, 7], ["expiry →", -9.5, 0, -2], ["IV", -9.5, 8, -7]].forEach(([tx, x, y, z]) => { const l = makeLabel(String(tx), "#7e90a8", 1.2); l.position.set(Number(x), Number(y), Number(z)); scene.add(l); });
    const lo = new THREE.Color(0x27394f), mid = new THREE.Color(0x5ee7ff), hi = new THREE.Color(0xff5d73); let t = 0, last = performance.now(), raf = 0, frames = 0;
    const frame = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current) t += dt;
      const base = Number(q.base), skew = Number(q.skew), curv = Number(q.curv), term = Number(q.term), shock = Number(q.shock) * Math.sin(t * 1.5);
      const pos = geo.attributes.position.array as Float32Array; let minIv = 9, maxIv = 0;
      for (let j = 0; j < NT; j++) for (let i = 0; i < NX; i++) { const k = (i / (NX - 1) - 0.5) * 0.8; const T = 0.05 + (j / (NT - 1)) * 2; const iv = base + term * Math.sqrt(T) * 0.3 + (skew * k + curv * k * k) / Math.sqrt(T + 0.15) + shock * Math.exp(-T * 3) * Math.exp(-k * k * 8); const idx = j * NX + i; pos[idx * 3 + 1] = iv * 12; minIv = Math.min(minIv, iv); maxIv = Math.max(maxIv, iv); const c = iv < 0.3 ? lo.clone().lerp(mid, iv / 0.3) : mid.clone().lerp(hi, Math.min(1, (iv - 0.3) / 0.5)); col.set([c.r, c.g, c.b], idx * 3); }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); wire.geometry.dispose(); wire.geometry = new THREE.WireframeGeometry(geo);
      stage.render(); if ((frames++ & 15) === 0) onTelemetry({ "ATM IV (1y)": base + term * 0.3, "Min IV": minIv, "Max IV": maxIv, "25Δ skew proxy": skew, "Front shock": shock, Grid: `${NX}×${NT}` }); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
