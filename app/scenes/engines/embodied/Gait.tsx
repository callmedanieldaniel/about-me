"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, palette } from "../../stage";
import type { EngineProps } from "../../types";

const D = Math.PI / 180;
// segment lengths (m) and mass fractions
const SEG = { thigh: 0.45, shank: 0.43, foot: 0.22, torso: 0.55, head: 0.24, upper: 0.3, fore: 0.27, hipW: 0.18, shW: 0.2 };
const MASS = { pelvis: 0.14, torso: 0.36, head: 0.08, thigh: 0.1, shank: 0.047, foot: 0.015, upper: 0.028, fore: 0.022 };

export default function Gait({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLCanvasElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [3.2, 1.8, 3.6], target: [0, 0.9, 0], grid: 40, fov: 40 });
    if (!stage) return;
    const { scene, camera, controls } = stage;

    const boneMat = new THREE.MeshStandardMaterial({ color: palette.live, emissive: 0x0a3340, roughness: 0.4 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xe6eef8, roughness: 0.3, metalness: 0.5 });
    const bone = (len: number, r = 0.035) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, len, 12), boneMat);
      m.geometry.translate(0, -len / 2, 0); // pivot at top
      return m;
    };
    const joint = (r = 0.05) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), jointMat);

    // Hierarchy
    const root = new THREE.Group();
    scene.add(root);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(SEG.hipW * 2, 0.12, 0.14), boneMat);
    root.add(pelvis);
    const torso = new THREE.Group();
    root.add(torso);
    const torsoMesh = bone(SEG.torso, 0.06);
    torsoMesh.rotation.x = Math.PI; // point up
    torso.add(torsoMesh);
    const head = joint(0.11);
    head.position.y = SEG.torso + SEG.head / 2;
    torso.add(head);

    const makeLeg = (side: number) => {
      const hip = new THREE.Group();
      hip.position.set(side * SEG.hipW, 0, 0);
      root.add(hip);
      hip.add(joint(0.06), bone(SEG.thigh, 0.045));
      const knee = new THREE.Group();
      knee.position.y = -SEG.thigh;
      hip.add(knee);
      knee.add(joint(0.05), bone(SEG.shank, 0.038));
      const ankle = new THREE.Group();
      ankle.position.y = -SEG.shank;
      knee.add(ankle);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, SEG.foot), boneMat);
      foot.position.set(0, -0.03, SEG.foot / 2 - 0.05);
      ankle.add(joint(0.04), foot);
      return { hip, knee, ankle };
    };
    const makeArm = (side: number) => {
      const sh = new THREE.Group();
      sh.position.set(side * SEG.shW, SEG.torso, 0);
      torso.add(sh);
      sh.add(joint(0.05), bone(SEG.upper, 0.032));
      const elb = new THREE.Group();
      elb.position.y = -SEG.upper;
      sh.add(elb);
      elb.add(joint(0.04), bone(SEG.fore, 0.028));
      return { sh, elb };
    };
    const L = makeLeg(-1), R = makeLeg(1);
    const AL = makeArm(-1), AR = makeArm(1);

    const com = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: palette.ok }));
    const comGround = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.06, 24), new THREE.MeshBasicMaterial({ color: palette.ok, side: THREE.DoubleSide }));
    comGround.rotation.x = -Math.PI / 2;
    scene.add(com, comGround);
    const supportL = new THREE.Mesh(new THREE.PlaneGeometry(0.12, SEG.foot + 0.04), new THREE.MeshBasicMaterial({ color: palette.ref, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    supportL.rotation.x = -Math.PI / 2;
    const supportR = supportL.clone();
    scene.add(supportL, supportR);

    const traceMax = 600;
    const tPos = new Float32Array(traceMax * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
    tGeo.setDrawRange(0, 0);
    const trace = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: palette.ok, transparent: true, opacity: 0.7 }));
    scene.add(trace);
    let traceN = 0;

    const ctx = plot.current?.getContext("2d") ?? null;
    const hist: { hip: number; knee: number }[] = [];

    let t = 0, z = 0, phase = 0;
    let last = performance.now();
    let raf = 0;
    let telT = 0;
    const world = new THREE.Vector3();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const q = p.current;
      const cadence = Number(q.cadence);
      const stride = Number(q.stride);
      const kneeAmp = Number(q.kneeAmp);
      const armSwing = Number(q.armSwing);
      const speed = (stride * cadence) / 60;
      if (play.current) {
        t += dt;
        phase += ((cadence / 60) * Math.PI) * dt; // one step = π
        z += speed * dt;
      }
      // Joint templates
      const hipAmp = Math.min(35, 12 + stride * 22);
      const legAngles = (ph: number) => {
        const s = Math.sin(ph);
        const hip = hipAmp * s - 6;
        const swing = Math.max(0, Math.sin(ph - 0.35));
        const knee = 8 + kneeAmp * swing * swing;
        const ankle = -8 * Math.sin(ph + 0.6);
        return { hip, knee, ankle };
      };
      const l = legAngles(phase), r = legAngles(phase + Math.PI);
      L.hip.rotation.x = l.hip * D;
      L.knee.rotation.x = -l.knee * D;
      L.ankle.rotation.x = (l.ankle + l.knee - l.hip) * D;
      R.hip.rotation.x = r.hip * D;
      R.knee.rotation.x = -r.knee * D;
      R.ankle.rotation.x = (r.ankle + r.knee - r.hip) * D;
      AL.sh.rotation.x = -armSwing * Math.sin(phase + Math.PI) * D * 0.9;
      AL.elb.rotation.x = (18 + armSwing * 0.6 * Math.max(0, Math.sin(phase + Math.PI))) * D;
      AR.sh.rotation.x = -armSwing * Math.sin(phase) * D * 0.9;
      AR.elb.rotation.x = (18 + armSwing * 0.6 * Math.max(0, Math.sin(phase))) * D;
      const bob = 0.025 * Math.cos(2 * phase);
      const pelvisH = SEG.thigh + SEG.shank + 0.06 - 0.03 * (hipAmp / 35);
      root.position.set(0, pelvisH + bob, z);
      root.rotation.y = 0.06 * Math.sin(phase);
      root.rotation.z = -0.04 * Math.sin(phase);
      torso.rotation.x = 4 * D;

      // Center of mass
      const acc = new THREE.Vector3();
      let mass = 0;
      const add = (obj: THREE.Object3D, m: number, offY: number) => {
        obj.getWorldPosition(world);
        world.y += offY;
        acc.addScaledVector(world, m);
        mass += m;
      };
      add(pelvis, MASS.pelvis, 0);
      add(torsoMesh, MASS.torso, SEG.torso / 2);
      add(head, MASS.head, 0);
      [L, R].forEach((leg) => {
        add(leg.hip, MASS.thigh, -SEG.thigh / 2);
        add(leg.knee, MASS.shank, -SEG.shank / 2);
        add(leg.ankle, MASS.foot, -0.03);
      });
      [AL, AR].forEach((arm) => {
        add(arm.sh, MASS.upper, -SEG.upper / 2);
        add(arm.elb, MASS.fore, -SEG.fore / 2);
      });
      acc.divideScalar(mass);
      com.position.copy(acc);
      comGround.position.set(acc.x, 0.005, acc.z);
      // Support feet
      const leftStance = Math.sin(phase) < 0.15;
      const rightStance = Math.sin(phase + Math.PI) < 0.15;
      L.ankle.getWorldPosition(world);
      supportL.position.set(world.x, 0.004, world.z + 0.05);
      supportL.visible = leftStance;
      R.ankle.getWorldPosition(world);
      supportR.position.set(world.x, 0.004, world.z + 0.05);
      supportR.visible = rightStance;
      // trace CoM
      if (Boolean(q.trace) && play.current) {
        if (traceN < traceMax) {
          tPos.set([acc.x, acc.y, acc.z], traceN * 3);
          traceN++;
        } else {
          tPos.copyWithin(0, 3);
          tPos.set([acc.x, acc.y, acc.z], (traceMax - 1) * 3);
        }
        tGeo.setDrawRange(0, traceN);
        tGeo.attributes.position.needsUpdate = true;
      }
      trace.visible = Boolean(q.trace);
      if (controls) {
        controls.target.set(0, 0.9, z);
        camera.position.z += (z + 3.6 - camera.position.z) * 0.2;
      }
      if (play.current) {
        hist.push({ hip: l.hip, knee: l.knee });
        if (hist.length > 220) hist.shift();
      }
      drawPlot(ctx, hist);
      telT += dt;
      if (telT > 0.12) {
        telT = 0;
        onTelemetry({
          "Walking speed (m/s)": Math.round(speed * 100) / 100,
          "Speed (km/h)": Math.round(speed * 36) / 10,
          "Gait phase": `${Math.round((((phase / (2 * Math.PI)) % 1) + 1) % 1 * 100)}%`,
          "Support": leftStance && rightStance ? "double" : leftStance ? "left" : "right",
          "CoM height (m)": Math.round(acc.y * 1000) / 1000,
          "Left knee (°)": Math.round(l.knee),
          "Distance (m)": Math.round(z * 10) / 10,
        });
      }
      stage.render();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stage.dispose();
    };
  }, [resetKey, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-canvas" />
      <div className="inset inset-wide">
        <canvas ref={plot} width={260} height={110} />
        <span>Left hip (cyan) and knee (green) angle</span>
      </div>
    </div>
  );
}

function drawPlot(ctx: CanvasRenderingContext2D | null, hist: { hip: number; knee: number }[]) {
  if (!ctx) return;
  const W = 260, H = 110;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#182436";
  [0.25, 0.5, 0.75].forEach((f) => {
    ctx.beginPath();
    ctx.moveTo(0, H * f);
    ctx.lineTo(W, H * f);
    ctx.stroke();
  });
  const line = (key: "hip" | "knee", color: string, min: number, max: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hist.forEach((h, i) => {
      const x = (i / 219) * W;
      const y = H - ((h[key] - min) / (max - min)) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };
  line("hip", "#5ee7ff", -45, 45);
  line("knee", "#7cf3a0", -5, 95);
}
