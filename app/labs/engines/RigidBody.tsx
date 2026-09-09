"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, palette } from "../stage";
import type { EngineProps } from "../types";

type Rapier = (typeof import("@dimforge/rapier3d-compat"))["default"];
let rapierPromise: Promise<Rapier> | undefined;
const loadRapier = () => {
  rapierPromise ??= import("@dimforge/rapier3d-compat").then(async (m) => {
    await m.default.init();
    return m.default;
  });
  return rapierPromise;
};

export default function RigidBody({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLCanvasElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;
  const [status, setStatus] = useState("Loading physics engine");
  // Physical parameters rebuild the world; the signature is an effect dependency.
  const sig = `${params.gravity}|${params.restitution}|${params.height}|${params.bodies}`;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};
    loadRapier()
      .then((R) => {
        if (cancelled) return;
        setStatus("");
        const stage = createStage(el, { position: [12, 9, 14], target: [0, 2.5, 0], grid: 30 });
        if (!stage) {
          setStatus("WebGL is unavailable in this browser.");
          return;
        }
        const { scene } = stage;
        const q0 = p.current;
        const world = new R.World({ x: 0, y: -Number(q0.gravity), z: 0 });
        const ground = world.createCollider(R.ColliderDesc.cuboid(15, 0.5, 15).setTranslation(0, -0.5, 0).setRestitution(Number(q0.restitution)));
        void ground;
        const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 30), new THREE.MeshStandardMaterial({ color: 0x0f1826, roughness: 0.9 }));
        floor.position.y = -0.5;
        scene.add(floor);
        // A couple of static ramps/blocks so drops become interesting
        const staticMat = new THREE.MeshStandardMaterial({ color: 0x1c2a3d, roughness: 0.8 });
        const blocks = [
          { x: 2, y: 0.6, z: 0, sx: 3, sy: 1.2, sz: 3, rz: 0 },
          { x: -3, y: 1.2, z: 1.5, sx: 4, sy: 0.3, sz: 3, rz: -0.35 },
        ];
        blocks.forEach((b) => {
          const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, b.rz));
          world.createCollider(
            R.ColliderDesc.cuboid(b.sx / 2, b.sy / 2, b.sz / 2).setTranslation(b.x, b.y, b.z).setRotation({ x: rot.x, y: rot.y, z: rot.z, w: rot.w }).setRestitution(Number(q0.restitution)),
          );
          const m = new THREE.Mesh(new THREE.BoxGeometry(b.sx, b.sy, b.sz), staticMat);
          m.position.set(b.x, b.y, b.z);
          m.quaternion.copy(rot);
          scene.add(m);
        });

        const n = Number(q0.bodies);
        const h = Number(q0.height);
        const rest = Number(q0.restitution);
        const bodies: { rb: import("@dimforge/rapier3d-compat").RigidBody; mesh: THREE.Mesh }[] = [];
        const mat = new THREE.MeshStandardMaterial({ color: palette.live, emissive: 0x0a3340, roughness: 0.35, metalness: 0.3 });
        const mat2 = new THREE.MeshStandardMaterial({ color: 0xb99cff, emissive: 0x2a1c55, roughness: 0.35, metalness: 0.3 });
        for (let i = 0; i < n; i++) {
          const ball = i % 3 !== 2;
          const x = (Math.random() - 0.5) * 5, z = (Math.random() - 0.5) * 5, y = h + i * 0.9;
          const rb = world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x, y, z).setAngvel({ x: Math.random(), y: Math.random(), z: Math.random() }));
          const desc = ball ? R.ColliderDesc.ball(0.35) : R.ColliderDesc.cuboid(0.35, 0.35, 0.35);
          world.createCollider(desc.setRestitution(rest).setFriction(0.6).setDensity(1), rb);
          const mesh = new THREE.Mesh(ball ? new THREE.SphereGeometry(0.35, 24, 16) : new THREE.BoxGeometry(0.7, 0.7, 0.7), ball ? mat : mat2);
          scene.add(mesh);
          bodies.push({ rb, mesh });
        }
        const ctx = plot.current?.getContext("2d") ?? null;
        const hist: number[] = [];
        let acc = 0, simT = 0, last = performance.now(), raf = 0, telT = 0, peak = 0, contacted = false;
        const dtFixed = 1 / 60;
        world.timestep = dtFixed;
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (play.current) {
            acc += dt;
            while (acc >= dtFixed) {
              world.step();
              simT += dtFixed;
              acc -= dtFixed;
              const t0 = bodies[0].rb.translation();
              hist.push(t0.y);
              if (hist.length > 360) hist.shift();
              const v0 = bodies[0].rb.linvel();
              if (t0.y < 0.4 && v0.y > 0) contacted = true;
              if (contacted && v0.y < 0 && t0.y > peak) peak = t0.y;
            }
          }
          bodies.forEach(({ rb, mesh }) => {
            const t = rb.translation(), r = rb.rotation();
            mesh.position.set(t.x, t.y, t.z);
            mesh.quaternion.set(r.x, r.y, r.z, r.w);
          });
          drawPlot(ctx, hist, h + 1);
          telT += dt;
          if (telT > 0.12) {
            telT = 0;
            const t0 = bodies[0].rb.translation(), v0 = bodies[0].rb.linvel();
            let maxV = 0, sleeping = 0;
            bodies.forEach((b) => {
              const v = b.rb.linvel();
              maxV = Math.max(maxV, Math.hypot(v.x, v.y, v.z));
              if (b.rb.isSleeping()) sleeping++;
            });
            onTelemetry({
              "Sim time (s)": Math.round(simT * 100) / 100,
              "Body 1 height (m)": Math.round(t0.y * 1000) / 1000,
              "Body 1 vertical v (m/s)": Math.round(v0.y * 100) / 100,
              "First rebound peak (m)": Math.round(peak * 1000) / 1000,
              "Max speed (m/s)": Math.round(maxV * 100) / 100,
              "Sleeping bodies": `${sleeping} / ${bodies.length}`,
            });
          }
          stage.render();
        };
        raf = requestAnimationFrame(tick);
        cleanup = () => {
          cancelAnimationFrame(raf);
          world.free();
          stage.dispose();
        };
      })
      .catch(() => setStatus("The physics engine failed to load. Check your network and reload."));
    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, sig, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-canvas" />
      {status && <div className="engine-loading">{status}</div>}
      <div className="inset inset-wide">
        <canvas ref={plot} width={260} height={110} />
        <span>Body 1 height, last 6 s</span>
      </div>
    </div>
  );
}

function drawPlot(ctx: CanvasRenderingContext2D | null, hist: number[], max: number) {
  if (!ctx) return;
  const W = 260, H = 110;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#182436";
  for (let f = 0.25; f < 1; f += 0.25) {
    ctx.beginPath();
    ctx.moveTo(0, H * f);
    ctx.lineTo(W, H * f);
    ctx.stroke();
  }
  ctx.strokeStyle = "#7cf3a0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  hist.forEach((y, i) => {
    const px = (i / 359) * W, py = H - (Math.max(0, y) / max) * H;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}
