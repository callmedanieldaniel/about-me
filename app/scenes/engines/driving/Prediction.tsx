"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Multimodal trajectory prediction at an intersection: each agent gets K hypotheses with probabilities.
type Agent = { pos: THREE.Vector3; heading: number; speed: number; kind: "car" | "ped"; mesh: THREE.Object3D; lines: THREE.Line[]; probs: number[] };

export default function Prediction({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [0, 42, 34], target: [0, 0, 0], grid: 0, fov: 40 });
    if (!stage) return;
    const { scene } = stage;
    const rng = mulberry32(3);
    // intersection
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0b1320 });
    for (const rot of [0, Math.PI / 2]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(90, 14), roadMat); r.rotation.set(-Math.PI / 2, 0, rot); scene.add(r); }
    const cw = new THREE.LineBasicMaterial({ color: 0x3a4c66 });
    for (const s of [-1, 1]) for (const rot of [0, 1]) for (let i = -6; i <= 6; i += 1.2) {
      const g = new THREE.BufferGeometry();
      const a = rot ? [i, 0.02, s * 8, i, 0.02, s * 10] : [s * 8, 0.02, i, s * 10, 0.02, i];
      g.setAttribute("position", new THREE.Float32BufferAttribute(a, 3)); scene.add(new THREE.Line(g, cw));
    }
    const K = 6, H = 40;
    const agents: Agent[] = [];
    const spawn = (kind: "car" | "ped") => {
      const side = Math.floor(rng() * 4);
      const dist = 20 + rng() * 18;
      const heading = [0, Math.PI, Math.PI / 2, -Math.PI / 2][side];
      const lat = kind === "ped" ? 8.5 : 3.5;
      const pos = side === 0 ? new THREE.Vector3(-dist, 0, lat) : side === 1 ? new THREE.Vector3(dist, 0, -lat) : side === 2 ? new THREE.Vector3(-lat, 0, -dist) : new THREE.Vector3(lat, 0, dist);
      const mesh = kind === "car" ? new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 1.9), new THREE.MeshStandardMaterial({ color: 0x5ee7ff })) : new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8), new THREE.MeshStandardMaterial({ color: 0xff5d73 }));
      mesh.position.y = kind === "car" ? 0.7 : 0.85;
      const lines: THREE.Line[] = [];
      for (let k = 0; k < K; k++) {
        const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(H * 3), 3));
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x7cf3a0, transparent: true, opacity: 0.3 })); scene.add(l); lines.push(l);
      }
      const a: Agent = { pos, heading, speed: kind === "ped" ? 1.4 : 6 + rng() * 5, kind, mesh, lines, probs: [] };
      scene.add(mesh); agents.push(a);
    };
    for (let i = 0; i < 7; i++) spawn("car");
    for (let i = 0; i < 4; i++) spawn("ped");
    const ego = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 1.9), new THREE.MeshStandardMaterial({ color: 0xffb454 })); ego.position.set(-24, 0.75, 3.5); scene.add(ego);
    const lbl = makeLabel("ego", "#ffb454", 0.8); lbl.position.set(-24, 2.5, 3.5); scene.add(lbl);

    const maneuvers = [
      { name: "straight", turn: 0, w: 1 },
      { name: "left", turn: 1, w: 0.5 },
      { name: "right", turn: -1, w: 0.5 },
      { name: "slow", turn: 0, w: 0.35, brake: true },
      { name: "u-turn", turn: 2, w: 0.08 },
      { name: "swerve", turn: 0.3, w: 0.2 },
    ];
    let t = 0, last = performance.now(), raf = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      const horizon = Number(q.horizon), temp = Number(q.temperature), topK = Number(q.topK), showAll = Boolean(q.showAll);
      if (play.current) t += dt;
      let minTTC = Infinity, hyp = 0;
      for (const a of agents) {
        if (play.current) {
          a.pos.x += Math.cos(a.heading) * a.speed * dt; a.pos.z -= Math.sin(a.heading) * a.speed * dt;
          if (Math.abs(a.pos.x) > 44 || Math.abs(a.pos.z) > 44) { a.pos.multiplyScalar(-0.95); }
        }
        a.mesh.position.set(a.pos.x, a.mesh.position.y, a.pos.z); a.mesh.rotation.y = a.heading;
        // hypotheses: sample maneuvers, score by prior × distance-to-intersection plausibility
        const dInt = a.pos.length();
        const scores = maneuvers.map((m) => {
          let s = m.w;
          if (m.turn !== 0 && dInt > 22) s *= 0.15; // far from intersection: turning implausible
          if (a.kind === "ped") s = m.name === "straight" ? 1 : m.name === "slow" ? 0.4 : 0.02;
          return Math.exp(Math.log(s + 1e-6) / temp);
        });
        const Z = scores.reduce((x, y) => x + y, 0);
        a.probs = scores.map((s) => s / Z);
        const order = a.probs.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]);
        a.lines.forEach((l) => (l.visible = false));
        order.slice(0, showAll ? K : topK).forEach(([prob, mi], rank) => {
          const m = maneuvers[mi as number]; const line = a.lines[mi as number]; line.visible = true;
          const arr = line.geometry.attributes.position.array as Float32Array;
          let x = a.pos.x, z = a.pos.z, h = a.heading, v = a.speed;
          const step = horizon / (H - 1);
          for (let i = 0; i < H; i++) {
            arr[i * 3] = x; arr[i * 3 + 1] = 0.3 + rank * 0.02; arr[i * 3 + 2] = z;
            const near = Math.hypot(x, z) < 12;
            const turnRate = near ? m.turn * 0.55 : 0;
            h += turnRate * step; if ((m as { brake?: boolean }).brake) v = Math.max(0.5, v - 3 * step);
            x += Math.cos(h) * v * step; z -= Math.sin(h) * v * step;
            // ego TTC check: distance from ego
            const de = Math.hypot(x - ego.position.x, z - ego.position.z);
            if (de < 2.5 && (prob as number) > 0.1) minTTC = Math.min(minTTC, i * step);
          }
          line.geometry.attributes.position.needsUpdate = true;
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.15 + (prob as number) * 0.85;
          mat.color.set(rank === 0 ? 0x7cf3a0 : rank === 1 ? 0x5ee7ff : 0xb99cff);
          hyp++;
        });
      }
      stage.render();
      if ((raf & 7) === 0) onTelemetry({ Agents: agents.length, "Hypotheses shown": hyp, "Horizon (s)": horizon, "Min TTC to ego (s)": Number.isFinite(minTTC) ? minTTC : "none", "Softmax T": temp, "t (s)": t });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
