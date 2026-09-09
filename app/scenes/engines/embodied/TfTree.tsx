"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { JOINTS, loadArm } from "../../kit/urdf";
import type { EngineProps } from "../../types";

// TF & collision tree: the kinematic chain as a list, each link's collision shape drawn as a wireframe, frames as axes; click a link to isolate it.
export default function TfTree({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<{ name: string; depth: number; joint: string }[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const selRef = useRef<string | null>(null); selRef.current = sel;
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [1.3, 1.1, 1.3], target: [0, 0.45, 0], grid: 4, fov: 40 }); if (!stage) return;
    const { scene } = stage; const robot = loadArm(scene);
    // tree listing
    const rows: { name: string; depth: number; joint: string }[] = [];
    const walk = (link: THREE.Object3D, depth: number, joint: string) => { rows.push({ name: link.name, depth, joint }); link.children.forEach((c) => { const j = c as unknown as { isURDFJoint?: boolean; name: string }; if (j.isURDFJoint) c.children.forEach((l) => walk(l, depth + 1, j.name)); }); };
    walk(robot, 0, "—"); setLinks(rows);
    // collision wireframes + frames per link
    const frames: THREE.AxesHelper[] = []; const colls: THREE.Object3D[] = [];
    Object.values(robot.links).forEach((l) => { const ax = new THREE.AxesHelper(0.08); l.add(ax); frames.push(ax); l.traverse((o) => { const c = o as unknown as { isURDFCollider?: boolean }; if (c.isURDFCollider) { o.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.material = new THREE.MeshBasicMaterial({ color: 0x7cf3a0, wireframe: true, transparent: true, opacity: 0.5 }); mm.visible = true; } }); o.visible = true; colls.push(o); } }); });
    let t = 0, last = performance.now(), raf = 0, fr = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current) t += dt;
      const vals: Record<string, number> = {}; JOINTS.forEach((j, i) => (vals[j] = Math.sin(t * (0.5 + i * 0.17)) * 0.8)); robot.setJointValues(vals);
      frames.forEach((f) => (f.visible = Boolean(q.frames))); colls.forEach((c) => (c.visible = Boolean(q.collision)));
      Object.values(robot.links).forEach((l) => l.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(o.parent as unknown as { isURDFCollider?: boolean })?.isURDFCollider) { const mat = m.material as THREE.MeshStandardMaterial; if (mat.isMeshStandardMaterial) { mat.transparent = true; mat.opacity = selRef.current && selRef.current !== l.name ? 0.12 : 1; } } }));
      stage.render();
      if ((fr++ & 15) === 0) onTelemetry({ Links: Object.keys(robot.links).length, Joints: Object.keys(robot.joints).length, "Collision shapes": colls.length, Selected: selRef.current ?? "—", "Tree depth": Math.max(...rows.map((r) => r.depth)) });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      <div className="annot-list tree-list">
        <b>Kinematic tree</b>
        {links.map((l) => (<div key={l.name} className={sel === l.name ? "on" : ""} style={{ paddingLeft: 4 + l.depth * 12 }} onClick={() => setSel(sel === l.name ? null : l.name)}><i style={{ background: l.depth ? "#5ee7ff" : "#ffb454" }} />{l.name}<small> ← {l.joint}</small></div>))}
      </div>
    </div>
  );
}
