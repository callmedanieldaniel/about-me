"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { buildGeoms, loadModel, loadMujoco, syncGeoms } from "../../kit/mujoco";
import { HUMANOID_XML } from "../../kit/mjcf/humanoid";
import type { EngineProps } from "../../types";

// MuJoCo WASM humanoid: PD position actuators hold a standing pose; push it, change stiffness, watch it fall. Real contact dynamics at 200 Hz.
export default function MjHumanoid({ params, playing, resetKey, command, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading MuJoCo WASM…");
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  const cmd = useRef(command); cmd.current = command;
  useEffect(() => {
    const el = host.current; if (!el) return;
    let alive = true, raf = 0, cleanup = () => {};
    (async () => {
      const mj = await loadMujoco(); if (!alive) return;
      const { model, data } = await loadModel(mj, "humanoid", HUMANOID_XML);
      const stage = createStage(el, { position: [3, 2, 3], target: [0, 1, 0], grid: 12, fov: 40 }); if (!stage) return;
      const { scene } = stage; const { meshes } = buildGeoms(model, scene);
      const com = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7cf3a0 })); scene.add(com);
      const comShadow = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.07, 24), new THREE.MeshBasicMaterial({ color: 0x7cf3a0, side: THREE.DoubleSide })); comShadow.rotation.x = -Math.PI / 2; scene.add(comShadow);
      setStatus("");
      const stand = [-0.15, 0.35, -0.2, -0.15, 0.35, -0.2, -0.4, -0.5, -0.4, -0.5]; // hip, knee, ankle ×2, shoulder, elbow ×2 (rad)
      const ctrl = data.ctrl as Float64Array; const qpos = data.qpos as Float64Array; const xfrc = data.xfrc_applied as Float64Array;
      const torsoId = 1; // first body after world
      let lastSeq = 0, t = 0, fallen = false, pushes = 0, last = performance.now();
      const reset = () => { mj.mj_resetData(model, data); t = 0; fallen = false; };
      reset();
      const frame = (now: number) => {
        if (!alive) return;
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
        const q = p.current; const kp = Number(q.kp);
        // set actuator gains (position kp lives in actuator_gainprm[0] and biasprm[1] = -kp)
        const gain = model.actuator_gainprm as Float64Array, bias = model.actuator_biasprm as Float64Array;
        for (let i = 0; i < model.nu; i++) { gain[i * 10] = kp; bias[i * 10 + 1] = -kp; }
        const c = cmd.current; if (c && c.seq !== lastSeq) { lastSeq = c.seq; if (c.name === "push") { const f = Number(q.pushForce); xfrc[torsoId * 6] = f * (Math.random() < 0.5 ? 1 : -1); xfrc[torsoId * 6 + 1] = f * 0.4; pushes++; } if (c.name === "reset") reset(); }
        if (play.current) {
          const steps = Math.round(dt / model.opt.timestep * Number(q.timeScale));
          for (let s = 0; s < Math.min(steps, 40); s++) { for (let i = 0; i < model.nu; i++) ctrl[i] = stand[i] + (i === 1 || i === 4 ? Number(q.crouch) : 0); mj.mj_step(model, data); t += model.opt.timestep; if (s > 8) { for (let k = 0; k < 6; k++) xfrc[torsoId * 6 + k] = 0; } }
        }
        syncGeoms(data, meshes);
        const sub = data.subtree_com as Float64Array; com.position.set(sub[torsoId * 3], sub[torsoId * 3 + 2], -sub[torsoId * 3 + 1]); comShadow.position.set(com.position.x, 0.01, com.position.z);
        const torsoZ = qpos[2]; fallen = torsoZ < 0.7;
        stage.render();
        if ((Math.floor(now / 100) & 1) === 0) onTelemetry({ "Sim time (s)": t, "Torso height (m)": torsoZ, State: fallen ? "FALLEN" : "standing", Contacts: data.ncon, "PD gain kp": kp, Pushes: pushes, "Timestep (ms)": model.opt.timestep * 1000 });
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
