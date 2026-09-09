"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { ARM_URDF, JOINTS, loadArm } from "../../kit/urdf";
import type { EngineProps } from "../../types";

// URDF inspector: a 6-DoF arm parsed from URDF by urdf-loader; joint sliders, per-joint axis arrows, limits and the TCP pose. Upload your own URDF (primitive geometry).
export default function UrdfInspector({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [1.3, 1.1, 1.3], target: [0, 0.45, 0], grid: 4, fov: 40 }); if (!stage) return;
    const { scene } = stage;
    let robot; try { robot = loadArm(scene, asset ? new TextDecoder().decode(asset) : ARM_URDF); setErr(""); } catch { setErr("Could not parse this URDF — showing the built-in arm."); robot = loadArm(scene); }
    const joints = Object.values(robot.joints).filter((j) => j.jointType !== "fixed");
    const axes = joints.map((j) => { const a = new THREE.ArrowHelper(new THREE.Vector3().copy(j.axis).normalize(), new THREE.Vector3(), 0.18, 0xffb454, 0.05, 0.03); j.add(a); const lb = makeLabel(j.name, "#ffb454", 0.5); lb.position.set(0.1, 0.1, 0); j.add(lb); return [a, lb] as const; });
    const tcp = robot.links["tcp"] ?? robot; const tcpAxes = new THREE.AxesHelper(0.15); tcp.add(tcpAxes);
    const world = new THREE.Vector3(); let t = 0, last = performance.now(), raf = 0, frames = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; if (play.current) t += dt;
      const vals: Record<string, number> = {};
      joints.forEach((j, i) => { const key = JOINTS[i] ?? j.name; const manual = Number(q[key] ?? 0); const v = Boolean(q.animate) ? manual + Math.sin(t * (0.6 + i * 0.2)) * 0.5 : manual; const lo = Number(j.limit.lower), hi = Number(j.limit.upper); vals[j.name] = Math.max(lo, Math.min(hi, v)); });
      robot.setJointValues(vals);
      axes.forEach(([a, lb]) => { a.visible = Boolean(q.axes); lb.visible = Boolean(q.axes); });
      robot.updateMatrixWorld(true); tcp.getWorldPosition(world);
      stage.render();
      if ((frames++ & 15) === 0) { const tel: Record<string, string | number> = { Joints: joints.length, Links: Object.keys(robot.links).length, "TCP x (m)": world.x, "TCP y (m)": world.y, "TCP z (m)": -world.z }; joints.forEach((j) => (tel[j.name] = `${(vals[j.name] * 57.3).toFixed(0)}° [${(Number(j.limit.lower) * 57.3).toFixed(0)}, ${(Number(j.limit.upper) * 57.3).toFixed(0)}]`)); onTelemetry(tel); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, asset, onTelemetry]);
  return (<div className="engine-host"><div ref={host} className="engine-fill" />{err && <div className="engine-note">{err}</div>}</div>);
}
