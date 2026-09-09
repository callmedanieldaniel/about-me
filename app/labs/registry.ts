import type { LabDef } from "./types";

const c = {
  live: "#5ee7ff",
  ref: "#ffb454",
  ok: "#7cf3a0",
  bad: "#ff5d73",
  muted: "#7e90a8",
  violet: "#b99cff",
};

export const labDefs: LabDef[] = [
  {
    id: "lidar",
    controls: [
      { key: "beams", label: "Laser channels", type: "range", min: 16, max: 128, step: 16, default: 64 },
      { key: "rate", label: "Sweep rate", type: "range", min: 5, max: 20, step: 1, unit: "Hz", default: 10 },
      { key: "actors", label: "Traffic actors", type: "range", min: 0, max: 12, step: 1, default: 6 },
      { key: "noise", label: "Range noise", type: "range", min: 0, max: 0.3, step: 0.01, unit: "m", default: 0.03 },
      { key: "ground", label: "Ground segmentation", type: "toggle", default: true },
      { key: "boxes", label: "3D detections", type: "toggle", default: true },
    ],
    legend: [
      { color: c.live, label: "Obstacle returns" },
      { color: c.muted, label: "Ground" },
      { color: c.ok, label: "Tracked box" },
      { color: c.ref, label: "Ego vehicle" },
    ],
    assumptions:
      "Synthetic urban scene ray-cast against boxes and a flat ground plane. Detections are ground-truth actors with jitter, not a trained network. The BEV inset rasterizes returns into a 0.5 m occupancy grid.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Lidar"),
  },
  {
    id: "planner",
    controls: [
      { key: "speed", label: "Ego speed", type: "range", min: 20, max: 110, step: 1, unit: "km/h", default: 70 },
      { key: "gap", label: "Cut-in gap", type: "range", min: 8, max: 60, step: 1, unit: "m", default: 22 },
      { key: "cutSpeed", label: "Cut-in vehicle speed", type: "range", min: 20, max: 100, step: 1, unit: "km/h", default: 55 },
      { key: "comfort", label: "Comfort weight", type: "range", min: 0, max: 1, step: 0.05, default: 0.5 },
      { key: "candidates", label: "Show all candidates", type: "toggle", default: true },
    ],
    legend: [
      { color: c.ok, label: "Selected trajectory" },
      { color: c.muted, label: "Rejected candidate" },
      { color: c.bad, label: "Collision risk" },
      { color: c.ref, label: "Cut-in vehicle" },
    ],
    assumptions:
      "Lattice planner samples lateral offsets × target speeds over a 4 s horizon in a Frenet frame along a straight road. Cost = collision + jerk + deviation from lane center and target speed. Actors follow constant-velocity prediction.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Planner"),
  },
  {
    id: "braking",
    controls: [
      { key: "speed", label: "Initial speed", type: "range", min: 10, max: 120, step: 1, unit: "km/h", default: 60 },
      { key: "distance", label: "Obstacle distance", type: "range", min: 10, max: 120, step: 1, unit: "m", default: 40 },
      { key: "delay", label: "Reaction delay", type: "range", min: 0, max: 2, step: 0.05, unit: "s", default: 0.5 },
      { key: "friction", label: "Friction μ", type: "range", min: 0.2, max: 1, step: 0.05, default: 0.7 },
    ],
    legend: [
      { color: c.live, label: "Current setup" },
      { color: c.ref, label: "Brakes 0.8 s later" },
      { color: c.bad, label: "Obstacle" },
    ],
    assumptions:
      "Stopping distance = v·t_delay + v²/(2μg). No slope, tyre temperature, sensor latency or full AEB decision logic. Not for real-world driving judgement.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Braking"),
  },
  {
    id: "arm",
    controls: [
      { key: "targetX", label: "Target X", type: "range", min: -4.5, max: 4.5, step: 0.05, unit: "m", default: 2.4 },
      { key: "targetY", label: "Target Y", type: "range", min: -1, max: 4.5, step: 0.05, unit: "m", default: 2.2 },
      { key: "elbowUp", label: "Elbow-up solution", type: "toggle", default: true },
      { key: "trace", label: "Trace end effector", type: "toggle", default: true },
    ],
    legend: [
      { color: c.live, label: "Links (solved pose)" },
      { color: c.ref, label: "Target" },
      { color: c.muted, label: "Reachable annulus" },
    ],
    assumptions:
      "Planar two-link arm, links 2.4 m and 1.8 m, analytic IK with two elbow branches. Joints are servoed toward the solution with a first-order lag. No dynamics or collision.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Arm"),
  },
  {
    id: "gait",
    controls: [
      { key: "cadence", label: "Cadence", type: "range", min: 60, max: 180, step: 2, unit: "spm", default: 110 },
      { key: "stride", label: "Stride length", type: "range", min: 0.3, max: 1.4, step: 0.02, unit: "m", default: 0.8 },
      { key: "kneeAmp", label: "Knee flexion", type: "range", min: 20, max: 80, step: 1, unit: "°", default: 55 },
      { key: "armSwing", label: "Arm swing", type: "range", min: 0, max: 40, step: 1, unit: "°", default: 22 },
      { key: "trace", label: "Trace center of mass", type: "toggle", default: true },
    ],
    legend: [
      { color: c.live, label: "Skeleton" },
      { color: c.ok, label: "Center of mass" },
      { color: c.ref, label: "Support foot" },
    ],
    assumptions:
      "Kinematic gait model driven by phase; joint angles follow sinusoidal templates fit to typical human walking. Center of mass is a mass-weighted average of segment midpoints. No ground reaction forces.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Gait"),
  },
  {
    id: "swarm",
    controls: [
      { key: "count", label: "Agents", type: "range", min: 50, max: 800, step: 50, default: 400 },
      { key: "radius", label: "Perception radius", type: "range", min: 1, max: 6, step: 0.1, unit: "m", default: 3 },
      { key: "separation", label: "Separation", type: "range", min: 0, max: 3, step: 0.1, default: 1.4 },
      { key: "alignment", label: "Alignment", type: "range", min: 0, max: 3, step: 0.1, default: 1 },
      { key: "cohesion", label: "Cohesion", type: "range", min: 0, max: 3, step: 0.1, default: 0.8 },
      { key: "obstacles", label: "Obstacles", type: "range", min: 0, max: 6, step: 1, default: 3 },
    ],
    legend: [
      { color: c.live, label: "Agent (colored by speed)" },
      { color: c.bad, label: "Obstacle" },
    ],
    assumptions:
      "Boids-style rules integrated at 60 Hz with a uniform spatial hash for O(n) neighbor lookup. Obstacle avoidance is a repulsive field. Agents are bounded in a 40 m box.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/Swarm"),
  },
  {
    id: "physics",
    controls: [
      { key: "gravity", label: "Gravity", type: "range", min: 1, max: 20, step: 0.1, unit: "m/s²", default: 9.81 },
      { key: "restitution", label: "Restitution", type: "range", min: 0, max: 1, step: 0.05, default: 0.65 },
      { key: "height", label: "Drop height", type: "range", min: 1, max: 8, step: 0.1, unit: "m", default: 4 },
      { key: "bodies", label: "Bodies", type: "range", min: 1, max: 40, step: 1, default: 12 },
    ],
    legend: [
      { color: c.live, label: "Rigid body" },
      { color: c.ok, label: "Height trace" },
    ],
    assumptions:
      "Real Rapier WASM rigid-body solver at a fixed 1/60 s step. Ground top at y = 0. Results are a simulation of a simplified scene, not calibrated material data. Changing parameters restarts the world.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/RigidBody"),
  },
  {
    id: "model",
    controls: [
      { key: "file", label: "Open a local .glb", type: "file", accept: ".glb,model/gltf-binary", hint: "Self-contained glTF 2.0 binary, ≤ 30 MB. Stays on your device." },
      { key: "wireframe", label: "Wireframe", type: "toggle", default: false },
      { key: "turntable", label: "Turntable", type: "toggle", default: true },
      { key: "exploded", label: "Explode parts", type: "range", min: 0, max: 1, step: 0.01, default: 0 },
    ],
    legend: [
      { color: c.live, label: "Loaded asset" },
      { color: c.muted, label: "Built-in placeholder vehicle" },
    ],
    assumptions:
      "Original units are interpreted as meters; the view is normalized for display. External textures, separate buffers and Draco/Meshopt compressed models are not supported. The placeholder is a procedural vehicle, not a branded model.",
    camera: "Drag to orbit · scroll to zoom",
    load: () => import("./engines/ModelViewer"),
  },
  {
    id: "attention",
    controls: [
      { key: "text", label: "Sentence", type: "text", default: "the robot picked up the red cube because it was closest", hint: "Up to 16 tokens" },
      { key: "head", label: "Attention head", type: "range", min: 0, max: 3, step: 1, default: 0 },
      { key: "temperature", label: "Softmax temperature", type: "range", min: 0.2, max: 3, step: 0.05, default: 1 },
      { key: "causal", label: "Causal mask", type: "toggle", default: true },
    ],
    legend: [
      { color: c.live, label: "Attention weight" },
      { color: c.violet, label: "Selected query token" },
    ],
    assumptions:
      "A deterministic toy transformer with 4 heads: token embeddings are hashed, queries/keys are fixed random projections seeded per head, and one head is positional. It illustrates the attention mechanism, not a trained language model.",
    camera: "Hover a token to focus its row",
    load: () => import("./engines/Attention"),
  },
  {
    id: "orderbook",
    controls: [
      { key: "arrival", label: "Order arrival rate", type: "range", min: 5, max: 120, step: 5, unit: "/s", default: 40 },
      { key: "volatility", label: "Volatility", type: "range", min: 0, max: 2, step: 0.05, default: 0.6 },
      { key: "aggression", label: "Market-order share", type: "range", min: 0, max: 0.6, step: 0.02, default: 0.2 },
      { key: "sweep", label: "Sweep size", type: "range", min: 1, max: 60, step: 1, default: 15 },
    ],
    legend: [
      { color: c.ok, label: "Bids" },
      { color: c.bad, label: "Asks" },
      { color: c.live, label: "Mid price" },
      { color: c.ref, label: "Trades" },
    ],
    assumptions:
      "Zero-intelligence limit-order-book simulator: limit orders arrive around the mid with an exponential distance, cancellations are random, market orders walk the book. Press “Sweep” to send a large market order and watch the impact and recovery. Not real market data.",
    camera: "Sweep buttons send a large order",
    load: () => import("./engines/OrderBook"),
  },
];

export const labDefOf = (id: string) => labDefs.find((l) => l.id === id);
