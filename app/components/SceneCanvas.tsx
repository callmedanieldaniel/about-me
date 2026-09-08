"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { particleField, type SceneMode } from "../lib/particle-fields";

type Props = { mode: SceneMode; playing: boolean; reset: number };
export default function SceneCanvas({ mode, playing, reset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ mode, playing, reset });
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    input.current = { mode, playing, reset };
  }, [mode, playing, reset]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
    camera.position.set(11, 8, 14);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.enableZoom = false;
    controls.minDistance = 11;
    controls.maxDistance = 28;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.79;
    // Pinch zoom is handled explicitly so ordinary page scrolling remains available.
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    controls.target.set(0, -0.3, 0);
    controls.update();
    controls.saveState();
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    const pointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      pinchDistance = 0;
    };
    const pointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinchDistance = 0;
    };
    const pointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size !== 2) return;
      const [a, b] = Array.from(pointers.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance > 0 && distance > 0) {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          THREE.MathUtils.clamp(
            (offset.length() * pinchDistance) / distance,
            11,
            28,
          ),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
      }
      pinchDistance = distance;
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("pointermove", pointerMove);
    const count = window.matchMedia("(max-width: 680px)").matches
      ? 6400
      : 14400;
    let currentMode = input.current.mode,
      currentReset = input.current.reset;
    let target = particleField(currentMode, count);
    const positions = target.slice();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const colors = new Float32Array(count * 3);
    const mint = new THREE.Color("#b4f5d2"),
      peach = new THREE.Color("#ecb59c"),
      blue = new THREE.Color("#80b3c4");
    for (let i = 0; i < count; i++) {
      const t = (i % 120) / 119;
      const c =
        t > 0.56
          ? mint.clone().lerp(peach, (t - 0.56) / 0.44)
          : blue.clone().lerp(mint, t / 0.56);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: { pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `varying vec3 vColor; uniform float pixelRatio; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(36.*pixelRatio / -mv.z,1.3,5.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=1.-smoothstep(.16,.5,d);gl_FragColor=vec4(vColor,a*.88);}`,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    const grid = new THREE.GridHelper(20, 20, 0x34413d, 0x1c2927);
    grid.position.y = -3.3;
    scene.add(grid);
    const boxes = new THREE.Group();
    for (const [x, z, w, h, d] of [
      [0, 0, 1, 1, 2],
      [-3, 2, 1, 1.3, 2],
      [3, -2, 0.7, 1.8, 0.7],
    ]) {
      const box = new THREE.BoxGeometry(w, h, d);
      const edge = new THREE.EdgesGeometry(box);
      box.dispose();
      const lines = new THREE.LineSegments(
        edge,
        new THREE.LineBasicMaterial({
          color: 0xb4f5d2,
          transparent: true,
          opacity: 0.7,
        }),
      );
      lines.position.set(x, -1.3 + h / 2, z);
      boxes.add(lines);
    }
    scene.add(boxes);
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      renderer.setSize(
        Math.max(1, rect.width),
        Math.max(1, rect.height),
        false,
      );
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
      dirty = true;
    };
    let dirty = true,
      visible = true,
      raf = 0,
      last = 0,
      morph = 0;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    resize();
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        dirty = true;
      },
      { rootMargin: "100px" },
    );
    intersection.observe(canvas);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => {
      dirty = true;
    };
    controls.addEventListener("change", changed);
    const key = (e: KeyboardEvent) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "-",
          "=",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (e.key === "ArrowLeft") spherical.theta -= 0.12;
      if (e.key === "ArrowRight") spherical.theta += 0.12;
      if (e.key === "ArrowUp") spherical.phi -= 0.12;
      if (e.key === "ArrowDown") spherical.phi += 0.12;
      if (e.key === "+" || e.key === "=") spherical.radius -= 1;
      if (e.key === "-") spherical.radius += 1;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.2, Math.PI * 0.79);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, 11, 28);
      camera.position
        .copy(controls.target)
        .add(offset.setFromSpherical(spherical));
      controls.update();
      dirty = true;
    };
    canvas.addEventListener("keydown", key);
    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", lost);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      if (currentReset !== input.current.reset) {
        currentReset = input.current.reset;
        controls.reset();
        points.rotation.set(0, 0, 0);
        boxes.rotation.set(0, 0, 0);
        dirty = true;
      }
      if (currentMode !== input.current.mode) {
        currentMode = input.current.mode;
        target = particleField(currentMode, count);
        morph = reduced.matches ? 0 : 1.5;
        if (reduced.matches) {
          positions.set(target);
          geometry.attributes.position.needsUpdate = true;
        }
        dirty = true;
      }
      if (morph > 0) {
        const factor = 1 - Math.exp(-dt * 7);
        for (let i = 0; i < positions.length; i++)
          positions[i] += (target[i] - positions[i]) * factor;
        morph -= dt;
        if (morph <= 0) positions.set(target);
        geometry.attributes.position.needsUpdate = true;
        dirty = true;
      }
      boxes.visible = currentMode === "lidar";
      if (input.current.playing) {
        points.rotation.y += dt * 0.065;
        boxes.rotation.y = points.rotation.y;
        dirty = true;
      }
      if (dirty) {
        renderer.render(scene, camera);
        dirty = false;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      controls.dispose();
      canvas.removeEventListener("keydown", key);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("pointermove", pointerMove);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material)
            ? object.material
            : [object.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    };
  }, [retry]);
  return (
    <>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="img"
        aria-label="Interactive synthetic 3D visualization. Drag to rotate; use arrow keys to orbit, plus and minus to zoom."
      />
      {failed && (
        <div className="scene-fallback" role="status">
          <h3>Explore beyond the canvas.</h3>
          <p>
            3D rendering is unavailable on this device. The project studies and
            technical details remain available below.
          </p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          >
            Retry 3D
          </button>
        </div>
      )}
    </>
  );
}
