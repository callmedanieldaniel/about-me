"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "../scenes/kit/rng";

// Hero: the world as data — a particle globe with land-like clusters, great-circle arcs, orbit rings carrying data motes, a scanning band and a halo. Reacts to the pointer.
export default function Hero() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(0, 0.5, 7.8);
    const rng = mulberry32(42); const R = 2.2;
    // globe points: denser on pseudo-continents (low-frequency noise), sparse elsewhere
    const N = 9000; const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
    const cA = new THREE.Color(0x1d3a55), cB = new THREE.Color(0x5ee7ff), cC = new THREE.Color(0xffb454);
    for (let i = 0; i < N; i++) { const u = rng(), v = rng(); const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1); const land = Math.sin(th * 2.3 + 1) * Math.cos(ph * 3.1) + Math.sin(th * 5.1) * 0.4 + Math.cos(ph * 7 + th) * 0.3; const isLand = land > 0.25; if (!isLand && rng() > 0.35) { i--; continue; } const r = R + (isLand ? rng() * 0.03 : 0); pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); const c = isLand ? (rng() < 0.08 ? cC : cB) : cA; col.set([c.r, c.g, c.b], i * 3); size[i] = isLand ? 1.6 + rng() * 1.4 : 0.9; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uPx: { value: renderer.getPixelRatio() } }, vertexShader: `attribute float aSize; varying vec3 vC; varying float vF; uniform float uT; uniform float uPx; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); float band = smoothstep(0.08, 0.0, abs(fract(position.y*0.35 - uT*0.12) - 0.5) - 0.42); vF = band; gl_PointSize = aSize * uPx * (1.0 + band*1.5) * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying vec3 vC; varying float vF; void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.15, length(d)); gl_FragColor = vec4(mix(vC, vec3(1.0), vF*0.6), a * 0.95); }`, vertexColors: true });
    const globe = new THREE.Points(g, mat); scene.add(globe);
    // halo
    const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 48, 32), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: {}, vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position*1.18,1.0); }`, fragmentShader: `varying vec3 vN; void main(){ float f = pow(1.0 - abs(vN.z), 3.0); gl_FragColor = vec4(0.37, 0.9, 1.0, f*0.55); }` })); scene.add(halo);
    // arcs between land nodes
    const arcs = new THREE.Group(); scene.add(arcs); const nodes: THREE.Vector3[] = []; for (let i = 0; i < 14; i++) { const k = Math.floor(rng() * N); nodes.push(new THREE.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2])); }
    const arcMats: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < 18; i++) { const a = nodes[Math.floor(rng() * nodes.length)], b = nodes[Math.floor(rng() * nodes.length)]; if (a === b) continue; const pts: THREE.Vector3[] = []; for (let k = 0; k <= 40; k++) { const t = k / 40; const p = a.clone().lerp(b, t).normalize().multiplyScalar(R + Math.sin(t * Math.PI) * a.distanceTo(b) * 0.35); pts.push(p); } const lg = new THREE.BufferGeometry().setFromPoints(pts); const lm = new THREE.LineBasicMaterial({ color: i % 3 ? 0x5ee7ff : 0xffb454, transparent: true, opacity: 0.35 }); arcMats.push(lm); arcs.add(new THREE.Line(lg, lm)); }
    // orbit rings with motes
    const rings = new THREE.Group(); scene.add(rings); const motes: { m: THREE.Mesh; r: number; s: number; o: number; ring: THREE.Group }[] = [];
    [[R * 1.35, 0.3, 0.2, 0x5ee7ff], [R * 1.6, -0.5, 0.6, 0xb99cff], [R * 1.9, 0.9, -0.3, 0xffb454]].forEach(([rr, rx, rz, cc]) => { const grp = new THREE.Group(); grp.rotation.set(rx, 0, rz); const ring = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.004, 8, 200), new THREE.MeshBasicMaterial({ color: cc, transparent: true, opacity: 0.35 })); grp.add(ring); rings.add(grp); for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: cc })); grp.add(m); motes.push({ m, r: rr, s: 0.25 + rng() * 0.3, o: rng() * Math.PI * 2, ring: grp }); } });
    const light = new THREE.PointLight(0x5ee7ff, 2, 20); light.position.set(4, 3, 4); scene.add(light);
    const target = new THREE.Vector2(); const cur = new THREE.Vector2();
    const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); target.set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2); };
    window.addEventListener("pointermove", onMove);
    const resize = () => { const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); globe.position.x = w > 900 ? 2.3 : 0; halo.position.x = globe.position.x; arcs.position.x = globe.position.x; rings.position.x = globe.position.x; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(el);
    let raf = 0, t0 = performance.now(); const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = (now: number) => { const t = (now - t0) / 1000; cur.lerp(target, 0.04); const spin = reduced ? 0 : t * 0.08; globe.rotation.y = spin + cur.x * 0.3; globe.rotation.x = cur.y * 0.15; arcs.rotation.copy(globe.rotation); halo.rotation.copy(globe.rotation); mat.uniforms.uT.value = t; rings.rotation.y = -spin * 0.6; motes.forEach((mo) => { const a = mo.o + t * mo.s; mo.m.position.set(Math.cos(a) * mo.r, 0, Math.sin(a) * mo.r); }); arcMats.forEach((m, i) => (m.opacity = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.8 + i)))); renderer.render(scene, camera); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("pointermove", onMove); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="hero-canvas" aria-hidden="true" />;
}
