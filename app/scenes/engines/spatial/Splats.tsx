"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "../../stage";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Gaussian splats (toy): thousands of anisotropic billboard Gaussians with additive blending and back-to-front sorting each frame — the rendering idea behind 3DGS, on a synthetic scene.
export default function Splats({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const stage = createStage(el, { position: [6, 4, 8], target: [0, 1, 0], grid: 0, fov: 45 }); if (!stage) return;
    const { scene, camera } = stage; const rng = mulberry32(5); const N = Number(p.current.count);
    const pos = new Float32Array(N * 3), scale = new Float32Array(N * 2), col = new Float32Array(N * 3), rot = new Float32Array(N);
    for (let i = 0; i < N; i++) { const shape = rng(); let x: number, y: number, z: number; if (shape < 0.45) { const a = rng() * Math.PI * 2, r = 1.2 + (rng() - 0.5) * 0.15; x = Math.cos(a) * r; z = Math.sin(a) * r; y = 1.2 + (rng() - 0.5) * 2.2 * Math.abs(Math.cos(a * 0.5)); } else if (shape < 0.75) { x = (rng() - 0.5) * 7; z = (rng() - 0.5) * 7; y = 0.02 + rng() * 0.05; } else { const a = rng() * Math.PI * 2, r = rng() * 0.6; x = 2.2 + Math.cos(a) * r; z = -1 + Math.sin(a) * r; y = 0.6 + Math.sqrt(Math.max(0, 0.36 - r * r)) * (rng() < 0.5 ? 1 : -1) * 0.9; } pos.set([x, y, z], i * 3); scale.set([0.06 + rng() * 0.12, 0.03 + rng() * 0.08], i * 2); rot[i] = rng() * Math.PI; const t = y / 2.4; col.set(shape < 0.45 ? [0.36 + t * 0.4, 0.9, 1] : shape < 0.75 ? [0.15, 0.22, 0.32] : [1, 0.7, 0.33], i * 3); }
    const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
    const order = new Uint32Array(N); for (let i = 0; i < N; i++) order[i] = i;
    const iPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), iScale = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2), iCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), iRot = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
    geo.setAttribute("iPos", iPos); geo.setAttribute("iScale", iScale); geo.setAttribute("iCol", iCol); geo.setAttribute("iRot", iRot);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.NormalBlending, uniforms: { uOpacity: { value: 0.8 }, uSize: { value: 1 } }, vertexShader: `attribute vec3 iPos; attribute vec2 iScale; attribute vec3 iCol; attribute float iRot; varying vec2 vUv; varying vec3 vCol; uniform float uSize; void main(){ vUv = position.xy; vCol = iCol; vec4 mv = modelViewMatrix * vec4(iPos,1.0); float cr = cos(iRot), sr = sin(iRot); vec2 off = vec2(position.x*iScale.x, position.y*iScale.y)*uSize*1.2; off = vec2(off.x*cr - off.y*sr, off.x*sr + off.y*cr); mv.xy += off; gl_Position = projectionMatrix * mv; }`, fragmentShader: `varying vec2 vUv; varying vec3 vCol; uniform float uOpacity; void main(){ float d = dot(vUv,vUv); float a = exp(-3.0*d) * uOpacity; if (a < 0.01) discard; gl_FragColor = vec4(vCol, a); }` });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
    const depth = new Float32Array(N); const v = new THREE.Vector3(); let raf = 0, frames = 0, t = 0, last = performance.now();
    const frame = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const q = p.current; if (play.current && Boolean(q.turntable)) { t += dt; camera.position.set(Math.cos(t * 0.3) * 9, 4, Math.sin(t * 0.3) * 9); camera.lookAt(0, 1, 0); }
      mat.uniforms.uOpacity.value = Number(q.opacity); mat.uniforms.uSize.value = Number(q.size);
      if (Boolean(q.sort) && (frames & 1) === 0) { camera.updateMatrixWorld(); const mv = camera.matrixWorldInverse; for (let i = 0; i < N; i++) { v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(mv); depth[i] = v.z; } order.sort((a, b) => depth[a] - depth[b]); }
      const ip = iPos.array as Float32Array, isc = iScale.array as Float32Array, ic = iCol.array as Float32Array, ir = iRot.array as Float32Array; for (let k = 0; k < N; k++) { const i = order[k]; ip[k * 3] = pos[i * 3]; ip[k * 3 + 1] = pos[i * 3 + 1]; ip[k * 3 + 2] = pos[i * 3 + 2]; isc[k * 2] = scale[i * 2]; isc[k * 2 + 1] = scale[i * 2 + 1]; ic[k * 3] = col[i * 3]; ic[k * 3 + 1] = col[i * 3 + 1]; ic[k * 3 + 2] = col[i * 3 + 2]; ir[k] = rot[i]; } iPos.needsUpdate = iScale.needsUpdate = iCol.needsUpdate = iRot.needsUpdate = true;
      stage.render(); if ((frames++ & 15) === 0) onTelemetry({ Splats: N, "Back-to-front sort": Boolean(q.sort) ? "every 2 frames" : "off", "Opacity": Number(q.opacity), "Size ×": Number(q.size) }); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); stage.dispose(); };
  }, [resetKey, params.count, onTelemetry]);
  return <div ref={host} className="engine-host" />;
}
