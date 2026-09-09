"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { boxHelper, classColor, makeObjects, objectsAt, samplePoints } from "../../kit/pointcloud";
import type { EngineProps } from "../../types";

// Static-object lock: objects whose per-frame centroid barely moves are locked to a single world box across all frames (one label instead of N); moving ones keep per-frame boxes. Points are accumulated over frames for locked objects to densify them.
export default function StaticLock({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-18, 24, 28], target: [0, 0, 0], grid: 80, fov: 45 });
    if (!stage) return;
    const { scene } = stage;
    const base = makeObjects(31, 9); const FR = 30, DT = 0.1;
    const frames = Array.from({ length: FR }, (_, f) => objectsAt(base, f * DT));
    const clouds = frames.map((objs, f) => { const { pos } = samplePoints(objs, 200 + f, 3500); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.11, color: 0x3a4c66 })); pts.visible = false; scene.add(pts); return pts; });
    // accumulated cloud for static objects
    const accPos: number[] = []; frames.forEach((objs, f) => { const { pos, label } = samplePoints(objs, 200 + f, 10); for (let i = 0; i < label.length; i++) { const o = base.find((b) => b.id === label[i]); if (o && o.static) accPos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); } });
    const accGeo = new THREE.BufferGeometry(); accGeo.setAttribute("position", new THREE.Float32BufferAttribute(accPos, 3)); const acc = new THREE.Points(accGeo, new THREE.PointsMaterial({ size: 0.09, color: 0x7cf3a0 })); scene.add(acc);
    const groups = base.map((o) => { const g = boxHelper(o, classColor(o.cls)); scene.add(g); return g; });
    const labels = base.map(() => { const a = makeLabel("LOCKED", "#7cf3a0", 0.7), b = makeLabel("per-frame", "#ffb454", 0.7); scene.add(a, b); return [a, b] as const; });
    let f = 0, last = performance.now(), raf = 0, cnt = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const thr = Number(q.threshold);
      if (play.current) f = (f + dt * Number(q.rate) / DT) % FR;
      const fi = Math.floor(f); clouds.forEach((c, i) => (c.visible = i === fi)); acc.visible = Boolean(q.accumulate);
      let locked = 0, perFrame = 0;
      base.forEach((o, i) => {
        // decide lock from motion magnitude across the sequence
        const a = frames[0].find((x) => x.id === o.id)!, b = frames[FR - 1].find((x) => x.id === o.id)!; const moved = Math.hypot(b.x - a.x, b.z - a.z) / ((FR - 1) * DT);
        const lock = moved < thr; const cur = frames[fi].find((x) => x.id === o.id)!;
        const g = groups[i]; if (lock) { g.position.set(a.x, 0, a.z); locked++; } else { g.position.set(cur.x, 0, cur.z); perFrame++; } g.rotation.y = cur.yaw;
        const [la, lbp] = labels[i]; la.visible = lock; lbp.visible = !lock; la.position.set(g.position.x, o.h + 0.8, g.position.z); lbp.position.copy(la.position);
      });
      stage.render();
      if ((cnt++ & 7) === 0) onTelemetry({ Frame: `${fi + 1}/${FR}`, "Locked objects": locked, "Per-frame objects": perFrame, "Labels without lock": base.length * FR, "Labels with lock": locked + perFrame * FR, "Lock threshold (m/s)": thr });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
