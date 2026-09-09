"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import { SAMPLE_XODR, parseOpenDrive } from "../../kit/opendrive";
import type { EngineProps } from "../../types";

// Parses OpenDRIVE (sample or uploaded .xodr) and renders lane surfaces, markings and reference lines in 3D.
export default function OpenDriveView({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    let net;
    try { net = parseOpenDrive(asset ? new TextDecoder().decode(asset) : SAMPLE_XODR); if (!net.lanes.length) throw new Error("no lanes"); setErr(""); } catch { setErr("Could not parse this OpenDRIVE file — showing the sample network."); net = parseOpenDrive(SAMPLE_XODR); }
    const [minx, miny, maxx, maxy] = net.bbox; const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, span = Math.max(maxx - minx, maxy - miny);
    const stage = createStage(el, { position: [cx - span * 0.5, span * 0.7, -cy + span * 0.5], target: [cx, 0, -cy], grid: 0, fov: 45 });
    if (!stage) return;
    const { scene } = stage;
    const colorOf: Record<string, number> = { driving: 0x13202f, sidewalk: 0x1f2a3a, shoulder: 0x0f1620 };
    const strip = (a: [number, number][], b: [number, number][], color: number, y = 0) => {
      const pos: number[] = []; const idx: number[] = [];
      for (let i = 0; i < a.length; i++) { pos.push(a[i][0], y, -a[i][1], b[i][0], y, -b[i][1]); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }));
    };
    const line = (pts: [number, number][], color: number, y = 0.03, dashed = false) => { const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, y, -z))); const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 2, gapSize: 2 }) : new THREE.LineBasicMaterial({ color }); const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l; };
    for (const l of net.lanes) { scene.add(strip(l.inner, l.outer, colorOf[l.type] ?? 0x162131)); scene.add(line(l.outer, l.type === "driving" ? 0x3a4c66 : 0x223247, 0.03, l.type === "driving" && Math.abs(l.id) === 1 ? false : true)); }
    const refLines: THREE.Line[] = [];
    for (const r of net.roads) { const rl = line(r.ref.map(([x, y]) => [x, y]), 0x5ee7ff, 0.05); refLines.push(rl); scene.add(rl); const [x, y] = r.ref[Math.floor(r.ref.length / 2)]; const lb = makeLabel(`road ${r.id}`, "#5ee7ff", 1.4); lb.position.set(x, 3, -y); scene.add(lb); }
    const centers: THREE.Line[] = [];
    for (const l of net.lanes.filter((x) => x.type === "driving")) { const c = line(l.center, 0x7cf3a0, 0.04, true); centers.push(c); scene.add(c); }
    // a vehicle driving along lane 1:-1 → successors
    const car = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 1.9), new THREE.MeshStandardMaterial({ color: 0xffb454 })); car.position.y = 0.7; scene.add(car);
    const drivable = net.lanes.filter((x) => x.type === "driving" && x.id < 0);
    let laneIdx = 0, s = 0, t = 0, last = performance.now(), raf = 0, frames = 0;
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      refLines.forEach((l) => (l.visible = Boolean(q.refLine))); centers.forEach((l) => (l.visible = Boolean(q.centers)));
      if (play.current && drivable.length) {
        t += dt; s += Number(q.speed) * dt;
        const lane = drivable[laneIdx % drivable.length];
        const n = lane.center.length - 1; const f = s / lane.length;
        if (f >= 1) { s = 0; const nxt = lane.succ.map((k) => drivable.findIndex((x) => x.key === k)).filter((i) => i >= 0); laneIdx = nxt.length ? nxt[0] : (laneIdx + 1) % drivable.length; }
        else { const i = Math.max(0, Math.min(n - 1, Math.floor(f * n))); const a = lane.center[i], b = lane.center[i + 1]; const k = f * n - i; car.position.set(a[0] + (b[0] - a[0]) * k, 0.7, -(a[1] + (b[1] - a[1]) * k)); car.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]); }
      }
      stage.render();
      if ((frames++ & 7) === 0) onTelemetry({ Roads: net.roads.length, Lanes: net.lanes.length, "Driving lanes": drivable.length * 2 - net.lanes.filter((x) => x.type === "driving" && x.id > 0).length, "Network extent (m)": span, "Current lane": drivable[laneIdx % drivable.length]?.key ?? "—", "s (m)": s, "t (s)": t });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, asset, onTelemetry]);
  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      {err && <div className="engine-note">{err}</div>}
    </div>
  );
}
