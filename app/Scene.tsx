"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Scene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.set(0, 1.5, 9);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 9000;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const accent = new THREE.Color("#e31937");
    const white = new THREE.Color("#ffffff");

    for (let i = 0; i < N; i++) {
      const ring = Math.floor(i / 200);
      const a = ((i % 200) / 200) * Math.PI * 2 + ring * 0.07;
      const r = 2 + ring * 0.08 + Math.sin(a * 3 + ring) * 0.25;
      const y = (ring - 22) * 0.06 + Math.sin(a * 5) * 0.05;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r;

      const t = Math.min(1, r / 6);
      const c = white.clone().lerp(accent, t * 0.35);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const points = new THREE.Points(geom, mat);
    scene.add(points);

    const grid = new THREE.GridHelper(20, 40, 0x222222, 0x161616);
    grid.position.y = -1.5;
    scene.add(grid);

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.6;
      my = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("pointermove", onMove);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.08;
      points.rotation.x = Math.sin(t * 0.2) * 0.1;
      camera.position.x += (mx * 2 - camera.position.x) * 0.04;
      camera.position.y += (1.5 - my * 2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      geom.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas id="bg" ref={ref} />;
}
