import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import RAPIER from "@dimforge/rapier3d-compat";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Box3, Vector3 } from "three";
function loadModule(file) {
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const sandbox = { exports: {} };
  vm.runInNewContext(outputText, sandbox);
  return sandbox.exports;
}
const math = loadModule("app/platform/math.ts");
const approximate = (actual, expected, tolerance = 1e-8) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
const cfg = { speed: 72, distance: 100, delay: 0.5, friction: 0.8 };
approximate(math.stoppingDistance(cfg), 10 + 400 / (2 * 0.8 * 9.81));
approximate(
  math.stoppingDistance({ ...cfg, delay: 1.3 }) - math.stoppingDistance(cfg),
  16,
);
assert.equal(math.brakeFrame(cfg, 12).stopped, true);
assert.equal(math.brakeFrame(cfg, 12).collision, false);
assert.equal(math.brakeFrame({ ...cfg, distance: 5 }, 12).collision, true);
approximate(math.collisionSpeed({ ...cfg, distance: 5 }), 72);
approximate(math.collisionSpeed(cfg), 0);
approximate(math.brakeFrame(cfg, 0).position, 0);
for (const target of [
  [2.4, 2.2],
  [4.2, 0],
  [-3, -1],
  [0, 0.6],
  [0, 4.2],
]) {
  const angles = math.inverseKinematics(...target);
  assert.ok(angles);
  assert.ok(angles.shoulder >= -180 && angles.shoulder <= 180);
  const { tip } = math.forwardKinematics(angles.shoulder, angles.elbow);
  approximate(tip.x, target[0], 1e-6);
  approximate(tip.y, target[1], 1e-6);
}
assert.equal(math.inverseKinematics(0, 0), null);
assert.equal(math.inverseKinematics(5, 0), null);
approximate(math.forwardKinematics(0, 0).tip.x, 4.2);
const catalog = loadModule("app/platform/catalog.ts");
assert.equal(catalog.scenes.length, 24);
assert.equal(catalog.domains.length, 6);
assert.equal(catalog.labs.length, 4);
assert.equal(new Set(catalog.scenes.map((s) => s.id)).size, 24);
for (const scene of catalog.scenes) {
  assert.ok(scene.input && scene.output && scene.problem && scene.engine);
  assert.equal(new URL(scene.source).protocol, "https:");
}
await RAPIER.init();
const { createDropWorld } = loadModule("app/platform/physics.ts");
function drop(restitution) {
  const { world, body } = createDropWorld(RAPIER, {
    height: 4,
    gravity: 9.81,
    restitution,
  });
  let touched = false,
    peak = 0.35;
  for (let i = 0; i < 720; i++) {
    world.step();
    const y = body.translation().y;
    if (y < 0.4) touched = true;
    if (touched) peak = Math.max(peak, y);
    if (i === 11) approximate(y, 4 - 0.5 * 9.81 * 0.2 * 0.2, 0.04);
    assert.ok(y > 0.28, "Ball penetrated the ground");
  }
  const final = body.translation().y;
  world.free();
  return { peak, final };
}
const inelastic = drop(0),
  elastic = drop(0.8);
approximate(inelastic.final, 0.35, 0.025);
assert.ok(
  elastic.peak > inelastic.peak + 1,
  "Restitution must affect actual physics",
);
// Parse an actual self-contained GLB through the same Three.js loader, without textures or a DOM.
const positions = new Float32Array([0, 0, 0, 2, 0, 0, 0, 3, 0]);
const json = {
  asset: { version: "2.0" },
  buffers: [{ byteLength: positions.byteLength }],
  bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.byteLength }],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 3,
      type: "VEC3",
      min: [0, 0, 0],
      max: [2, 3, 0],
    },
  ],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  nodes: [{ mesh: 0, name: "test-triangle" }],
  scenes: [{ nodes: [0] }],
  scene: 0,
};
let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
const length = Math.ceil(jsonBytes.length / 4) * 4;
const buffer = new ArrayBuffer(12 + 8 + length + 8 + positions.byteLength);
const bytes = new Uint8Array(buffer),
  view = new DataView(buffer);
view.setUint32(0, 0x46546c67, true);
view.setUint32(4, 2, true);
view.setUint32(8, buffer.byteLength, true);
view.setUint32(12, length, true);
view.setUint32(16, 0x4e4f534a, true);
bytes.fill(32, 20, 20 + length);
bytes.set(jsonBytes, 20);
view.setUint32(20 + length, positions.byteLength, true);
view.setUint32(24 + length, 0x004e4942, true);
bytes.set(new Uint8Array(positions.buffer), 28 + length);
assert.equal(math.isSupportedGlb(buffer), true);
assert.equal(math.isSupportedGlb(new ArrayBuffer(10)), false);
const gltf = await new GLTFLoader().parseAsync(buffer, "");
const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3());
approximate(size.x, 2);
approximate(size.y, 3);
assert.equal(gltf.scene.children[0].name, "test-triangle");
gltf.scene.traverse((o) => {
  o.geometry?.dispose();
  if (o.material) {
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
      m.dispose(),
    );
  }
});
const home = fs.readFileSync("app/page.tsx", "utf8");
assert.ok(!/portfolio|I build|My work|个人简介|个人履历|工作年限/i.test(home));
console.log(
  "Passed: braking analytics, FK/IK boundaries, 24-scene catalog, actual Rapier contact/restitution, actual GLB parsing, platform-first content.",
);
console.log(
  JSON.stringify(
    {
      rapierRestitutionPeaks: {
        zero: inelastic.peak,
        pointEight: elastic.peak,
      },
    },
    null,
    2,
  ),
);
