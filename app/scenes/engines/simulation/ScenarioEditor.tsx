"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import type { EngineProps } from "../../types";

// Scenario editor (OpenSCENARIO-style): ego + adversary with parameterized triggers (cut-in distance, speed, lateral offset); the scenario runs closed-loop with a simple ACC ego and reports the outcome.
export default function ScenarioEditor({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-25, 20, 28], target: [25, 0, 0], grid: 0, fov: 45 }); if (!stage) return;
    const { scene, camera, controls } = stage;
    for (const z of [-3.5, 0, 3.5]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(500, 3.4), new THREE.MeshStandardMaterial({ color: 0x0b1320 })); r.rotation.x = -Math.PI / 2; r.position.set(200, 0, z); scene.add(r); }
    const car = (c: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 1.9), new THREE.MeshStandardMaterial({ color: c })); m.position.y = 0.75; scene.add(m); return m; };
    const ego = car(0xffb454), adv = car(0x5ee7ff), lead = car(0xb99cff);
    const lbl = (t: string, c: string) => { const l = makeLabel(t, c, 0.9); scene.add(l); return l; }; const le = lbl("ego · ACC", "#ffb454"), la = lbl("adversary", "#5ee7ff"), ll = lbl("lead", "#b99cff");
    const trig = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 11), new THREE.MeshBasicMaterial({ color: 0xff5d73, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); trig.rotation.x = -Math.PI / 2; trig.position.y = 0.02; scene.add(trig);
    let t = 0, ex = 0, ev = 0, ax = 0, az = 3.5, av = 0, lx = 0, minGap = 1e9, fired = false, collided = false, phase = "init", last = performance.now(), raf = 0, frames = 0;
    const reset = () => { const q = p.current; t = 0; ex = 0; ev = Number(q.egoSpeed); ax = ex + Number(q.advGap); az = 3.5; av = Number(q.advSpeed); lx = ex + 80; minGap = 1e9; fired = false; collided = false; phase = "approach"; };
    reset();
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current;
      if (play.current) {
        t += dt; const trigDist = Number(q.trigger);
        // adversary: lane change when ego within trigger distance
        if (!fired && ax - ex < trigDist) { fired = true; phase = "cut-in"; }
        if (fired && az > 0) az = Math.max(0, az - Number(q.lateralRate) * dt); if (fired && az === 0 && phase === "cut-in") phase = "settle";
        av += (Number(q.advSpeed) - av) * 0.5 * dt; ax += av * dt; lx += 12 * dt;
        // ego ACC: track the closest in-lane vehicle with time headway
        const inLane = az < 1.8 ? ax : lx; const gap = inLane - ex - 4.5; const desired = ev * Number(q.headway) + 4; const targetV = gap < desired ? Math.max(0, (az < 1.8 ? av : 12) - (desired - gap) * 0.6) : Number(q.egoSpeed);
        ev += Math.max(-Number(q.egoDecel), Math.min(2, (targetV - ev) * 1.2)) * dt; ev = Math.max(0, ev); ex += ev * dt;
        if (az < 1.8) minGap = Math.min(minGap, gap); if (gap <= 0 && az < 1.8) { collided = true; phase = "COLLISION"; }
        if (t > 18) reset();
      }
      ego.position.x = ex; adv.position.set(ax, 0.75, az); lead.position.set(lx, 0.75, 0); le.position.set(ex, 2.6, 0); la.position.set(ax, 2.6, az); ll.position.set(lx, 2.6, 0); trig.position.x = ex + Number(q.trigger);
      (adv.material as THREE.MeshStandardMaterial).color.set(collided ? 0xff5d73 : 0x5ee7ff);
      controls!.target.lerp(new THREE.Vector3(ex + 20, 0, 0), 0.08); camera.position.x += (ex - 20 - camera.position.x) * 0.08;
      stage.render();
      if ((frames++ & 7) === 0) onTelemetry({ "t (s)": t, Phase: phase, "Ego speed (m/s)": ev, "Adversary lateral (m)": az, "Min gap (m)": Number.isFinite(minGap) && minGap < 1e8 ? minGap : "—", Outcome: collided ? "collision" : fired ? "handled" : "pending" });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
