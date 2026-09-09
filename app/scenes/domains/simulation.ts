import { c, lib, type SceneDef } from "../types";

export const simulation: SceneDef[] = [
  {
    id: "scenario", domain: "simulation", title: "Scenario editor & sweep", question: "Describe a cut-in as parameters, run it closed-loop, then sweep it against two software versions.", input: "Trigger distance, adversary speed, lateral rate, ego ACC parameters", output: "Closed-loop outcome, min gap, regression matrix",
    demos: [
      { id: "editor", title: "Scenario editor (closed-loop)", summary: "An OpenSCENARIO-style cut-in with a distance trigger; the ego runs an ACC policy with time headway and reacts to the adversary once it is in lane.", controls: [{ key: "trigger", label: "Cut-in trigger distance", type: "range", min: 5, max: 60, step: 1, unit: "m", default: 22 }, { key: "advGap", label: "Adversary start gap", type: "range", min: 20, max: 80, step: 2, unit: "m", default: 45 }, { key: "advSpeed", label: "Adversary speed", type: "range", min: 5, max: 30, step: 1, unit: "m/s", default: 14 }, { key: "lateralRate", label: "Lateral rate", type: "range", min: 0.3, max: 3, step: 0.1, unit: "m/s", default: 1.2 }, { key: "egoSpeed", label: "Ego speed", type: "range", min: 10, max: 35, step: 1, unit: "m/s", default: 22 }, { key: "egoDecel", label: "Ego max decel", type: "range", min: 2, max: 9, step: 0.5, unit: "m/s²", default: 5 }, { key: "headway", label: "Time headway", type: "range", min: 0.5, max: 3, step: 0.1, unit: "s", default: 1.5 }],
        legend: [{ color: c.ref, label: "Ego (ACC)" }, { color: c.live, label: "Adversary" }, { color: c.violet, label: "Lead" }, { color: c.bad, label: "Trigger line / collision" }],
        assumptions: "Point-mass longitudinal dynamics; the adversary is open-loop after the trigger. Real scenario runners (CARLA ScenarioRunner, esmini) add road networks and full vehicle models.", libs: [lib.three, lib.openscenario, lib.carla], load: () => import("../engines/simulation/ScenarioEditor") },
      { id: "sweep", title: "Parameter sweep / regression", summary: "The same scenario run headless for 144 (trigger × speed) combinations on two versions; the diff view highlights where version B regressed.", controls: [{ key: "view", label: "View", type: "select", options: [{ value: "both", label: "A and B" }, { value: "diff", label: "Diff (B − A)" }], default: "diff" }, { key: "decelA", label: "A · ego max decel", type: "range", min: 2, max: 9, step: 0.5, unit: "m/s²", default: 6 }, { key: "decelB", label: "B · ego max decel", type: "range", min: 2, max: 9, step: 0.5, unit: "m/s²", default: 4.5 }, { key: "headway", label: "Time headway", type: "range", min: 0.5, max: 3, step: 0.1, unit: "s", default: 1.5 }],
        legend: [{ color: c.bad, label: "Collision / regression" }, { color: c.ok, label: "Improvement" }, { color: c.live, label: "Large min gap" }],
        assumptions: "Each cell is a 15 s headless run; cells recompute on parameter change.", camera: "Static grid", libs: [lib.canvas, lib.carla], load: () => import("../engines/simulation/ParamSweep") },
    ],
  },
  {
    id: "physics", domain: "simulation", title: "Physics", question: "Rigid bodies with a real solver and a swarm with emergent flocking — the two kinds of many-body simulation.", input: "Gravity, restitution, body count; boid weights", output: "Stacked contacts, flock behavior",
    demos: [
      { id: "rigid", title: "Rigid bodies (Rapier)", summary: "Real Rapier WASM rigid-body solver at a fixed 1/60 s step: drop a stack, tune gravity and restitution.", controls: [{ key: "gravity", label: "Gravity", type: "range", min: 1, max: 20, step: 0.1, unit: "m/s²", default: 9.81 }, { key: "restitution", label: "Restitution", type: "range", min: 0, max: 1, step: 0.05, default: 0.65 }, { key: "height", label: "Drop height", type: "range", min: 1, max: 8, step: 0.1, unit: "m", default: 4 }, { key: "bodies", label: "Bodies", type: "range", min: 1, max: 40, step: 1, default: 12 }],
        legend: [{ color: c.live, label: "Dynamic body" }, { color: c.muted, label: "Ground" }],
        assumptions: "Simplified scene, not calibrated material data. Changing parameters restarts the world.", libs: [lib.rapier, lib.three], load: () => import("../engines/simulation/RigidBody") },
      { id: "swarm", title: "Swarm (boids)", summary: "Boids-style separation / alignment / cohesion at 60 Hz with a spatial hash and obstacle avoidance.", controls: [{ key: "count", label: "Agents", type: "range", min: 50, max: 800, step: 50, default: 400 }, { key: "radius", label: "Perception radius", type: "range", min: 1, max: 6, step: 0.1, unit: "m", default: 3 }, { key: "separation", label: "Separation", type: "range", min: 0, max: 3, step: 0.1, default: 1.4 }, { key: "alignment", label: "Alignment", type: "range", min: 0, max: 3, step: 0.1, default: 1 }, { key: "cohesion", label: "Cohesion", type: "range", min: 0, max: 3, step: 0.1, default: 0.8 }, { key: "obstacles", label: "Obstacles", type: "range", min: 0, max: 6, step: 1, default: 3 }],
        legend: [{ color: c.live, label: "Agent" }, { color: c.ref, label: "Obstacle" }],
        assumptions: "Agents are bounded in a 40 m box; obstacle avoidance is a repulsive field.", libs: [lib.three], load: () => import("../engines/simulation/Swarm") },
    ],
  },
  {
    id: "traffic", domain: "simulation", title: "Traffic", question: "Where do phantom jams come from, and does an actuated signal beat a fixed timer?", input: "Vehicle density, IDM parameters, arrival rate, controller", output: "Ring-road space–time diagram, intersection delay",
    demos: [
      { id: "ring", title: "Ring road (IDM + lane change)", summary: "Two-lane ring with the Intelligent Driver Model and MOBIL-style lane changes; raise density or perturb one car and watch the jam wave travel backwards in the space–time diagram.", controls: [{ key: "count", label: "Vehicles", type: "range", min: 10, max: 120, step: 2, default: 60 }, { key: "v0", label: "Desired speed", type: "range", min: 10, max: 35, step: 1, unit: "m/s", default: 28 }, { key: "T", label: "Time headway", type: "range", min: 0.6, max: 2.5, step: 0.1, unit: "s", default: 1.4 }, { key: "a", label: "Max accel", type: "range", min: 0.3, max: 2.5, step: 0.1, unit: "m/s²", default: 1 }, { key: "laneChange", label: "Lane changes", type: "toggle", default: true }, { key: "perturb", label: "Periodic perturbation", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Free flow" }, { color: c.ref, label: "Slow" }, { color: c.bad, label: "Jammed" }],
        assumptions: "600 m ring, IDM with s0 = 2 m, b = 2 m/s²; lane change is a simplified MOBIL criterion.", libs: [lib.canvas, lib.sumo], load: () => import("../engines/simulation/Traffic") },
      { id: "signals", title: "Signalized intersection", summary: "Four approaches with Poisson arrivals and a two-phase signal: fixed-time vs queue-actuated; delay per vehicle and queue lengths are measured.", controls: [{ key: "arrival", label: "Arrival rate", type: "range", min: 0.05, max: 0.9, step: 0.01, unit: "veh/s", default: 0.45 }, { key: "eastWestBias", label: "E–W demand ×", type: "range", min: 0.2, max: 3, step: 0.1, default: 1.6 }, { key: "green", label: "Fixed green", type: "range", min: 5, max: 60, step: 1, unit: "s", default: 20 }, { key: "actuated", label: "Queue-actuated", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Moving" }, { color: c.bad, label: "Queued" }, { color: c.ok, label: "Green" }],
        assumptions: "Single lane per approach, no turning movements, no yellow phase.", libs: [lib.canvas, lib.sumo], load: () => import("../engines/simulation/Signals") },
    ],
  },
  {
    id: "world-model", domain: "simulation", title: "World model", question: "How do generated futures drift from the recorded one as the horizon and temperature grow?", input: "Recorded frames, horizon, sampling temperature", output: "Recorded vs two generated rollouts, divergence curve",
    demos: [
      { id: "rollouts", title: "Recorded vs generated", summary: "A recorded clip next to two generated continuations (procedural stand-in for a video world model); divergence grows with horizon and temperature and the two samples disagree more at high T.", controls: [{ key: "horizon", label: "Rollout horizon", type: "range", min: 2, max: 16, step: 1, unit: "s", default: 6 }, { key: "temperature", label: "Sampling temperature", type: "range", min: 0.1, max: 2, step: 0.1, default: 0.8 }],
        legend: [{ color: c.live, label: "Recorded" }, { color: c.ref, label: "Generated" }, { color: c.bad, label: "Divergence" }],
        assumptions: "No model is run in the browser; the 'generated' frames are the recorded frame with horizon-scaled drift and hallucinated objects, which is exactly the failure mode a world-model monitor tracks.", camera: "Static panels", libs: [lib.canvas, lib.cosmos], load: () => import("../engines/simulation/WorldModel") },
    ],
  },
];
