"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { boxHelper, classColor, makeObjects, objectsAt, samplePoints, iou3d } from "../../kit/pointcloud";
import { Timeline } from "../../kit/Timeline";
import type { EngineProps } from "../../types";

// Keyframe propagation: boxes are labeled at keyframes only; intermediate frames are interpolated (linear pose, yaw slerp) and scored against GT.
const FRAMES = 40, DT = 0.1;

export default function Tracking({ params, playing, resetKey, command, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const fRef = useRef(0);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  const lastCmd = useRef(0);
  const keyframes = useRef<Set<number>>(new Set([0, 39]));

  useEffect(() => { keyframes.current = new Set([0, FRAMES - 1]); fRef.current = 0; }, [resetKey]);
  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "addKey") keyframes.current.add(Math.round(fRef.current)); if (command.name === "clearKeys") keyframes.current = new Set([0, FRAMES - 1]); }, [command]);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-18, 24, 28], target: [0, 0, 0], grid: 80, fov: 45 });
    if (!stage) return;
    const { scene } = stage;
    const base = makeObjects(12, 7);
    // GT per frame; add a curved motion to one car so linear interpolation visibly fails
    const gtFrames = Array.from({ length: FRAMES }, (_, f) => objectsAt(base, f * DT).map((o) => (o.id === 1 && !o.static ? { ...o, z: o.z + Math.sin(f * 0.25) * 2.5, yaw: o.yaw + Math.cos(f * 0.25) * 0.4 } : o)));
    const clouds = gtFrames.map((objs, f) => { const { pos } = samplePoints(objs, 100 + f, 4000); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.11, color: 0x3a4c66 })); pts.visible = false; scene.add(pts); return pts; });
    const groups = base.map((o) => { const g = boxHelper(o, classColor(o.cls)); scene.add(g); const lb = makeLabel(`#${o.id}`, "#e6eef8", 0.7); lb.position.y = o.h + 0.6; g.add(lb); return g; });
    const trails = base.map(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(FRAMES * 3), 3)); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.6 })); scene.add(l); return l; });
    const lerpAngle = (a: number, b: number, t: number) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
    const interp = (id: number, f: number) => {
      const keys = [...keyframes.current].sort((a, b) => a - b);
      let k0 = keys[0], k1 = keys[keys.length - 1];
      for (const k of keys) { if (k <= f) k0 = k; } for (let i = keys.length - 1; i >= 0; i--) { if (keys[i] >= f) k1 = keys[i]; }
      const a = gtFrames[k0].find((o) => o.id === id)!, b = gtFrames[k1].find((o) => o.id === id)!;
      const t = k1 === k0 ? 0 : (f - k0) / (k1 - k0);
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: lerpAngle(a.yaw, b.yaw, t), l: a.l, w: a.w, h: a.h };
    };
    let last = performance.now(), raf = 0, frames = 0, acc = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (play.current) { acc += dt * Number(p.current.rate); fRef.current = (fRef.current + acc / DT) % FRAMES; acc = 0; }
      const f = fRef.current; const fi = Math.floor(f);
      clouds.forEach((c, i) => (c.visible = i === fi));
      let iouSum = 0;
      base.forEach((o, i) => {
        const est = interp(o.id, f); const g = groups[i]; g.position.set(est.x, 0, est.z); g.rotation.y = est.yaw;
        const gt = gtFrames[fi].find((x) => x.id === o.id)!; const iou = iou3d(est, gt); iouSum += iou;
        (g.children[1] as THREE.LineSegments).material = new THREE.LineBasicMaterial({ color: iou > 0.5 ? classColor(o.cls) : 0xff5d73 });
        if (Boolean(p.current.trails)) { const arr = trails[i].geometry.attributes.position.array as Float32Array; for (let k = 0; k < FRAMES; k++) { const e = interp(o.id, k); arr[k * 3] = e.x; arr[k * 3 + 1] = 0.05; arr[k * 3 + 2] = e.z; } trails[i].geometry.attributes.position.needsUpdate = true; trails[i].visible = true; } else trails[i].visible = false;
      });
      stage.render();
      if ((frames++ & 5) === 0) { setFrameIdx(fi); onTelemetry({ Frame: `${fi + 1}/${FRAMES}`, Keyframes: keyframes.current.size, "Labeled frames": keyframes.current.size, "Propagated frames": FRAMES - keyframes.current.size, "Mean IoU vs GT": iouSum / base.length, "Effort saved": `${((1 - keyframes.current.size / FRAMES) * 100).toFixed(0)}%` }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      <Timeline t={frameIdx} duration={FRAMES - 1} onSeek={(v) => { fRef.current = v; setFrameIdx(Math.floor(v)); }} marks={[...keyframes.current].map((k) => ({ t: k, color: "#ffb454", label: `keyframe ${k}` }))} />
    </div>
  );
}
