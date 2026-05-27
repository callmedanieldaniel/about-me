"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// DiDi AD toolchain — LiDAR point cloud playback + bounding boxes
// Mimics the browser scene viewer (RViz/Foxglove style).
export default function AdSceneDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x07080c, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 6, 12);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Ground grid
    scene.add(new THREE.GridHelper(40, 40, 0x223046, 0x141a26));

    // Ego vehicle box
    const egoGeo = new THREE.BoxGeometry(1.8, 1.4, 4.4);
    const egoMat = new THREE.MeshBasicMaterial({
      color: 0x79ffe1, transparent: true, opacity: 0.25,
    });
    const ego = new THREE.Mesh(egoGeo, egoMat);
    ego.position.y = 0.7;
    scene.add(ego);
    const egoEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(egoGeo),
      new THREE.LineBasicMaterial({ color: 0x79ffe1 })
    );
    egoEdges.position.copy(ego.position);
    scene.add(egoEdges);

    // LiDAR rings (simulated rotating sweep)
    const N = 8000;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const rings = 16;
    const perRing = Math.floor(N / rings);
    for (let r = 0; r < rings; r++) {
      const elev = -0.25 + (r / rings) * 0.35;
      for (let i = 0; i < perRing; i++) {
        const a = (i / perRing) * Math.PI * 2;
        const range = 6 + Math.random() * 12 - Math.abs(Math.sin(a * 2)) * 3;
        const idx = (r * perRing + i) * 3;
        positions[idx + 0] = Math.cos(a) * range;
        positions[idx + 1] = Math.tan(elev) * range + 0.05;
        positions[idx + 2] = Math.sin(a) * range;
        // color by distance — viridis-ish
        const t = Math.min(1, range / 18);
        const c = new THREE.Color().setHSL(0.6 - t * 0.4, 0.7, 0.5 + t * 0.1);
        colors[idx + 0] = c.r;
        colors[idx + 1] = c.g;
        colors[idx + 2] = c.b;
      }
    }
    const pcGeo = new THREE.BufferGeometry();
    pcGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pcGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pcMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const pc = new THREE.Points(pcGeo, pcMat);
    scene.add(pc);

    // Detected objects (3D bounding boxes)
    type Obj = { mesh: THREE.Mesh; edges: THREE.LineSegments; label: string; vx: number; vz: number };
    const objs: Obj[] = [];
    const addBox = (
      x: number, z: number, w: number, h: number, l: number,
      color: number, label: string, vx = 0, vz = 0
    ) => {
      const geo = new THREE.BoxGeometry(w, h, l);
      const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.15,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, h / 2, z);
      scene.add(m);
      const ed = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color })
      );
      ed.position.copy(m.position);
      scene.add(ed);
      objs.push({ mesh: m, edges: ed, label, vx, vz });
    };
    addBox(6, -2, 1.8, 1.4, 4.4, 0xff7eb6, "car_0", -0.04, 0.01);
    addBox(-5, -8, 1.8, 1.4, 4.4, 0xff7eb6, "car_1", 0.03, 0.02);
    addBox(3, 8, 0.6, 1.7, 0.6, 0xf0c83c, "ped_0", 0.0, -0.015);
    addBox(-3, 4, 0.6, 1.7, 0.6, 0xf0c83c, "ped_1", 0.0, -0.012);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Camera orbit + slight bob
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.005;
      const radius = 14;
      camera.position.x = Math.cos(t * 0.5) * radius;
      camera.position.z = Math.sin(t * 0.5) * radius;
      camera.position.y = 7 + Math.sin(t * 0.8) * 0.5;
      camera.lookAt(0, 0.5, 0);

      pc.rotation.y = t * 0.4;

      // move objects
      objs.forEach((o) => {
        o.mesh.position.x += o.vx;
        o.mesh.position.z += o.vz;
        if (Math.abs(o.mesh.position.x) > 14) o.vx *= -1;
        if (Math.abs(o.mesh.position.z) > 14) o.vz *= -1;
        o.edges.position.copy(o.mesh.position);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      pcGeo.dispose();
      pcMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ height: 420 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
