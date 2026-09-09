"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { buildGeoms, loadModel, loadMujoco, syncGeoms } from "../../kit/mujoco";
import { ARM_XML } from "../../kit/mjcf/humanoid";
import type { EngineProps } from "../../types";

// MuJoCo WASM 5-DoF arm with a parallel gripper: joint targets from sliders or a scripted pick-and-place; contacts and grasp state reported.
export default function MjArm({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading MuJoCo WASM…");
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    let alive = true, raf = 0, cleanup = () => {};
    (async () => {
      const mj = await loadMujoco(); if (!alive) return;
      const { model, data } = await loadModel(mj, "arm", ARM_XML);
      const stage = createStage(el, { position: [1.4, 1.1, 1.3], target: [0.4, 0.3, 0], grid: 4, fov: 40 }); if (!stage) return;
      const { scene } = stage; const { meshes } = buildGeoms(model, scene);
      const contactPts = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(64 * 3), 3)), new THREE.PointsMaterial({ color: 0xff5d73, size: 0.03 })); scene.add(contactPts);
      setStatus("");
      const ctrl = data.ctrl as Float64Array; let t = 0, last = performance.now(), grasped = false;
      const cubeBody = 8; // cube body id (base..gripper chain first)
      // scripted pick-and-place keyframes: [j1, j2, j3, j4, j5, grip]
      const script: [number, number[]][] = [[0, [0, 0.2, 1.0, 0.3, 0, 1]], [2, [0.1, 0.9, 0.9, 0.5, 0, 1]], [3.5, [0.1, 1.05, 0.95, 0.55, 0, 0]], [5, [0.1, 0.5, 0.8, 0.4, 0, 0]], [7, [-1.2, 0.5, 0.8, 0.4, 0, 0]], [8.5, [-1.2, 1.0, 0.9, 0.5, 0, 0]], [9.5, [-1.2, 1.0, 0.9, 0.5, 0, 1]], [11, [-1.2, 0.2, 1.0, 0.3, 0, 1]], [13, [0, 0.2, 1.0, 0.3, 0, 1]]];
      const target = (tt: number) => { const T = 13; const s = tt % T; let a = script[0], b = script[script.length - 1]; for (let i = 0; i < script.length - 1; i++) if (s >= script[i][0] && s < script[i + 1][0]) { a = script[i]; b = script[i + 1]; } const k = (s - a[0]) / Math.max(0.01, b[0] - a[0]); return a[1].map((v, i) => v + (b[1][i] - v) * Math.min(1, k)); };
      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
        const q = p.current;
        if (play.current) {
          const steps = Math.min(40, Math.round(dt / model.opt.timestep));
          for (let s = 0; s < steps; s++) {
            const tg = Boolean(q.script) ? target(t) : [Number(q.j1), Number(q.j2), Number(q.j3), Number(q.j4), Number(q.j5), Number(q.grip)];
            ctrl[0] = tg[0]; ctrl[1] = tg[1]; ctrl[2] = tg[2]; ctrl[3] = tg[3]; ctrl[4] = tg[4]; ctrl[5] = -0.03 * (1 - tg[5]); ctrl[6] = 0.03 * (1 - tg[5]);
            mj.mj_step(model, data); t += model.opt.timestep;
          }
        }
        syncGeoms(data, meshes);
        const xpos = data.xpos as Float64Array; const cubeZ = xpos[cubeBody * 3 + 2]; grasped = cubeZ > 0.5;
        // contact points
        const arr = contactPts.geometry.attributes.position.array as Float32Array; let n = 0;
        try { const nc = Math.min(64, data.ncon); for (let i = 0; i < nc; i++) { const c = data.contact.get(i); if (!c) continue; arr[n * 3] = c.pos[0]; arr[n * 3 + 1] = c.pos[2]; arr[n * 3 + 2] = -c.pos[1]; n++; } } catch { /* skip */ }
        contactPts.geometry.setDrawRange(0, n); contactPts.geometry.attributes.position.needsUpdate = true; contactPts.visible = Boolean(q.contacts);
        stage.render();
        if ((Math.floor(now / 100) & 1) === 0) onTelemetry({ "Sim time (s)": t, Mode: Boolean(q.script) ? "scripted pick & place" : "manual joints", Contacts: data.ncon, "Cube height (m)": cubeZ, Grasp: grasped ? "lifted" : "on table", "Actuators": model.nu });
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      cleanup = () => { cancelAnimationFrame(raf); stage.dispose(); data.delete(); model.delete(); };
    })().catch((e) => setStatus(`MuJoCo failed to load: ${e?.message ?? e}`));
    return () => { alive = false; cleanup(); };
  }, [resetKey, onTelemetry]);
  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      {status && <div className="engine-loading"><span className="spin" />{status}</div>}
    </div>
  );
}
