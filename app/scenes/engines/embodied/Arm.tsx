"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, palette } from "../../stage";
import type { EngineProps } from "../../types";

const L1 = 2.4, L2 = 1.8;

function ik(x: number, y: number, elbowUp: boolean) {
  const r2 = x * x + y * y;
  const c2 = (r2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  if (c2 < -1 || c2 > 1) return null;
  const s2 = Math.sqrt(1 - c2 * c2) * (elbowUp ? 1 : -1);
  const th2 = Math.atan2(s2, c2);
  const th1 = Math.atan2(y, x) - Math.atan2(L2 * s2, L1 + L2 * c2);
  return { th1, th2 };
}

export default function Arm({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [4, 7, 12], target: [0, 2, 0], grid: 0 });
    if (!stage) return;
    const { scene } = stage;

    // Work plane (x right, y up) at z=0; base at origin
    const annulus = new THREE.Mesh(
      new THREE.RingGeometry(Math.abs(L1 - L2), L1 + L2, 96),
      new THREE.MeshBasicMaterial({ color: 0x1c2a3d, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    scene.add(annulus);
    const gridLines: number[] = [];
    for (let i = -5; i <= 5; i++) gridLines.push(i, -5, -0.01, i, 5, -0.01, -5, i, -0.01, 5, i, -0.01);
    const gg = new THREE.BufferGeometry();
    gg.setAttribute("position", new THREE.Float32BufferAttribute(gridLines, 3));
    scene.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x142033 })));

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x1c2a3d, metalness: 0.4 }));
    base.rotation.x = Math.PI / 2;
    base.position.z = -0.3;
    scene.add(base);
    const linkMat = new THREE.MeshStandardMaterial({ color: palette.live, emissive: 0x0a3340, roughness: 0.35, metalness: 0.4 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xe6eef8, metalness: 0.6, roughness: 0.3 });
    const link1 = new THREE.Mesh(new THREE.BoxGeometry(L1, 0.34, 0.34), linkMat);
    const link2 = new THREE.Mesh(new THREE.BoxGeometry(L2, 0.26, 0.26), linkMat);
    const j0 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), jointMat);
    const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), jointMat);
    const eff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), new THREE.MeshStandardMaterial({ color: palette.ok, emissive: 0x1b5533 }));
    const target = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 12, 40), new THREE.MeshBasicMaterial({ color: palette.ref }));
    scene.add(link1, link2, j0, j1, eff, target);

    const traceMax = 400;
    const tracePos = new Float32Array(traceMax * 3);
    const traceGeo = new THREE.BufferGeometry();
    traceGeo.setAttribute("position", new THREE.BufferAttribute(tracePos, 3));
    traceGeo.setDrawRange(0, 0);
    const trace = new THREE.Line(traceGeo, new THREE.LineBasicMaterial({ color: palette.ok, transparent: true, opacity: 0.6 }));
    scene.add(trace);
    let traceN = 0;

    let th1 = 0.6, th2 = 1.2;
    let last = performance.now();
    let raf = 0;
    let tT = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const q = p.current;
      const tx = Number(q.targetX), ty = Number(q.targetY);
      const sol = ik(tx, ty, Boolean(q.elbowUp));
      target.position.set(tx, ty, 0);
      (target.material as THREE.MeshBasicMaterial).color.set(sol ? palette.ref : palette.bad);
      if (play.current && sol) {
        const k = Math.min(1, dt * 6);
        th1 += wrap(sol.th1 - th1) * k;
        th2 += wrap(sol.th2 - th2) * k;
      }
      const ex = L1 * Math.cos(th1), ey = L1 * Math.sin(th1);
      const tipx = ex + L2 * Math.cos(th1 + th2), tipy = ey + L2 * Math.sin(th1 + th2);
      link1.position.set(ex / 2, ey / 2, 0);
      link1.rotation.z = th1;
      link2.position.set((ex + tipx) / 2, (ey + tipy) / 2, 0);
      link2.rotation.z = th1 + th2;
      j1.position.set(ex, ey, 0);
      eff.position.set(tipx, tipy, 0);
      if (Boolean(q.trace) && play.current) {
        if (traceN < traceMax) {
          tracePos.set([tipx, tipy, 0.02], traceN * 3);
          traceN++;
        } else {
          tracePos.copyWithin(0, 3);
          tracePos.set([tipx, tipy, 0.02], (traceMax - 1) * 3);
        }
        traceGeo.setDrawRange(0, traceN);
        traceGeo.attributes.position.needsUpdate = true;
      }
      trace.visible = Boolean(q.trace);
      tT += dt;
      if (tT > 0.12) {
        tT = 0;
        const err = Math.hypot(tipx - tx, tipy - ty);
        onTelemetry({
          "Shoulder θ1 (°)": Math.round(((th1 * 180) / Math.PI) * 10) / 10,
          "Elbow θ2 (°)": Math.round(((th2 * 180) / Math.PI) * 10) / 10,
          "End effector": `${tipx.toFixed(2)}, ${tipy.toFixed(2)}`,
          "Target error (m)": Math.round(err * 1000) / 1000,
          "Reach": sol ? "reachable" : "outside workspace",
          "Radius (m)": Math.round(Math.hypot(tx, ty) * 100) / 100,
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
    </div>
  );
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
