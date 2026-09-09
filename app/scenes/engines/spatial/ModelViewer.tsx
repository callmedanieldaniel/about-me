"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createStage, palette } from "../../stage";
import type { EngineProps } from "../../types";

function isGlb(buf: ArrayBuffer) {
  if (buf.byteLength < 12) return false;
  const v = new DataView(buf);
  return v.getUint32(0, true) === 0x46546c67 && v.getUint32(4, true) === 2;
}

function placeholderVehicle() {
  const g = new THREE.Group();
  g.name = "placeholder-vehicle";
  const paint = new THREE.MeshStandardMaterial({ color: 0x24344c, roughness: 0.25, metalness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0b1524, roughness: 0.1, metalness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0a0f18, roughness: 0.8 });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.55, 1.95), paint);
  lower.name = "body_lower";
  lower.position.y = 0.55;
  const mid = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.5, 1.9), paint);
  mid.name = "body_mid";
  mid.position.y = 1.05;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1.7), glass);
  cabin.name = "cabin_glass";
  cabin.position.set(-0.2, 1.55, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.6), paint);
  roof.name = "roof";
  roof.position.set(-0.2, 1.86, 0);
  g.add(lower, mid, cabin, roof);
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 32);
  wheelGeo.rotateX(Math.PI / 2);
  [
    [1.5, 0.95],
    [1.5, -0.95],
    [-1.5, 0.95],
    [-1.5, -0.95],
  ].forEach(([x, z], i) => {
    const w = new THREE.Mesh(wheelGeo, dark);
    w.name = `wheel_${i}`;
    w.position.set(x, 0.38, z);
    g.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x8fa3c0, metalness: 0.9, roughness: 0.3 }));
    rim.geometry.rotateX(Math.PI / 2);
    rim.name = `rim_${i}`;
    rim.position.copy(w.position);
    g.add(rim);
  });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: palette.live, emissiveIntensity: 1.2 });
  [0.7, -0.7].forEach((z, i) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.4), lightMat);
    l.name = `headlight_${i}`;
    l.position.set(2.36, 0.9, z);
    g.add(l);
  });
  return g;
}

export default function ModelViewer({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;
  const [error, setError] = useState("");
  const [nodes, setNodes] = useState<string[]>([]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [6, 3.5, 7], target: [0, 0.9, 0], grid: 20 });
    if (!stage) return;
    const { scene, camera, controls } = stage;
    const key = new THREE.SpotLight(0xffffff, 60, 30, 0.6, 0.5);
    key.position.set(4, 8, 4);
    scene.add(key);
    const rim = new THREE.PointLight(palette.live, 20, 20);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const holder = new THREE.Group();
    scene.add(holder);
    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D;
    let originalPositions: { obj: THREE.Object3D; pos: THREE.Vector3; dir: THREE.Vector3 }[] = [];

    const fit = (obj: THREE.Object3D, isAsset: boolean) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 4 / maxDim;
      obj.scale.setScalar(scale);
      const box2 = new THREE.Box3().setFromObject(obj);
      const center = box2.getCenter(new THREE.Vector3());
      obj.position.sub(center);
      obj.position.y += (box2.max.y - box2.min.y) / 2;
      let meshes = 0;
      const names: string[] = [];
      originalPositions = [];
      const c = box2.getCenter(new THREE.Vector3());
      obj.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          meshes++;
          if (names.length < 80) names.push(o.name || "(unnamed mesh)");
          const wp = o.getWorldPosition(new THREE.Vector3());
          originalPositions.push({ obj: o, pos: o.position.clone(), dir: wp.sub(c).normalize() });
        }
      });
      setNodes(names);
      if (controls) controls.target.set(0, (box2.max.y - box2.min.y) / 2, 0);
      camera.position.set(6, 3.5, 7);
      onTelemetry({
        Source: isAsset ? "local .glb" : "placeholder",
        Meshes: meshes,
        "Original size (m)": `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`,
        "Display scale": Math.round(scale * 1000) / 1000,
        Animations: mixer ? "playing first clip" : "none",
      });
    };

    const loadAsset = async () => {
      setError("");
      if (asset && isGlb(asset)) {
        try {
          const gltf = await new GLTFLoader().parseAsync(asset.slice(0), "");
          model = gltf.scene;
          if (gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
          }
          holder.add(model);
          fit(model, true);
          return;
        } catch {
          setError("This GLB could not be parsed. Self-contained glTF 2.0 binaries without Draco/Meshopt compression are supported.");
        }
      } else if (asset) {
        setError("That file is not a glTF 2.0 binary (.glb).");
      }
      model = placeholderVehicle();
      holder.add(model);
      fit(model, false);
    };
    loadAsset();

    let last = performance.now(), raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const q = p.current;
      if (play.current && Boolean(q.turntable)) holder.rotation.y += dt * 0.35;
      if (play.current && mixer) mixer.update(dt);
      const wire = Boolean(q.wireframe);
      const explode = Number(q.exploded);
      holder.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            const mm = mat as THREE.MeshStandardMaterial;
            if ("wireframe" in mm) mm.wireframe = wire;
          });
        }
      });
      originalPositions.forEach(({ obj, pos, dir }) => {
        const parentScale = obj.parent ? obj.parent.getWorldScale(new THREE.Vector3()).x || 1 : 1;
        obj.position.copy(pos).addScaledVector(dir, (explode * 1.6) / parentScale);
      });
      stage.render();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stage.dispose();
    };
  }, [resetKey, asset, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-canvas" />
      {error && <div className="engine-error">{error}</div>}
      {nodes.length > 0 && (
        <details className="inset inset-list">
          <summary>Mesh nodes ({nodes.length})</summary>
          <ul>
            {nodes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
