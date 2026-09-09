"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
  uniform float uSweep;
  uniform float uTime;
  attribute float aKind;
  varying float vGlow;
  varying float vKind;
  void main() {
    float ang = atan(position.z, position.x);
    float d = mod(ang - uSweep + 6.28318, 6.28318);
    float glow = exp(-d * 2.2);
    vGlow = glow;
    vKind = aKind;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float size = (aKind > 0.5 ? 2.6 : 1.6) * (1.0 + glow * 1.4);
    gl_PointSize = min(7.0, size * (105.0 / -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  varying float vGlow;
  varying float vKind;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 ground = vec3(0.16, 0.22, 0.32);
    vec3 obst = vec3(0.37, 0.91, 1.0);
    vec3 hot = vec3(0.93, 0.97, 1.0);
    vec3 col = mix(ground, obst, vKind);
    col = mix(col, hot, vGlow * 0.7);
    float a = 0.18 + vGlow * 0.72;
    gl_FragColor = vec4(col, a * (vKind > 0.5 ? 1.0 : 0.6));
  }
`;

export default function Hero() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    camera.position.set(-54, 34, 48);
    camera.lookAt(6, 2, 0);

    // Synthesize a city-block point field: ground rings, walls, cars
    const N = 42000;
    const pos = new Float32Array(N * 3);
    const kind = new Float32Array(N);
    let i = 0;
    const put = (x: number, y: number, z: number, k: number) => {
      if (i >= N) return;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      kind[i] = k;
      i++;
    };
    const seed = (() => {
      let a = 1337;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })();
    // ground rings (channel structure)
    for (let ring = 0; ring < 44; ring++) {
      const r = 3 + ring * ring * 0.055 + ring * 0.8;
      const steps = Math.floor(120 + r * 12);
      for (let s = 0; s < steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (Math.abs(z) > 14 && Math.abs(x) < 90) continue; // buildings occlude
        put(x + (seed() - 0.5) * 0.15, (seed() - 0.5) * 0.06, z + (seed() - 0.5) * 0.15, 0);
      }
    }
    // building facades along both sides
    for (let b = 0; b < 26; b++) {
      const side = b % 2 ? 1 : -1;
      const x0 = -80 + Math.floor(b / 2) * 13 + seed() * 3;
      const w = 6 + seed() * 6, h = 5 + seed() * 14, z0 = side * (16 + seed() * 6);
      const dens = 700;
      for (let k = 0; k < dens; k++) {
        const x = x0 + seed() * w, y = seed() * h;
        const facing = Math.abs(x) + Math.abs(z0) * 0.3 + seed() * 4;
        if (facing > 90) continue;
        put(x, y, z0 + (seed() - 0.5) * 0.2, 1);
      }
    }
    // vehicles on the road
    for (let c = 0; c < 22; c++) {
      const lane = [-5.25, -1.75, 1.75, 5.25][c % 4];
      const x0 = -70 + seed() * 140;
      for (let k = 0; k < 220; k++) {
        const x = x0 + seed() * 4.4, y = 0.3 + seed() * 1.4, z = lane + (seed() - 0.5) * 1.9;
        const shell = seed() < 0.5 ? 1 : 0;
        put(x, shell ? y : 0.3 + seed() * 0.2, shell ? z : lane + (seed() < 0.5 ? -0.95 : 0.95), 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, i * 3), 3));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kind.subarray(0, i), 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uSweep: { value: 0 }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(geo, mat));
    const ego = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.4, 1.9), new THREE.MeshBasicMaterial({ color: 0xffb454 }));
    ego.position.y = 0.8;
    scene.add(ego);

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    let raf = 0, last = performance.now(), t = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reduce) t += dt;
      mat.uniforms.uSweep.value = (t * 1.1) % (Math.PI * 2);
      camera.position.x = -54 + Math.sin(t * 0.08) * 8;
      camera.position.z = 48 + Math.cos(t * 0.06) * 6;
      camera.lookAt(6, 2, 0);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="hero-canvas" aria-hidden="true" />;
}
