import * as THREE from "three";
import type { MainModule, MjModel, MjData } from "mujoco";

let modPromise: Promise<MainModule> | null = null;
export function loadMujoco(): Promise<MainModule> {
  // The Emscripten bundle is served from /vendor (copied by scripts/copy-assets.mjs) and imported at runtime, bypassing the bundler.
  if (!modPromise) modPromise = (import(/* webpackIgnore: true */ /* turbopackIgnore: true */ ("/vendor/mujoco.js" as string)) as Promise<{ default: (o: { locateFile: (p: string) => string }) => Promise<MainModule> }>).then((m) => m.default({ locateFile: (p: string) => (p.endsWith(".wasm") ? "/vendor/mujoco.wasm" : p) }));
  return modPromise;
}

export async function loadModel(mj: MainModule, name: string, xml: string) {
  try { mj.FS.mkdir("/working"); } catch { /* exists */ }
  mj.FS.writeFile(`/working/${name}.xml`, xml);
  const model = mj.MjModel.mj_loadXML(`/working/${name}.xml`);
  const data = new mj.MjData(model);
  return { model, data };
}

// Builds Three.js meshes for every geom (MuJoCo z-up → Three y-up handled by a parent group rotation).
export function buildGeoms(model: MjModel, scene: THREE.Scene) {
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scene.add(root);
  const n = model.ngeom; const type = model.geom_type as Int32Array, size = model.geom_size as Float64Array, rgba = model.geom_rgba as Float32Array;
  const meshes: (THREE.Mesh | null)[] = [];
  for (let i = 0; i < n; i++) {
    const t = type[i]; const s = [size[i * 3], size[i * 3 + 1], size[i * 3 + 2]]; const col = new THREE.Color(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
    const isDefault = rgba[i * 4] > 0.49 && rgba[i * 4] < 0.51 && rgba[i * 4 + 1] > 0.49 && rgba[i * 4 + 1] < 0.51;
    const mat = new THREE.MeshStandardMaterial({ color: isDefault ? 0x8fb3d9 : col, roughness: 0.55, metalness: 0.15, transparent: rgba[i * 4 + 3] < 1, opacity: rgba[i * 4 + 3] });
    let geo: THREE.BufferGeometry | null = null;
    if (t === 0) { geo = new THREE.PlaneGeometry(s[0] * 2 || 10, s[1] * 2 || 10); mat.color.set(0x0f1826); mat.side = THREE.DoubleSide; }
    else if (t === 2) geo = new THREE.SphereGeometry(s[0], 20, 14);
    else if (t === 3) { geo = new THREE.CapsuleGeometry(s[0], s[1] * 2, 6, 14); geo.rotateX(Math.PI / 2); }
    else if (t === 5) { geo = new THREE.CylinderGeometry(s[0], s[0], s[1] * 2, 20); geo.rotateX(Math.PI / 2); }
    else if (t === 6) geo = new THREE.BoxGeometry(s[0] * 2, s[1] * 2, s[2] * 2);
    else if (t === 4) { geo = new THREE.SphereGeometry(1, 16, 12); geo.scale(s[0], s[1], s[2]); }
    if (!geo) { meshes.push(null); continue; }
    const m = new THREE.Mesh(geo, mat); root.add(m); meshes.push(m);
    if (t !== 0) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 })); m.add(e); }
  }
  return { root, meshes };
}

const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion();
export function syncGeoms(data: MjData, meshes: (THREE.Mesh | null)[]) {
  const xpos = data.geom_xpos as Float64Array, xmat = data.geom_xmat as Float64Array;
  for (let i = 0; i < meshes.length; i++) {
    const m = meshes[i]; if (!m) continue;
    const o = i * 9;
    m4.set(xmat[o], xmat[o + 1], xmat[o + 2], 0, xmat[o + 3], xmat[o + 4], xmat[o + 5], 0, xmat[o + 6], xmat[o + 7], xmat[o + 8], 0, 0, 0, 0, 1);
    q.setFromRotationMatrix(m4); m.quaternion.copy(q);
    m.position.set(xpos[i * 3], xpos[i * 3 + 1], xpos[i * 3 + 2]);
  }
}

export function contactPoints(mj: MainModule, data: MjData): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  try { const n = data.ncon; for (let i = 0; i < n; i++) { const c = data.contact.get ? data.contact.get(i) : (data.contact as unknown as { pos: number[] }[])[i]; if (c?.pos) out.push(new THREE.Vector3(c.pos[0], c.pos[1], c.pos[2])); } } catch { /* contact accessor unavailable */ }
  void mj;
  return out;
}
