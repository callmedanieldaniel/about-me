"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// AMap Loca-style 3D extruded city — stylized blocks + light sweep
export default function LocaDemo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a10, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a10, 30, 80);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(28, 22, 28);
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

    // ground grid
    const grid = new THREE.GridHelper(80, 40, 0x222230, 0x14141c);
    scene.add(grid);

    // road network (cross + diagonals)
    const roadMat = new THREE.LineBasicMaterial({ color: 0x2a2a40 });
    const roadGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-40, 0.01, 0), new THREE.Vector3(40, 0.01, 0),
      new THREE.Vector3(0, 0.01, -40), new THREE.Vector3(0, 0.01, 40),
    ]);
    scene.add(new THREE.LineSegments(roadGeo, roadMat));

    // city blocks — colored by height, mimics Loca extrude layer
    const blocks: THREE.Mesh[] = [];
    const grid_n = 14;
    const cell = 3.0;
    const heightMap: number[][] = [];
    for (let i = 0; i < grid_n; i++) {
      heightMap[i] = [];
      for (let j = 0; j < grid_n; j++) {
        const cx = i - grid_n / 2 + 0.5;
        const cz = j - grid_n / 2 + 0.5;
        const distToCenter = Math.hypot(cx, cz);
        // skyscraper cluster in middle, drops off
        const base = Math.max(0, 1 - distToCenter / (grid_n / 2));
        const noise = Math.random();
        const skip = Math.abs(cx) < 0.6 || Math.abs(cz) < 0.6; // road gap
        heightMap[i][j] = skip ? 0 : 0.5 + base * 8 + noise * 4;
      }
    }

    const baseGeo = new THREE.BoxGeometry(cell * 0.78, 1, cell * 0.78);
    for (let i = 0; i < grid_n; i++) {
      for (let j = 0; j < grid_n; j++) {
        const h = heightMap[i][j];
        if (h <= 0.5) continue;
        // color ramp by height (low: teal, mid: pink, tall: cream)
        const t = Math.min(1, h / 10);
        const color = new THREE.Color().setHSL(
          0.5 - t * 0.45,
          0.6,
          0.4 + t * 0.25
        );
        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.25),
          metalness: 0.1,
          roughness: 0.55,
          transparent: true,
          opacity: 0.92,
        });
        const m = new THREE.Mesh(baseGeo, mat);
        const x = (i - grid_n / 2 + 0.5) * cell;
        const z = (j - grid_n / 2 + 0.5) * cell;
        m.position.set(x, h / 2, z);
        m.scale.y = h;
        scene.add(m);
        blocks.push(m);

        // top edge highlight
        const edges = new THREE.EdgesGeometry(baseGeo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: 0xff7eb6,
            transparent: true,
            opacity: 0.35,
          })
        );
        line.position.copy(m.position);
        line.scale.copy(m.scale);
        scene.add(line);
      }
    }

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffeec0, 0.8);
    key.position.set(30, 50, 20);
    scene.add(key);
    const rim = new THREE.PointLight(0x79ffe1, 1.2, 60);
    rim.position.set(-15, 15, -15);
    scene.add(rim);

    // sweeping light bar across ground
    const sweepGeo = new THREE.PlaneGeometry(80, 2);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0xff7eb6,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const sweep = new THREE.Mesh(sweepGeo, sweepMat);
    sweep.rotation.x = -Math.PI / 2;
    sweep.position.y = 0.02;
    scene.add(sweep);

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.005;
      // orbit
      const r = 32;
      camera.position.x = Math.cos(t) * r;
      camera.position.z = Math.sin(t) * r;
      camera.position.y = 18 + Math.sin(t * 0.7) * 4;
      camera.lookAt(0, 4, 0);

      sweep.position.z = ((t * 30) % 80) - 40;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      baseGeo.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ height: 380 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
