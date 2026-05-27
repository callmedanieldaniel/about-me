"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// L7 / Loca-style extruded hex grid with data-driven height
export default function L7Demo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a10, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a10, 35, 90);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Hexagonal cylinder (radius 1, 6 sides)
    const hexGeo = new THREE.CylinderGeometry(0.85, 0.85, 1, 6);

    const hexes: THREE.Mesh[] = [];
    const baseHeights: number[] = [];

    const radius = 12;
    const dx = Math.sqrt(3); // hex width
    const dz = 1.5;          // row offset

    for (let r = -radius; r <= radius; r++) {
      for (let q = -radius; q <= radius; q++) {
        const x = (q + r * 0.5) * dx;
        const z = r * dz;
        const dist = Math.hypot(x, z);
        if (dist > radius * 1.2) continue;

        // data field — two gaussian peaks + ridge
        const v =
          Math.exp(-Math.pow((x + 6) * 0.18, 2) - Math.pow((z - 4) * 0.2, 2)) * 8 +
          Math.exp(-Math.pow((x - 8) * 0.15, 2) - Math.pow((z + 3) * 0.18, 2)) * 6 +
          Math.exp(-Math.pow(z * 0.25, 2)) * 1.5 +
          Math.random() * 0.6;

        const t = Math.min(1, v / 8);
        const color = new THREE.Color().setHSL(0.55 - t * 0.5, 0.7, 0.45 + t * 0.2);
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.3),
          metalness: 0.15,
          roughness: 0.5,
          transparent: true,
          opacity: 0.92,
        });
        const m = new THREE.Mesh(hexGeo, mat);
        m.position.set(x, v / 2, z);
        m.scale.y = Math.max(0.2, v);
        scene.add(m);
        hexes.push(m);
        baseHeights.push(v);
      }
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xfff0c8, 0.9);
    key.position.set(20, 40, 10);
    scene.add(key);
    const rim = new THREE.PointLight(0xff7eb6, 1.5, 50);
    rim.position.set(-12, 8, -8);
    scene.add(rim);

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.008;
      camera.position.x = Math.sin(t) * 32;
      camera.position.z = Math.cos(t) * 32;
      camera.position.y = 24 + Math.sin(t * 0.5) * 4;
      camera.lookAt(0, 3, 0);

      // gentle breathing animation on heights
      hexes.forEach((m, i) => {
        const h = baseHeights[i] + Math.sin(t * 2 + i * 0.1) * 0.3;
        m.scale.y = Math.max(0.2, h);
        m.position.y = m.scale.y / 2;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      hexGeo.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ height: 380 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
