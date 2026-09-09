"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { createStage } from "../../stage";
import { boxHelper, classColor, makeObjects, samplePoints, iou3d, type GtObj } from "../../kit/pointcloud";
import type { EngineProps } from "../../types";

// 3D cuboid annotation: click a point to add a box, gizmo to move/rotate/scale (G/R/S), Delete removes, ortho insets show top/front/side of the selection.
type Box = { id: number; cls: GtObj["cls"]; group: THREE.Group; l: number; w: number; h: number };

export default function CuboidTool({ params, resetKey, command, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const boxesRef = useRef<Box[]>([]); boxesRef.current = boxes;
  const selRef = useRef<number | null>(null); selRef.current = selected;
  const p = useRef(params); p.current = params;
  const lastCmd = useRef(0);
  const api = useRef<{ add: (pt: THREE.Vector3) => void; remove: () => void; setMode: (m: "translate" | "rotate" | "scale") => void } | null>(null);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [-14, 22, 26], target: [0, 0, 0], grid: 80, fov: 45 });
    if (!stage) return;
    const { scene, camera, renderer, controls } = stage;
    renderer.setScissorTest(true);
    const gt = makeObjects(4, 8);
    const { pos, label } = samplePoints(gt, 1);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const col = new Float32Array(pos.length); for (let i = 0; i < label.length; i++) { const h = THREE.MathUtils.clamp(pos[i * 3 + 1] / 2, 0, 1); col[i * 3] = 0.15 + h * 0.2; col[i * 3 + 1] = 0.25 + h * 0.6; col[i * 3 + 2] = 0.35 + h * 0.65; }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true }));
    scene.add(cloud);
    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.setSize(0.8);
    scene.add(gizmo.getHelper());
    gizmo.addEventListener("dragging-changed", (e) => { controls!.enabled = !e.value; });
    const ray = new THREE.Raycaster(); ray.params.Points!.threshold = 0.35;
    let nextId = 1;
    const dims = (cls: GtObj["cls"]) => (cls === "car" ? [4.5, 1.9, 1.5] : cls === "pedestrian" ? [0.7, 0.7, 1.75] : [1.8, 0.7, 1.7]);
    const add = (pt: THREE.Vector3) => {
      const cls = String(p.current.cls) as GtObj["cls"]; const [l, w, h] = dims(cls);
      const group = boxHelper({ l, w, h }, classColor(cls)); group.position.set(pt.x, 0, pt.z); scene.add(group);
      const b: Box = { id: nextId++, cls, group, l, w, h };
      setBoxes((bs) => [...bs, b]); setSelected(b.id); gizmo.attach(group);
    };
    const remove = () => { const id = selRef.current; if (id === null) return; const b = boxesRef.current.find((x) => x.id === id); if (b) { scene.remove(b.group); gizmo.detach(); } setBoxes((bs) => bs.filter((x) => x.id !== id)); setSelected(null); };
    api.current = { add, remove, setMode: (m) => gizmo.setMode(m) };
    const onClick = (e: MouseEvent) => {
      if (gizmo.dragging) return;
      const r = renderer.domElement.getBoundingClientRect(); const mx = ((e.clientX - r.left) / r.width) * 2 - 1, my = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(new THREE.Vector2(mx, my), camera);
      // select existing box first
      const hitBox = boxesRef.current.find((b) => ray.intersectObject(b.group, true).length > 0);
      if (hitBox) { setSelected(hitBox.id); gizmo.attach(hitBox.group); return; }
      const hits = ray.intersectObject(cloud); if (hits.length && e.shiftKey === false) { add(hits[0].point); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement) return; if (e.key === "g") gizmo.setMode("translate"); if (e.key === "e") gizmo.setMode("rotate"); if (e.key === "s") gizmo.setMode("scale"); if (e.key === "Delete" || e.key === "Backspace") remove(); if (e.key === "Escape") { gizmo.detach(); setSelected(null); } };
    renderer.domElement.addEventListener("click", onClick); window.addEventListener("keydown", onKey);
    // ortho insets
    const top = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100), front = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100), side = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 100);
    let raf = 0, frames = 0;
    const frame = () => {
      const { w, h } = stage.size();
      renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); controls!.update(); renderer.render(scene, camera);
      const sel = boxesRef.current.find((b) => b.id === selRef.current);
      if (sel && Boolean(p.current.insets)) {
        const iw = Math.min(180, w / 4), ih = iw;
        const c = sel.group.position;
        top.position.set(c.x, 20, c.z); top.lookAt(c.x, 0, c.z); top.rotation.z = -sel.group.rotation.y;
        front.position.copy(c).add(new THREE.Vector3(Math.cos(sel.group.rotation.y) * 20, sel.h / 2, -Math.sin(sel.group.rotation.y) * 20)); front.lookAt(c.x, sel.h / 2, c.z);
        side.position.copy(c).add(new THREE.Vector3(Math.sin(sel.group.rotation.y) * 20, sel.h / 2, Math.cos(sel.group.rotation.y) * 20)); side.lookAt(c.x, sel.h / 2, c.z);
        [top, front, side].forEach((cam, i) => { cam.left = -4; cam.right = 4; cam.top = 4; cam.bottom = -4; cam.updateProjectionMatrix(); const x = w - (iw + 8) * (3 - i); renderer.setViewport(x, 8, iw, ih); renderer.setScissor(x, 8, iw, ih); renderer.render(scene, cam); });
      }
      if ((frames++ & 15) === 0) {
        // score against GT
        let matched = 0, iouSum = 0;
        for (const b of boxesRef.current) { let best = 0; for (const g of gt) best = Math.max(best, iou3d({ x: b.group.position.x, z: b.group.position.z, l: b.l * b.group.scale.x, w: b.w * b.group.scale.z, h: b.h * b.group.scale.y }, g)); if (best > 0.3) matched++; iouSum += best; }
        onTelemetry({ Boxes: boxesRef.current.length, "GT objects": gt.length, "Matched (IoU>0.3)": matched, "Mean best IoU": boxesRef.current.length ? iouSum / boxesRef.current.length : 0, Selected: selRef.current ?? "—", Mode: gizmo.mode });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); renderer.domElement.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); gizmo.dispose(); stage.dispose(); setBoxes([]); setSelected(null); };
  }, [resetKey, onTelemetry]);

  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "remove") api.current?.remove(); if (command.name === "mode_t") api.current?.setMode("translate"); if (command.name === "mode_r") api.current?.setMode("rotate"); if (command.name === "mode_s") api.current?.setMode("scale"); }, [command]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-fill" />
      <div className="annot-list">
        <b>Labels ({boxes.length})</b>
        {boxes.map((b) => (
          <div key={b.id} className={b.id === selected ? "on" : ""} onClick={() => setSelected(b.id)}>
            <i style={{ background: `#${classColor(b.cls).toString(16).padStart(6, "0")}` }} /> #{b.id} {b.cls}
          </div>
        ))}
        {!boxes.length && <small>Click a point to place a box</small>}
      </div>
    </div>
  );
}
