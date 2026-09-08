"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createDropWorld } from "./physics";
let physicsPromise:
  | Promise<(typeof import("@dimforge/rapier3d-compat"))["default"]>
  | undefined;
function loadPhysics() {
  physicsPromise ??= import("@dimforge/rapier3d-compat")
    .then(async (module) => {
      await module.default.init();
      return module.default;
    })
    .catch((error) => {
      physicsPromise = undefined;
      throw error;
    });
  return physicsPromise;
}
import type { LabId } from "./catalog";
import { brakeFrame, forwardKinematics, type BrakeConfig } from "./math";
export type LabConfig = BrakeConfig & {
  shoulder: number;
  elbow: number;
  targetX: number;
  targetY: number;
  gravity: number;
  restitution: number;
  height: number;
  wireframe: boolean;
};
export type LabAsset = { buffer: ArrayBuffer; id: number };
export type LabReport = {
  height?: number;
  velocity?: number;
  simTime?: number;
  meshes?: number;
  animations?: number;
  dimensions?: string;
  names?: string[];
};
type Props = {
  kind: LabId;
  config: LabConfig;
  time: number;
  reset: number;
  asset: LabAsset | null;
  onReport: (report: LabReport) => void;
};
function disposeGroup(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>(),
    geometries = new Set<THREE.BufferGeometry>();
  root.traverse((o) => {
    if (
      o instanceof THREE.Mesh ||
      o instanceof THREE.Line ||
      o instanceof THREE.Points
    ) {
      geometries.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
        materials.add(m),
      );
    }
  });
  materials.forEach((m) => {
    for (const value of Object.values(m))
      if (value instanceof THREE.Texture) textures.add(value);
    m.dispose();
  });
  textures.forEach((t) => {
    const image = t.source?.data;
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap)
      image.close();
    t.dispose();
  });
  geometries.forEach((g) => g.dispose());
}
export default function LabEngine(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef(props);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: element,
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      setError("此设备暂时无法启动 WebGL。参数计算仍可使用。");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x101c22);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
    const controls = new OrbitControls(camera, element);
    controls.enableDamping = false;
    controls.minDistance = 3;
    controls.maxDistance = 55;
    if (props.kind === "braking") {
      camera.position.set(12, 16, 24);
      controls.target.set(5, 0, 0);
    } else if (props.kind === "robot") {
      camera.position.set(0, 3, 12);
      controls.target.set(0, 0, 0);
    } else {
      camera.position.set(8, 6, 10);
      controls.target.set(0, 2, 0);
    }
    controls.update();
    controls.saveState();
    scene.add(new THREE.HemisphereLight(0xc8e8ef, 0x394549, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(5, 10, 8);
    scene.add(light);
    const ground = new THREE.GridHelper(
      props.kind === "braking" ? 40 : 18,
      props.kind === "braking" ? 40 : 18,
      0x50606c,
      0x233743,
    );
    ground.position.y = props.kind === "robot" ? -4.5 : 0;
    scene.add(ground);
    const objects = new THREE.Group();
    scene.add(objects);
    const material = (color: number) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.46,
        metalness: 0.24,
      });
    const mesh = (
      geo: THREE.BufferGeometry,
      color: number,
      x = 0,
      y = 0,
      z = 0,
    ) => {
      const m = new THREE.Mesh(geo, material(color));
      m.position.set(x, y, z);
      objects.add(m);
      return m;
    };
    let active = true,
      raf = 0,
      visible = true,
      reportedAt = 0,
      reset = props.reset,
      assetId = -1;
    let update: (time: number, config: LabConfig) => void = () => {};
    let cleanupPhysics: () => void = () => {};
    const errorText = (e: unknown) =>
      e instanceof Error ? e.message : "引擎载入失败";
    if (props.kind === "braking") {
      const road = mesh(
        new THREE.BoxGeometry(35, 0.08, 6),
        0x26343e,
        10,
        -0.05,
        0,
      );
      for (let i = -5; i < 26; i += 1.5)
        mesh(new THREE.BoxGeometry(0.7, 0.025, 0.06), 0x788990, i, 0.01, 0);
      const vehicle = (color: number, z: number) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.35, 0.36),
          material(color),
        );
        body.position.y = 0.25;
        g.add(body);
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.22, 0.32),
          material(0x7a929d),
        );
        cabin.position.set(-0.05, 0.52, 0);
        g.add(cabin);
        objects.add(g);
        g.position.z = z;
        return g;
      };
      const car = vehicle(0xa2e4bb, 1.5),
        reference = vehicle(0xe9a16e, -1.5),
        obstacle = mesh(
          new THREE.BoxGeometry(0.16, 1.1, 5.5),
          0xb26464,
          0,
          0.55,
          0,
        );
      update = (time, c) => {
        const a = brakeFrame(c, time),
          b = brakeFrame({ ...c, delay: c.delay + 0.8 }, time);
        car.position.x = a.position * 0.14 - 0.35;
        reference.position.x = b.position * 0.14 - 0.35;
        obstacle.position.x = c.distance * 0.14 + 0.08;
        road.visible = true;
      };
    } else if (props.kind === "robot") {
      const l1 = mesh(new THREE.BoxGeometry(1, 0.22, 0.28), 0xa2e4bb),
        l2 = mesh(new THREE.BoxGeometry(1, 0.19, 0.24), 0x71b9d0);
      const joint = mesh(new THREE.SphereGeometry(0.19, 20, 12), 0xc9e1e1),
        tip = mesh(new THREE.SphereGeometry(0.12, 16, 12), 0xefffd6),
        target = mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 32), 0xf4ad73);
      mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.35, 24),
        0x566a77,
        0,
        0,
        0,
      ).rotation.x = Math.PI / 2;
      for (const r of [0.6, 4.2]) {
        const ring = mesh(new THREE.TorusGeometry(r, 0.012, 4, 100), 0x365764);
        ring.position.z = -0.25;
      }
      const setLink = (
        m: THREE.Mesh,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
      ) => {
        m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
        m.scale.x = Math.hypot(x2 - x1, y2 - y1);
        m.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      };
      update = (_, c) => {
        const f = forwardKinematics(c.shoulder, c.elbow);
        setLink(l1, 0, 0, f.joint.x, f.joint.y);
        setLink(l2, f.joint.x, f.joint.y, f.tip.x, f.tip.y);
        joint.position.set(f.joint.x, f.joint.y, 0);
        tip.position.set(f.tip.x, f.tip.y, 0);
        target.position.set(c.targetX, c.targetY, 0.1);
      };
    } else if (props.kind === "physics") {
      const ball = mesh(
        new THREE.SphereGeometry(0.35, 32, 20),
        0xa2e4bb,
        0,
        props.config.height,
        0,
      );
      mesh(new THREE.BoxGeometry(12, 0.2, 12), 0x22353f, 0, -0.1, 0);
      void loadPhysics()
        .then((RAPIER) => {
          if (!active) return;
          let world: InstanceType<typeof RAPIER.World>,
            body: ReturnType<
              InstanceType<typeof RAPIER.World>["createRigidBody"]
            >,
            simTime = 0,
            physicsReset = -1;
          const create = (c: LabConfig) => {
            world?.free();
            const created = createDropWorld(RAPIER, c);
            world = created.world;
            body = created.body;
            simTime = 0;
          };
          create(latest.current.config);
          cleanupPhysics = () => {
            world.free();
          };
          update = (time, c) => {
            if (
              physicsReset !== latest.current.reset ||
              time < simTime - 1 / 60
            ) {
              create(c);
              physicsReset = latest.current.reset;
            }
            let steps = 0;
            while (simTime + 1 / 60 <= time + 1e-8 && steps++ < 12) {
              world.step();
              simTime += 1 / 60;
            }
            const pos = body.translation(),
              rotation = body.rotation();
            ball.position.set(pos.x, pos.y, pos.z);
            ball.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            if (performance.now() - reportedAt > 120) {
              reportedAt = performance.now();
              latest.current.onReport({
                height: pos.y,
                velocity: body.linvel().y,
                simTime,
              });
            }
          };
        })
        .catch((e) => {
          if (active) setError(`物理引擎：${errorText(e)}`);
        });
    } else {
      let model: THREE.Object3D | null = null,
        mixer: THREE.AnimationMixer | null = null,
        version = 0;
      const builtIn = () => {
        const g = new THREE.Group();
        const box = new THREE.Mesh(
          new THREE.TorusKnotGeometry(1.25, 0.32, 128, 20),
          material(0xa2e4bb),
        );
        g.add(box);
        return g;
      };
      const install = (
        root: THREE.Object3D,
        animations: THREE.AnimationClip[],
      ) => {
        if (model) {
          if (mixer) {
            mixer.stopAllAction();
            mixer.uncacheRoot(mixer.getRoot());
          }
          disposeGroup(model);
          objects.remove(model);
        }
        model = root;
        const bounds = new THREE.Box3().setFromObject(root),
          size = bounds.getSize(new THREE.Vector3()),
          center = bounds.getCenter(new THREE.Vector3());
        const scale = 4 / Math.max(size.x, size.y, size.z, 0.001);
        const holder = new THREE.Group();
        const centered = new THREE.Group();
        centered.position.copy(center).multiplyScalar(-1);
        centered.add(root);
        holder.add(centered);
        holder.scale.setScalar(scale);
        holder.position.y = 2.4;
        model = holder;
        objects.add(holder);
        mixer = animations.length ? new THREE.AnimationMixer(root) : null;
        if (mixer) mixer.clipAction(animations[0]).play();
        let meshes = 0;
        const names: string[] = [];
        root.traverse((o) => {
          if (o instanceof THREE.Mesh) meshes++;
          if (names.length < 80) names.push(o.name || o.type);
        });
        latest.current.onReport({
          meshes,
          animations: animations.length,
          dimensions: [size.x, size.y, size.z]
            .map((v) => v.toFixed(3))
            .join(" × "),
          names,
        });
      };
      const load = async (asset: LabAsset | null) => {
        const own = ++version;
        setError("");
        if (!asset) {
          install(builtIn(), []);
          return;
        }
        try {
          const view = new DataView(asset.buffer);
          if (view.getUint32(16, true) !== 0x4e4f534a)
            throw new Error("GLB 缺少 JSON 描述块。");
          const length = view.getUint32(12, true);
          if (length > asset.buffer.byteLength - 20)
            throw new Error("GLB 描述长度不正确。");
          const data = JSON.parse(
            new TextDecoder().decode(new Uint8Array(asset.buffer, 20, length)),
          );
          for (const item of [...(data.buffers ?? []), ...(data.images ?? [])])
            if (item.uri && !item.uri.startsWith("data:"))
              throw new Error("仅支持自包含 GLB；请先打包外部纹理和缓冲区。");
          const manager = new THREE.LoadingManager();
          manager.setURLModifier((url) => {
            if (!url.startsWith("blob:") && !url.startsWith("data:"))
              throw new Error("模型包含外部资源，已停止加载。");
            return url;
          });
          const gltf = await new GLTFLoader(manager).parseAsync(
            asset.buffer,
            "",
          );
          if (!active || own !== version) {
            disposeGroup(gltf.scene);
            return;
          }
          install(gltf.scene, gltf.animations);
        } catch (e) {
          if (active && own === version)
            setError(`模型加载失败：${errorText(e)}`);
        }
      };
      update = (time, c) => {
        const asset = latest.current.asset;
        const nextId = asset?.id ?? 0;
        if (nextId !== assetId) {
          assetId = nextId;
          void load(asset);
        }
        if (model) {
          model.traverse((o) => {
            if (o instanceof THREE.Mesh)
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(
                (m) => {
                  if ("wireframe" in m) m.wireframe = c.wireframe;
                },
              );
          });
          if (mixer) mixer.setTime(time);
          else model.rotation.y = time * 0.25;
        }
      };
      cleanupPhysics = () => {
        version++;
        mixer?.stopAllAction();
      };
    }
    const resize = () => {
      const parent = element.parentElement!;
      const w = parent.clientWidth,
        h = parent.clientHeight;
      renderer.setSize(Math.max(w, 1), Math.max(h, 1), false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element.parentElement!);
    resize();
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(element);
    const key = (e: KeyboardEvent) => {
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "=",
          "-",
        ].includes(e.key)
      )
        return;
      e.preventDefault();
      const offset = camera.position.clone().sub(controls.target),
        s = new THREE.Spherical().setFromVector3(offset);
      if (e.key === "ArrowLeft") s.theta -= 0.12;
      if (e.key === "ArrowRight") s.theta += 0.12;
      if (e.key === "ArrowUp") s.phi -= 0.12;
      if (e.key === "ArrowDown") s.phi += 0.12;
      if (e.key === "+" || e.key === "=") s.radius -= 0.5;
      if (e.key === "-") s.radius += 0.5;
      s.phi = THREE.MathUtils.clamp(s.phi, 0.1, Math.PI - 0.1);
      s.radius = THREE.MathUtils.clamp(s.radius, 3, 55);
      camera.position.copy(controls.target).add(offset.setFromSpherical(s));
      controls.update();
    };
    element.addEventListener("keydown", key);
    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      setError("WebGL 上下文已丢失，请重新加载引擎。");
    };
    element.addEventListener("webglcontextlost", lost);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (reset !== latest.current.reset) {
        reset = latest.current.reset;
        controls.reset();
      }
      update(latest.current.time, latest.current.config);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      element.removeEventListener("keydown", key);
      element.removeEventListener("webglcontextlost", lost);
      controls.dispose();
      cleanupPhysics();
      disposeGroup(scene);
      renderer.dispose();
    };
  }, [props.kind, retry]);
  return (
    <>
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="3D 实验视图。拖动旋转，滚轮或双指缩放；键盘方向键旋转，加减键缩放。"
      />
      {error && (
        <div className="lab-engine-error" role="alert">
          <p>{error}</p>
          <button
            className="lab-button"
            onClick={() => {
              setError("");
              setRetry((n) => n + 1);
            }}
          >
            重新加载引擎
          </button>
        </div>
      )}
    </>
  );
}
