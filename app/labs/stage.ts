import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type Stage = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls | null;
  size: () => { w: number; h: number };
  render: () => void;
  dispose: () => void;
};

export const palette = {
  live: 0x5ee7ff,
  ref: 0xffb454,
  ok: 0x7cf3a0,
  bad: 0xff5d73,
  grid: 0x1c2a3d,
  fg: 0xe6eef8,
  muted: 0x7e90a8,
};

export function createStage(
  el: HTMLElement,
  opts: {
    position: [number, number, number];
    target?: [number, number, number];
    orbit?: boolean;
    fov?: number;
    grid?: number;
    fog?: boolean;
  },
): Stage | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  if (opts.fog !== false) scene.fog = new THREE.FogExp2(0x070b12, 0.012);
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 45, 1, 0.05, 600);
  camera.position.set(...opts.position);
  const target = new THREE.Vector3(...(opts.target ?? [0, 0, 0]));
  camera.lookAt(target);
  let controls: OrbitControls | null = null;
  if (opts.orbit !== false) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();
  }
  if (opts.grid) {
    const g = new THREE.GridHelper(opts.grid, opts.grid / 2, 0x243650, 0x141f2e);
    (g.material as THREE.Material).transparent = true;
    (g.material as THREE.Material).opacity = 0.6;
    scene.add(g);
  }
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a1020, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 12, 8);
  scene.add(key);
  const size = () => ({
    w: Math.max(1, el.clientWidth),
    h: Math.max(1, el.clientHeight),
  });
  const resize = () => {
    const { w, h } = size();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  const render = () => {
    controls?.update();
    renderer.render(scene, camera);
  };
  const dispose = () => {
    ro.disconnect();
    controls?.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => mat?.dispose?.());
    });
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  return { scene, camera, renderer, controls, size, render, dispose };
}

export function makeLabel(
  text: string,
  color = "#e6eef8",
  scale = 1,
): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.font = "500 28px 'IBM Plex Mono', monospace";
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 8, 32);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  s.scale.set(4 * scale, 1 * scale, 1);
  return s;
}
