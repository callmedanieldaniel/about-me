"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { fleet, mine, rules } from "../../kit/fleet";
import { colors } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Triage workbench: event queue on the left, 3D replay of ±6 s around the event with the ego trail, speed HUD; keyboard j/k to move, 1-3 severity, decision buttons.
type Decision = { severity: number; verdict: "true_issue" | "false_positive" | "needs_data" };

export default function ReviewBench({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const hits = useRef(mine(fleet(), rules({ brake: 0.5, accel: 3, dropHz: 5, steerRate: 0.08 })).slice(0, 40));
  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const idxRef = useRef(0); idxRef.current = idx;
  const decRef = useRef(decisions); decRef.current = decisions;
  const play = useRef(playing); play.current = playing;
  const p = useRef(params); p.current = params;
  const t0 = useRef(performance.now());
  useEffect(() => { setDecisions({}); setIdx(0); }, [resetKey]);
  const decide = (verdict: Decision["verdict"], severity?: number) => { setDecisions((d) => ({ ...d, [idxRef.current]: { severity: severity ?? d[idxRef.current]?.severity ?? 2, verdict } })); setIdx((i) => Math.min(hits.current.length - 1, i + 1)); };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement) return; if (e.key === "j") setIdx((i) => Math.min(hits.current.length - 1, i + 1)); if (e.key === "k") setIdx((i) => Math.max(0, i - 1)); if (e.key === "1" || e.key === "2" || e.key === "3") setDecisions((d) => ({ ...d, [idxRef.current]: { verdict: d[idxRef.current]?.verdict ?? "true_issue", severity: Number(e.key) } })); if (e.key === "t") decide("true_issue"); if (e.key === "f") decide("false_positive"); if (e.key === "n") decide("needs_data"); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-20, 18, 22], target: [0, 0, 0], grid: 120, fov: 45 });
    if (!stage) return;
    const { scene, camera, controls } = stage;
    const ego = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 1.9), new THREE.MeshStandardMaterial({ color: 0xffb454 })); ego.position.y = 0.75; scene.add(ego);
    const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(130 * 3), 3)); const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x5ee7ff })); scene.add(trail);
    const marker = new THREE.Mesh(new THREE.RingGeometry(2.5, 3, 32), new THREE.MeshBasicMaterial({ color: 0xff5d73, side: THREE.DoubleSide })); marker.rotation.x = -Math.PI / 2; marker.position.y = 0.05; scene.add(marker);
    const lead = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 1.9), new THREE.MeshStandardMaterial({ color: 0x5ee7ff })); lead.position.y = 0.7; scene.add(lead);
    let raf = 0, frames = 0, local = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const h = hits.current[idxRef.current]; const d = fleet()[h.vehicle - 1];
      if (play.current) local = (local + dt) % 12;
      const t = h.t - 6 + local; const i = Math.max(0, Math.min(d.t.length - 1, Math.floor(t * 10)));
      const i0 = Math.max(0, Math.floor((h.t - 6) * 10));
      const sc = 100000; const toX = (k: number) => (d.lon[k] - h.lon) * sc, toZ = (k: number) => -(d.lat[k] - h.lat) * sc;
      const arr = trailGeo.attributes.position.array as Float32Array; let n = 0; for (let k = i0; k <= i0 + 120 && k < d.t.length; k++) { arr[n * 3] = toX(k); arr[n * 3 + 1] = 0.1; arr[n * 3 + 2] = toZ(k); n++; } trailGeo.setDrawRange(0, n); trailGeo.attributes.position.needsUpdate = true;
      ego.position.set(toX(i), 0.75, toZ(i)); const j = Math.min(d.t.length - 1, i + 2); ego.rotation.y = Math.atan2(-(toZ(j) - toZ(i)), toX(j) - toX(i));
      lead.position.set(toX(Math.min(d.t.length - 1, i + 15)), 0.7, toZ(Math.min(d.t.length - 1, i + 15))); lead.rotation.y = ego.rotation.y; lead.visible = h.kind === "hard_brake" || h.kind === "cut_in";
      marker.scale.setScalar(1 + Math.sin(now / 200) * 0.1);
      if (Boolean(p.current.follow)) { controls!.target.lerp(ego.position, 0.1); camera.position.lerp(ego.position.clone().add(new THREE.Vector3(-16, 12, 16)), 0.08); }
      stage.render();
      if ((frames++ & 7) === 0) { const done = Object.keys(decRef.current).length; onTelemetry({ Event: `${idxRef.current + 1}/${hits.current.length}`, Kind: h.kind, Vehicle: h.vehicle, "t (s)": t, "Speed (m/s)": d.speed[i], Reviewed: done, "Throughput (events/min)": done ? (done / ((performance.now() - t0.current) / 60000)).toFixed(1) : 0 }); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  const h = hits.current[idx]; const dec = decisions[idx];
  return (
    <div className="engine-host triage-host">
      <aside className="triage-queue">
        <b>Queue · {Object.keys(decisions).length}/{hits.current.length} reviewed</b>
        {hits.current.map((e, i) => (
          <div key={i} className={`${i === idx ? "on" : ""} ${decisions[i]?.verdict ?? ""}`} onClick={() => setIdx(i)}>
            <span>{String(i + 1).padStart(2, "0")}</span> {e.kind.replace("_", " ")} <small>v{e.vehicle} · {e.t.toFixed(0)}s</small>
            {decisions[i] && <i style={{ background: decisions[i].verdict === "true_issue" ? colors.bad : decisions[i].verdict === "false_positive" ? colors.muted : colors.ref }} />}
          </div>
        ))}
      </aside>
      <div className="triage-stage"><div ref={host} className="engine-fill" /></div>
      <div className="triage-actions">
        <span>#{idx + 1} {h.kind.replace("_", " ")} · severity {dec?.severity ?? "—"} · {dec?.verdict?.replace("_", " ") ?? "undecided"}</span>
        <div>
          {[1, 2, 3].map((s) => (<button key={s} type="button" className={dec?.severity === s ? "on" : ""} onClick={() => setDecisions((d) => ({ ...d, [idx]: { verdict: d[idx]?.verdict ?? "true_issue", severity: s } }))}>S{s}</button>))}
          <button type="button" className="t" onClick={() => decide("true_issue")}>True issue (t)</button>
          <button type="button" onClick={() => decide("false_positive")}>False positive (f)</button>
          <button type="button" onClick={() => decide("needs_data")}>Needs data (n)</button>
          <span className="hint">j / k move</span>
        </div>
      </div>
    </div>
  );
}
