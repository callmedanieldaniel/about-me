"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { at, defaultLog, parseLog, type Log } from "../../kit/mcap";
import { Timeline } from "../../kit/Timeline";
import type { EngineProps } from "../../types";

// MCAP replay: 3D point cloud + ego trail from /tf, synchronized with a scrubber and topic list.
export default function McapReplay({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<Log | null>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    let alive = true;
    (asset ? parseLog(new Uint8Array(asset), "uploaded MCAP") : defaultLog()).then((l) => { if (alive) { setLog(l); tRef.current = 0; setT(0); } }).catch(() => { if (alive) defaultLog().then((l) => alive && setLog(l)); });
    return () => { alive = false; };
  }, [asset, resetKey]);

  useEffect(() => {
    const el = host.current; if (!el || !log) return;
    const stage = createStage(el, { position: [-30, 26, 30], target: [0, 0, 0], grid: 100, fov: 45 });
    if (!stage) return;
    const { scene, camera, controls } = stage;
    const cloudGeo = new THREE.BufferGeometry();
    const cap = 6000;
    cloudGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(cap * 3), 3));
    cloudGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(cap * 3), 3));
    const cloud = new THREE.Points(cloudGeo, new THREE.PointsMaterial({ size: 0.25, vertexColors: true, sizeAttenuation: true }));
    scene.add(cloud);
    const ego = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 1.9), new THREE.MeshStandardMaterial({ color: 0xffb454 })); ego.position.y = 0.75; scene.add(ego);
    const trailGeo = new THREE.BufferGeometry(); const trailPos = new Float32Array(3000 * 3); trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.7 })); scene.add(trail);
    const pose = log.topics.get("/tf/ego"), cloudT = log.topics.get("/lidar/points"), speedT = log.topics.get("/vehicle/speed"), stateT = log.topics.get("/planner/state");
    // pre-fill trail
    let tn = 0;
    if (pose) for (let i = 0; i < pose.msgs.length && tn < 3000; i += Math.max(1, Math.floor(pose.msgs.length / 3000))) { const m = pose.msgs[i]; trailPos.set([Number(m.x), 0.1, -Number(m.y)], tn * 3); tn++; }
    trailGeo.setDrawRange(0, tn);
    const cLow = new THREE.Color(0x27394f), cHigh = new THREE.Color(0x5ee7ff);
    let last = performance.now(), raf = 0, frames = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      if (play.current) { tRef.current += dt * Number(q.rate); if (tRef.current > log.duration) tRef.current = Boolean(q.loop) ? 0 : log.duration; }
      const tt = tRef.current;
      const pm = at(pose, tt);
      let ex = 0, ez = 0, yaw = 0;
      if (pm) { ex = Number(pm.x); ez = -Number(pm.y); yaw = Number(pm.yaw); ego.position.set(ex, 0.75, ez); ego.rotation.y = yaw; }
      const cm = at(cloudT, tt);
      const posA = cloudGeo.attributes.position.array as Float32Array, colA = cloudGeo.attributes.color.array as Float32Array;
      let n = 0;
      if (cm && Array.isArray(cm.points)) {
        const pts = cm.points as number[];
        const c = Math.cos(yaw), s = Math.sin(yaw);
        for (let i = 0; i + 2 < pts.length && n < cap; i += 3) {
          const lx = pts[i], ly = pts[i + 1], lz = pts[i + 2];
          posA[n * 3] = ex + c * lx - s * ly; posA[n * 3 + 1] = lz + 1.6; posA[n * 3 + 2] = ez - (s * lx + c * ly);
          const h = THREE.MathUtils.clamp((lz + 1.6) / 5, 0, 1);
          const col = cLow.clone().lerp(cHigh, h);
          colA[n * 3] = col.r; colA[n * 3 + 1] = col.g; colA[n * 3 + 2] = col.b;
          n++;
        }
      }
      cloudGeo.setDrawRange(0, n); cloudGeo.attributes.position.needsUpdate = true; cloudGeo.attributes.color.needsUpdate = true;
      if (Boolean(q.follow)) { controls!.target.lerp(new THREE.Vector3(ex, 0, ez), 0.1); const off = new THREE.Vector3(-26, 22, 26); camera.position.lerp(new THREE.Vector3(ex, 0, ez).add(off), 0.08); }
      stage.render();
      if ((frames++ & 5) === 0) { setT(tt); const sp = at(speedT, tt), st = at(stateT, tt); onTelemetry({ "t (s)": tt, "Points/frame": n, "Speed (m/s)": sp ? Number(sp.value) : 0, State: st ? String(st.state) : "—", Topics: log.topics.size, Messages: log.messages, "MCAP size (KB)": log.bytes / 1024 }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [log, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      {log && (
        <>
          <div className="topic-list">
            <b>{log.source}</b>
            {[...log.topics.values()].map((tp) => (
              <div key={tp.topic}>
                <span>{tp.topic}</span>
                <small>{tp.schema} · {tp.msgs.length}</small>
              </div>
            ))}
          </div>
          <Timeline t={t} duration={log.duration} onSeek={(v) => { tRef.current = v; setT(v); }} />
        </>
      )}
      {!log && <div className="engine-loading">Writing synthetic MCAP…</div>}
    </div>
  );
}
