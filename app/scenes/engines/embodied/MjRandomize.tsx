"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { buildGeoms, loadModel, loadMujoco, syncGeoms } from "../../kit/mujoco";
import { DROP_XML } from "../../kit/mjcf/humanoid";
import type { EngineProps } from "../../types";

// Domain randomization: the same drop scene compiled three times with different friction / mass / restitution, simulated side by side in one MuJoCo WASM instance.
export default function MjRandomize({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading MuJoCo WASM…");
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    let alive = true, raf = 0, cleanup = () => {};
    (async () => {
      const mj = await loadMujoco(); if (!alive) return;
      const q0 = p.current; const spread = Number(q0.spread);
      const variants = [{ f: Number(q0.friction) * (1 - spread), m: Number(q0.mass) * (1 - spread), r: Number(q0.restitution) * (1 - spread), label: "low" }, { f: Number(q0.friction), m: Number(q0.mass), r: Number(q0.restitution), label: "nominal" }, { f: Number(q0.friction) * (1 + spread), m: Number(q0.mass) * (1 + spread), r: Math.min(0.95, Number(q0.restitution) * (1 + spread)), label: "high" }];
      const sims = await Promise.all(variants.map((v, i) => loadModel(mj, `drop${i}`, DROP_XML(Math.max(0.05, v.f), Math.max(0.02, v.m), Math.max(0, Math.min(0.95, v.r))))));
      const stage = createStage(el, { position: [0.5, 2.2, 4.2], target: [0.2, 0.5, 0], grid: 8, fov: 40 }); if (!stage) return;
      const { scene } = stage;
      const worlds = sims.map((s, i) => { const grp = new THREE.Group(); grp.position.x = (i - 1) * 1.8; scene.add(grp); const sub = new THREE.Scene(); const { root, meshes } = buildGeoms(s.model, sub); grp.add(root); const v = variants[i]; const lb = makeLabel(v.label + " · mu=" + v.f.toFixed(2) + " m=" + v.m.toFixed(2) + "kg", i === 1 ? "#5ee7ff" : "#7e90a8", 1.2); lb.position.set(0, 1.9, 0); grp.add(lb); return { ...s, meshes }; });
      setStatus("");
      let t = 0, last = performance.now();
      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
        if (play.current) { const steps = Math.min(30, Math.round(dt / worlds[0].model.opt.timestep)); for (let s = 0; s < steps; s++) { worlds.forEach((w) => mj.mj_step(w.model, w.data)); t += worlds[0].model.opt.timestep; } if (t > 6) { worlds.forEach((w) => mj.mj_resetData(w.model, w.data)); t = 0; } }
        worlds.forEach((w) => syncGeoms(w.data, w.meshes));
        stage.render();
        if ((Math.floor(now / 100) & 1) === 0) { const tel: Record<string, string | number> = { "Sim time (s)": t }; worlds.forEach((w, i) => { const xp = w.data.xpos as Float64Array; tel[`${variants[i].label} cube x (m)`] = xp[1 * 3]; tel[`${variants[i].label} contacts`] = w.data.ncon; }); onTelemetry(tel); }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      cleanup = () => { cancelAnimationFrame(raf); stage.dispose(); worlds.forEach((w) => { w.data.delete(); w.model.delete(); }); };
    })().catch((e) => setStatus(`MuJoCo failed to load: ${e?.message ?? e}`));
    return () => { alive = false; cleanup(); };
  }, [resetKey, params.friction, params.mass, params.restitution, params.spread, onTelemetry]);
  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      {status && <div className="engine-loading"><span className="spin" />{status}</div>}
    </div>
  );
}
