import * as THREE from "three";
import { mulberry32 } from "./rng";

export type Actor = { id: number; kind: "car" | "truck" | "ped" | "cyclist"; x: number; z: number; vx: number; vz: number; w: number; l: number; h: number; yaw: number };

export function makeActors(n: number, seed = 7): Actor[] {
  const rng = mulberry32(seed);
  const out: Actor[] = [];
  for (let i = 0; i < n; i++) {
    const r = rng();
    const kind: Actor["kind"] = r < 0.55 ? "car" : r < 0.7 ? "truck" : r < 0.88 ? "ped" : "cyclist";
    const lane = [-7, -3.5, 3.5, 7][Math.floor(rng() * 4)];
    const dir = lane < 0 ? -1 : 1;
    const speed = kind === "ped" ? 1.3 : kind === "cyclist" ? 5 : 8 + rng() * 8;
    const dims = kind === "car" ? [1.9, 4.5, 1.5] : kind === "truck" ? [2.5, 9, 3.4] : kind === "ped" ? [0.6, 0.6, 1.7] : [0.7, 1.8, 1.7];
    const z = kind === "ped" ? (rng() < 0.5 ? -11 : 11) : lane;
    out.push({ id: i, kind, x: -60 + rng() * 120, z, vx: dir * speed, vz: 0, w: dims[0], l: dims[1], h: dims[2], yaw: dir < 0 ? Math.PI : 0 });
  }
  return out;
}

export function stepActors(actors: Actor[], dt: number) {
  for (const a of actors) {
    a.x += a.vx * dt;
    if (a.x > 70) a.x = -70;
    if (a.x < -70) a.x = 70;
  }
}

export function actorColor(kind: Actor["kind"]) {
  return kind === "car" ? 0x5ee7ff : kind === "truck" ? 0xb99cff : kind === "ped" ? 0xff5d73 : 0x7cf3a0;
}

// Builds a lightweight city: road, sidewalks, building blocks. Returns colliders (AABBs in world space) for ray tests.
export function buildCity(scene: THREE.Scene, seed = 3, opacity = 0.6) {
  const rng = mulberry32(seed);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(160, 20), new THREE.MeshStandardMaterial({ color: 0x0b1320, roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  scene.add(road);
  const dash = new THREE.BufferGeometry();
  const pts: number[] = [];
  for (let x = -80; x < 80; x += 4) pts.push(x, 0.02, 0, x + 2, 0.02, 0);
  dash.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.LineSegments(dash, new THREE.LineBasicMaterial({ color: 0x3a4c66 })));
  const edge = new THREE.BufferGeometry();
  edge.setAttribute("position", new THREE.Float32BufferAttribute([-80, 0.02, -10, 80, 0.02, -10, -80, 0.02, 10, 80, 0.02, 10], 3));
  scene.add(new THREE.LineSegments(edge, new THREE.LineBasicMaterial({ color: 0x223247 })));
  const colliders: THREE.Box3[] = [];
  const mat = new THREE.MeshStandardMaterial({ color: 0x0f1826, roughness: 0.9, transparent: true, opacity });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x24364e });
  for (let x = -72; x < 72; x += 14 + rng() * 6) {
    for (const side of [-1, 1]) {
      const w = 8 + rng() * 6, d = 8 + rng() * 8, h = 6 + rng() * 22;
      const cz = side * (17 + rng() * 8);
      const geo = new THREE.BoxGeometry(w, h, d);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, h / 2, cz);
      scene.add(m);
      scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat).translateX(x).translateY(h / 2).translateZ(cz));
      colliders.push(new THREE.Box3(new THREE.Vector3(x - w / 2, 0, cz - d / 2), new THREE.Vector3(x + w / 2, h, cz + d / 2)));
    }
  }
  return colliders;
}

export function actorMesh(a: Actor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(a.l, a.h, a.w), new THREE.MeshStandardMaterial({ color: actorColor(a.kind), roughness: 0.5, metalness: 0.2, transparent: true, opacity: 0.85 }));
  body.position.y = a.h / 2;
  g.add(body);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })).translateY(a.h / 2));
  return g;
}

export function egoMesh() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.5, 1.9), new THREE.MeshStandardMaterial({ color: 0xffb454, roughness: 0.4, metalness: 0.3 }));
  b.position.y = 0.75;
  g.add(b);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.7), new THREE.MeshStandardMaterial({ color: 0x1b2433 }));
  cab.position.set(-0.2, 1.85, 0);
  g.add(cab);
  return g;
}
