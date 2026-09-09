"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, makeLabel } from "../../stage";
import type { EngineProps } from "../../types";

// Counterfactual (Log Sim): replay the recorded log up to the disengagement, then let the stack keep driving with a reactive policy; compare against the recorded human takeover and check TTC/collision.
export default function Counterfactual({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-30, 22, 30], target: [20, 0, 0], grid: 0, fov: 45 });
    if (!stage) return;
    const { scene, camera, controls } = stage;
    for (const z of [-3.5, 3.5]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(400, 7), new THREE.MeshStandardMaterial({ color: 0x0b1320 })); r.rotation.x = -Math.PI / 2; r.position.set(150, 0, z); scene.add(r); }
    const mk = (color: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 1.9), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.9 })); m.position.y = 0.75; scene.add(m); return m; };
    const human = mk(0xffb454), sim = mk(0x5ee7ff), lead = mk(0xb99cff), ped = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8), new THREE.MeshStandardMaterial({ color: 0xff5d73 })); ped.position.y = 0.85; scene.add(ped);
    const lbl = (t: string, c: string, x: number) => { const l = makeLabel(t, c, 0.9); l.position.set(x, 3, 0); scene.add(l); return l; };
    const lH = lbl("recorded (human takeover)", "#ffb454", 0), lS = lbl("counterfactual (stack continues)", "#5ee7ff", 0);
    const disengage = new THREE.Mesh(new THREE.PlaneGeometry(1, 14), new THREE.MeshBasicMaterial({ color: 0xff5d73, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); disengage.rotation.x = -Math.PI / 2; disengage.position.set(60, 0.02, 0); scene.add(disengage);
    const trail = (color: number) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(600 * 3), 3)); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })); scene.add(l); return l; };
    const tH = trail(0xffb454), tS = trail(0x5ee7ff);
    let t = 0, last = performance.now(), raf = 0, frames = 0;
    let hx = 0, hv = 15, sx = 0, sv = 15, sz = -3.5, n = 0, collided = false, minTTC = Infinity, sBrakeStart = -1;
    const reset = () => { t = 0; hx = 0; hv = 15; sx = 0; sv = 15; sz = -3.5; n = 0; collided = false; minTTC = Infinity; sBrakeStart = -1; };
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const leadX0 = 95, pedStartT = Number(q.pedTime);
      if (play.current) {
        t += dt;
        // lead vehicle slows sharply at t=4s
        const leadV = t < 4 ? 15 : Math.max(0, 15 - (t - 4) * 6); const leadX = leadX0 + (t < 4 ? 15 * t : 15 * 4 + Math.max(0, 15 * (t - 4) - 3 * (t - 4) * (t - 4)));
        // pedestrian crossing from the right
        const pedZ = t > pedStartT ? 8 - (t - pedStartT) * 1.4 : 8; const pedX = 130;
        // human: recorded — disengaged at x=60, brakes hard + steers slightly left
        const hDis = hx >= 60; const hBrake = hDis ? 7 : 0; hv = Math.max(0, hv - hBrake * dt); hx += hv * dt;
        // sim: reactive policy after disengagement point (before it, follows the same recorded speed)
        if (sx < 60) { sv = hv > 0 ? 15 : sv; sx += sv * dt; }
        else {
          const gap = leadX - sx - 4.5, ttcLead = sv > leadV ? gap / (sv - leadV) : Infinity;
          const pedRisk = pedX - sx > 0 && pedX - sx < 60 && Math.abs(pedZ - sz) < 6 ? (pedX - sx) / Math.max(0.1, sv) : Infinity;
          const ttc = Math.min(ttcLead, pedRisk); minTTC = Math.min(minTTC, ttc);
          const react = Number(q.reaction); if (sBrakeStart < 0 && ttc < Number(q.ttcThreshold)) sBrakeStart = t;
          const braking = sBrakeStart >= 0 && t - sBrakeStart > react; const decel = braking ? Number(q.decel) : 0;
          if (Boolean(q.allowSwerve) && braking && ttc < 1.5 && sz > -6.5) sz -= 2 * dt;
          sv = Math.max(0, sv - decel * dt); sx += sv * dt;
          if (gap < 0 && Math.abs(sz + 3.5) < 1.5) collided = true; if (Math.abs(pedX - sx) < 2.5 && Math.abs(pedZ - sz) < 1.2) collided = true;
        }
        lead.position.set(leadX, 0.75, -3.5); ped.position.set(pedX, 0.85, pedZ);
        human.position.set(hx, 0.75, -3.5); sim.position.set(sx, 0.75, sz); lH.position.set(hx, 3, -3.5); lS.position.set(sx, 3.6, sz);
        if (n < 600) { (tH.geometry.attributes.position.array as Float32Array).set([hx, 0.1, -3.4], n * 3); (tS.geometry.attributes.position.array as Float32Array).set([sx, 0.15, sz], n * 3); n++; tH.geometry.setDrawRange(0, n); tS.geometry.setDrawRange(0, n); tH.geometry.attributes.position.needsUpdate = true; tS.geometry.attributes.position.needsUpdate = true; }
        if (t > 16) reset();
        controls!.target.lerp(new THREE.Vector3(sx + 10, 0, 0), 0.08); camera.position.x += (sx - 22 - camera.position.x) * 0.08;
      }
      (sim.material as THREE.MeshStandardMaterial).color.set(collided ? 0xff5d73 : 0x5ee7ff);
      stage.render();
      if ((frames++ & 7) === 0) onTelemetry({ "t (s)": t, Phase: sx < 60 ? "recorded" : "counterfactual", "Sim speed (m/s)": sv, "Human speed (m/s)": hv, "Min TTC (s)": Number.isFinite(minTTC) ? minTTC : "—", Outcome: collided ? "COLLISION" : sx >= 60 ? "clear so far" : "—", "Brake onset (s)": sBrakeStart >= 0 ? sBrakeStart : "—" });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
