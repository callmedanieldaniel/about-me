"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage, palette } from "../../stage";
import type { EngineProps } from "../../types";

type Box = {
  cx: number;
  cz: number;
  sx: number;
  sy: number;
  sz: number;
  vx: number;
  dynamic: boolean;
};

const AZ_STEPS = 720;

export default function Lidar({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const bev = useRef<HTMLCanvasElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const stage = createStage(el, { position: [-30, 34, 34], target: [6, 0, 0], grid: 120, fov: 40 });
    if (!stage) return;
    const { scene } = stage;

    // Road surface
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 16),
      new THREE.MeshStandardMaterial({ color: 0x0c1420, roughness: 1 }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    scene.add(road);
    [-5.25, -1.75, 1.75, 5.25].forEach((z) => {
      const l = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x2a3b55 }),
      );
      l.rotation.x = -Math.PI / 2;
      l.position.set(0, 0.02, z);
      scene.add(l);
    });

    // Ego
    const ego = new THREE.Group();
    const egoBody = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.5, 1.9),
      new THREE.MeshStandardMaterial({ color: palette.ref, emissive: 0x442200, roughness: 0.4 }),
    );
    egoBody.position.y = 0.95;
    ego.add(egoBody);
    const sensor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x111827, emissive: palette.live, emissiveIntensity: 0.8 }),
    );
    sensor.position.y = 1.85;
    ego.add(sensor);
    scene.add(ego);

    // Static world: buildings, barriers
    const rng = mulberry(7 + resetKey);
    const boxes: Box[] = [];
    const meshes: THREE.Mesh[] = [];
    const staticMat = new THREE.MeshStandardMaterial({ color: 0x0f1826, roughness: 0.9, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1;
      const b: Box = {
        cx: -70 + i * 8 + rng() * 4,
        cz: side * (17 + rng() * 8),
        sx: 5 + rng() * 6,
        sy: 4 + rng() * 10,
        sz: 5 + rng() * 6,
        vx: 0,
        dynamic: false,
      };
      boxes.push(b);
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.sx, b.sy, b.sz), staticMat);
      m.position.set(b.cx, b.sy / 2, b.cz);
      scene.add(m);
      meshes.push(m);
    }
    // Dynamic actors
    const actorMat = new THREE.MeshStandardMaterial({ color: 0x1c2a3d, roughness: 0.6, metalness: 0.2 });
    const actors: { box: Box; mesh: THREE.Mesh; helper: THREE.LineSegments }[] = [];
    const boxEdges = (b: Box) =>
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(b.sx, b.sy, b.sz)),
        new THREE.LineBasicMaterial({ color: palette.ok }),
      );
    const spawnActors = (n: number) => {
      actors.forEach((a) => {
        scene.remove(a.mesh, a.helper);
        a.mesh.geometry.dispose();
        a.helper.geometry.dispose();
      });
      actors.length = 0;
      const lanes = [-5.25, -1.75, 1.75, 5.25];
      for (let i = 0; i < n; i++) {
        const lane = lanes[i % 4];
        const pedestrian = i % 5 === 4;
        const b: Box = pedestrian
          ? { cx: -40 + rng() * 80, cz: (rng() > 0.5 ? 1 : -1) * (8.5 + rng()), sx: 0.6, sy: 1.75, sz: 0.6, vx: (rng() - 0.5) * 2.5, dynamic: true }
          : { cx: -60 + rng() * 120, cz: lane, sx: 4.2 + rng() * 1.5, sy: 1.5 + rng() * 0.6, sz: 1.9, vx: (lane > 0 ? 1 : -1) * (6 + rng() * 10), dynamic: true };
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.sx, b.sy, b.sz), actorMat);
        const helper = boxEdges(b);
        scene.add(mesh, helper);
        actors.push({ box: b, mesh, helper });
      }
    };
    spawnActors(Number(p.current.actors));

    // Point cloud buffers
    const maxBeams = 128;
    const maxPts = maxBeams * AZ_STEPS;
    const pos = new Float32Array(maxPts * 3);
    const col = new Float32Array(maxPts * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.2, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.95 }),
    );
    scene.add(pts);

    // Sweep indicator
    const sweepGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.85, 0), new THREE.Vector3(60, 0.1, 0)]);
    const sweep = new THREE.Line(sweepGeo, new THREE.LineBasicMaterial({ color: palette.live, transparent: true, opacity: 0.5 }));
    scene.add(sweep);

    const sensorPos = new THREE.Vector3(0, 1.85, 0);
    const cLive = new THREE.Color(palette.live);
    const cHigh = new THREE.Color(0xb99cff);
    const cGround = new THREE.Color(0x56708f);
    const cNear = new THREE.Color(0x1a2a40);
    const tmp = new THREE.Color();

    let azIndex = 0;
    let last = performance.now();
    let raf = 0;
    let ptsThisSweep = 0;
    let obstacleThisSweep = 0;
    let lastActorCount = Number(p.current.actors);
    const bevCtx = bev.current?.getContext("2d") ?? null;
    const bevGrid = new Float32Array(160 * 160);

    const cast = (dir: THREE.Vector3): { t: number; ground: boolean } | null => {
      let best = Infinity;
      let ground = false;
      if (dir.y < 0) {
        const t = -sensorPos.y / dir.y;
        if (t < 90) {
          best = t;
          ground = true;
        }
      }
      const test = (b: Box) => {
        const t = slab(sensorPos, dir, b);
        if (t > 0 && t < best) {
          best = t;
          ground = false;
        }
      };
      for (const b of boxes) test(b);
      for (const a of actors) test(a.box);
      return best === Infinity ? null : { t: best, ground };
    };

    const dir = new THREE.Vector3();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const q = p.current;
      const beams = Number(q.beams);
      const rate = Number(q.rate);
      const noise = Number(q.noise);
      const showGround = Boolean(q.ground);
      const showBoxes = Boolean(q.boxes);
      const nActors = Number(q.actors);
      if (nActors !== lastActorCount) {
        spawnActors(nActors);
        lastActorCount = nActors;
      }
      if (play.current) {
        // Move actors
        for (const a of actors) {
          a.box.cx += a.box.vx * dt;
          if (a.box.cx > 70) a.box.cx = -70;
          if (a.box.cx < -70) a.box.cx = 70;
          a.mesh.position.set(a.box.cx, a.box.sy / 2, a.box.cz);
          a.helper.position.copy(a.mesh.position);
          a.helper.visible = showBoxes;
          if (showBoxes) {
            a.helper.position.x += (Math.random() - 0.5) * 0.12;
            a.helper.position.z += (Math.random() - 0.5) * 0.08;
          }
        }
        // Sweep: how many azimuth steps this frame
        const stepsPerSec = AZ_STEPS * rate;
        const steps = Math.min(AZ_STEPS, Math.max(1, Math.round(stepsPerSec * dt)));
        const vMin = (-25 * Math.PI) / 180;
        const vMax = (15 * Math.PI) / 180;
        for (let s = 0; s < steps; s++) {
          const az = (azIndex / AZ_STEPS) * Math.PI * 2;
          const ca = Math.cos(az);
          const sa = Math.sin(az);
          for (let b = 0; b < maxBeams; b++) {
            const i = (azIndex * maxBeams + b) * 3;
            if (b >= beams) {
              pos[i + 1] = -999;
              continue;
            }
            const v = vMin + ((vMax - vMin) * b) / (beams - 1);
            const cv = Math.cos(v);
            dir.set(ca * cv, Math.sin(v), sa * cv);
            const hit = cast(dir);
            if (!hit) {
              pos[i + 1] = -999;
              continue;
            }
            const t = hit.t + (Math.random() - 0.5) * 2 * noise;
            if (hit.ground && !showGround) {
              pos[i + 1] = -999;
              continue;
            }
            pos[i] = sensorPos.x + dir.x * t;
            pos[i + 1] = sensorPos.y + dir.y * t;
            pos[i + 2] = sensorPos.z + dir.z * t;
            ptsThisSweep++;
            if (hit.ground) {
              const fade = Math.min(1, t / 40);
              tmp.copy(cNear).lerp(cGround, 1 - fade * 0.6);
            } else {
              obstacleThisSweep++;
              tmp.copy(cLive).lerp(cHigh, Math.min(1, pos[i + 1] / 8));
            }
            col[i] = tmp.r;
            col[i + 1] = tmp.g;
            col[i + 2] = tmp.b;
            // BEV accumulate
            if (!hit.ground) {
              const gx = Math.floor((pos[i] + 40) / 0.5);
              const gz = Math.floor((pos[i + 2] + 40) / 0.5);
              if (gx >= 0 && gx < 160 && gz >= 0 && gz < 160) bevGrid[gz * 160 + gx] = 1;
            }
          }
          azIndex++;
          if (azIndex >= AZ_STEPS) {
            azIndex = 0;
            drawBev(bevCtx, bevGrid, actors, showBoxes);
            bevGrid.fill(0);
            onTelemetry({
              "Points / sweep": ptsThisSweep,
              "Obstacle returns": obstacleThisSweep,
              "Channels": beams,
              "Sweep rate (Hz)": rate,
              "Nearest actor (m)": nearest(actors),
              "Actors in scene": actors.length,
            });
            ptsThisSweep = 0;
            obstacleThisSweep = 0;
          }
        }
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        const az = (azIndex / AZ_STEPS) * Math.PI * 2;
        sweep.geometry.attributes.position.setXYZ(1, Math.cos(az) * 60, 0.1, Math.sin(az) * 60);
        sweep.geometry.attributes.position.needsUpdate = true;
        sensor.rotation.y = -az;
      }
      stage.render();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      stage.dispose();
    };
  }, [resetKey, onTelemetry]);

  return (
    <div className="engine-host">
      <div ref={host} className="engine-canvas" />
      <div className="inset">
        <canvas ref={bev} width={160} height={160} />
        <span>Bird's-eye occupancy · 80 m</span>
      </div>
    </div>
  );
}

function nearest(actors: { box: Box }[]) {
  let d = Infinity;
  for (const a of actors) d = Math.min(d, Math.hypot(a.box.cx, a.box.cz));
  return d === Infinity ? 0 : Math.round(d * 10) / 10;
}

function drawBev(
  ctx: CanvasRenderingContext2D | null,
  grid: Float32Array,
  actors: { box: Box }[],
  boxes: boolean,
) {
  if (!ctx) return;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = "#182436";
  for (let r = 20; r <= 80; r += 20) {
    ctx.beginPath();
    ctx.arc(80, 80, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#5ee7ff";
  for (let z = 0; z < 160; z++)
    for (let x = 0; x < 160; x++)
      if (grid[z * 160 + x]) ctx.fillRect(x, z, 1, 1);
  if (boxes) {
    ctx.strokeStyle = "#7cf3a0";
    for (const a of actors) {
      const x = (a.box.cx + 40) * 2;
      const z = (a.box.cz + 40) * 2;
      ctx.strokeRect(x - a.box.sx, z - a.box.sz, a.box.sx * 2, a.box.sz * 2);
    }
  }
  ctx.fillStyle = "#ffb454";
  ctx.fillRect(76, 78, 8, 4);
}

function slab(o: THREE.Vector3, d: THREE.Vector3, b: Box) {
  const minx = b.cx - b.sx / 2, maxx = b.cx + b.sx / 2;
  const miny = 0, maxy = b.sy;
  const minz = b.cz - b.sz / 2, maxz = b.cz + b.sz / 2;
  let t0 = 0, t1 = Infinity;
  const axes = [
    [o.x, d.x, minx, maxx],
    [o.y, d.y, miny, maxy],
    [o.z, d.z, minz, maxz],
  ];
  for (const [oo, dd, mn, mx] of axes) {
    if (Math.abs(dd) < 1e-8) {
      if (oo < mn || oo > mx) return -1;
      continue;
    }
    let ta = (mn - oo) / dd, tb = (mx - oo) / dd;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return -1;
  }
  return t0 > 0.5 ? t0 : -1;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
