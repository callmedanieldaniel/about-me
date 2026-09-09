"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCity, actorMesh, egoMesh, makeActors, stepActors } from "../../kit/city";
import type { EngineProps } from "../../types";

// Six-camera surround view rendered from the same scene with scissor viewports, plus projected 3D boxes.
const CAMS = [
  { name: "FRONT", yaw: 0, fov: 70 },
  { name: "FRONT_LEFT", yaw: 55, fov: 70 },
  { name: "FRONT_RIGHT", yaw: -55, fov: 70 },
  { name: "BACK_LEFT", yaw: 110, fov: 70 },
  { name: "BACK", yaw: 180, fov: 110 },
  { name: "BACK_RIGHT", yaw: -110, fov: 70 },
];

export default function Surround({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;

  useEffect(() => {
    const el = host.current, ov = overlay.current; if (!el || !ov) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setScissorTest(true);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b12, 0.02);
    scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a1020, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 12, 6); scene.add(key);
    buildCity(scene, 4);
    const actors = makeActors(12, 9);
    const meshes = actors.map((a) => { const m = actorMesh(a); scene.add(m); return m; });
    const ego = egoMesh(); scene.add(ego);
    const cams = CAMS.map((c) => { const cam = new THREE.PerspectiveCamera(c.fov, 1.6, 0.3, 200); return cam; });
    let egoX = -30, last = performance.now(), raf = 0, t = 0;
    const size = () => ({ w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) });
    const resize = () => { const { w, h } = size(); renderer.setSize(w, h, false); ov.width = w * 2; ov.height = h * 2; ov.style.width = w + "px"; ov.style.height = h + "px"; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    const v = new THREE.Vector3();

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current;
      if (play.current) { t += dt; egoX += Number(q.egoSpeed) * dt; if (egoX > 50) egoX = -50; stepActors(actors, dt); }
      ego.position.set(egoX, 0, -3.5);
      meshes.forEach((m, i) => { m.position.set(actors[i].x, 0, actors[i].z); m.rotation.y = actors[i].yaw; });
      const { w, h } = size();
      const cols = 3, rows = 2, cw = w / cols, ch = h / rows;
      const ctx = ov.getContext("2d")!; ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, w, h);
      let boxesDrawn = 0;
      const mount = Number(q.mount);
      cams.forEach((cam, i) => {
        const c = CAMS[i];
        cam.fov = c.fov * Number(q.fovScale); cam.aspect = cw / ch; cam.updateProjectionMatrix();
        cam.position.set(egoX, 1.6, -3.5);
        const yaw = THREE.MathUtils.degToRad(c.yaw);
        cam.rotation.set(0, yaw, 0);
        cam.position.x += Math.cos(yaw) * mount; cam.position.z -= Math.sin(yaw) * mount;
        const vx = (i % cols) * cw, vy = h - (Math.floor(i / cols) + 1) * ch;
        renderer.setViewport(vx, vy, cw, ch); renderer.setScissor(vx, vy, cw, ch);
        renderer.render(scene, cam);
        // overlay: label + projected boxes
        const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
        ctx.strokeStyle = "rgba(94,231,255,0.35)"; ctx.strokeRect(ox + 0.5, oy + 0.5, cw - 1, ch - 1);
        ctx.fillStyle = "#e6eef8"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`CAM_${c.name}`, ox + 8, oy + 16);
        if (!q.boxes) return;
        for (const a of actors) {
          const corners: THREE.Vector3[] = [];
          for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) corners.push(new THREE.Vector3(a.x + (sx * a.l) / 2, sy * a.h, a.z + (sz * a.w) / 2));
          let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, behind = 0;
          for (const cn of corners) {
            v.copy(cn).applyMatrix4(cam.matrixWorldInverse);
            if (v.z > -0.5) behind++;
            v.applyMatrix4(cam.projectionMatrix);
            const sx = ox + ((v.x + 1) / 2) * cw, sy = oy + ((1 - v.y) / 2) * ch;
            minx = Math.min(minx, sx); maxx = Math.max(maxx, sx); miny = Math.min(miny, sy); maxy = Math.max(maxy, sy);
          }
          if (behind > 0 || maxx < ox || minx > ox + cw || maxy < oy || miny > oy + ch) continue;
          const d = Math.hypot(a.x - egoX, a.z + 3.5);
          if (d > Number(q.range)) continue;
          ctx.strokeStyle = a.kind === "ped" ? "#ff5d73" : "#7cf3a0"; ctx.lineWidth = 1.2;
          ctx.strokeRect(Math.max(ox, minx), Math.max(oy, miny), Math.min(ox + cw, maxx) - Math.max(ox, minx), Math.min(oy + ch, maxy) - Math.max(oy, miny));
          ctx.fillStyle = ctx.strokeStyle; ctx.fillText(`${a.kind} ${d.toFixed(0)}m`, Math.max(ox, minx) + 2, Math.max(oy, miny) - 3);
          boxesDrawn++;
        }
      });
      if ((raf & 7) === 0) onTelemetry({ Cameras: 6, "Boxes projected": boxesDrawn, "Ego x (m)": egoX, "t (s)": t });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [resetKey, onTelemetry]);

  return (
    <div ref={host} className="engine-host">
      <canvas ref={overlay} className="engine-overlay" />
    </div>
  );
}
