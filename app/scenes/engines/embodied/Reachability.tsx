"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { JOINTS, loadArm } from "../../kit/urdf";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Reachability cloud: sample joint configurations within limits, forward-kinematics the TCP through the URDF, and accumulate a colored point cloud (color = manipulability proxy: distance from joint limits).
export default function Reachability({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [1.6, 1.3, 1.6], target: [0, 0.4, 0], grid: 4, fov: 40 }); if (!stage) return;
    const { scene } = stage; const robot = loadArm(scene); const tcp = robot.links["tcp"];
    const joints = JOINTS.map((n) => robot.joints[n]);
    const cap = 40000; const geo = new THREE.BufferGeometry(); const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.012, vertexColors: true, transparent: true, opacity: 0.85 })); scene.add(pts);
    const rng = mulberry32(3); const w = new THREE.Vector3(); const cLow = new THREE.Color(0xff5d73), cHigh = new THREE.Color(0x5ee7ff);
    let n = 0, raf = 0, frames = 0, minY = 1e9, maxY = -1e9, maxR = 0;
    const frame = () => {
      const q = p.current; const per = Number(q.rate); const lock = Boolean(q.lockWrist);
      if (play.current && n < cap) for (let k = 0; k < per && n < cap; k++) {
        const vals: Record<string, number> = {}; let margin = 1;
        joints.forEach((j, i) => { const lo = Number(j.limit.lower), hi = Number(j.limit.upper); const v = lock && i > 2 ? 0 : lo + rng() * (hi - lo); vals[j.name] = v; margin = Math.min(margin, Math.min(v - lo, hi - v) / (hi - lo)); });
        robot.setJointValues(vals); robot.updateMatrixWorld(true); tcp.getWorldPosition(w);
        if (w.y < Number(q.floor)) continue;
        pos[n * 3] = w.x; pos[n * 3 + 1] = w.y; pos[n * 3 + 2] = w.z; const c = cLow.clone().lerp(cHigh, Math.min(1, margin * 2.5)); col[n * 3] = c.r; col[n * 3 + 1] = c.g; col[n * 3 + 2] = c.b; n++;
        minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y); maxR = Math.max(maxR, Math.hypot(w.x, w.z));
      }
      geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      robot.visible = Boolean(q.showArm);
      stage.render();
      if ((frames++ & 15) === 0) onTelemetry({ Samples: n, "Max reach (m)": maxR, "Height range (m)": n ? `${minY.toFixed(2)} – ${maxY.toFixed(2)}` : "—", "Wrist locked": lock ? "yes" : "no", "DoF sampled": lock ? 3 : 6 });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
