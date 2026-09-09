# OMNIVIS — Visualize everything

An open visualization platform: interactive labs for autonomous driving, embodied AI, simulation and world models, 3D digital twins, AI systems, markets, science and infrastructure. Each scene answers one question, runs in the browser, shows its assumptions and exports its evidence.

There is no personal profile, employer attribution or contact information in this repository. The platform is judged on its scenes.

## Run

```sh
npm ci
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Native labs (`/labs/<id>`)

| Lab | Domain | Engine |
| --- | --- | --- |
| `lidar` | Driving | Ray-cast LiDAR sweep, ground segmentation, 3D boxes, BEV occupancy inset |
| `planner` | Driving | Frenet lattice trajectory sampling with collision/jerk/deviation cost, cut-in scenario |
| `braking` | Driving | Analytic braking distance, two reaction delays side by side |
| `arm` | Robotics | Two-link inverse kinematics, reachable annulus, servoed joints |
| `gait` | Robotics | Kinematic humanoid gait, center of mass, support phase, joint plots |
| `swarm` | Robotics | 800-agent boids with spatial hash and obstacle field |
| `physics` | Simulation | Rapier WASM rigid bodies at a fixed 1/60 s step |
| `model` | 3D | Local GLB inspection: node tree, bounds, animation, wireframe, explode |
| `attention` | AI | Toy multi-head transformer attention with arcs and matrix |
| `orderbook` | Markets | Zero-intelligence limit order book with depth, trades and sweeps |

Keyboard: `space` play/pause, `r` restart. Every lab exports a JSON run with parameters, telemetry and assumptions.

## Catalog

`/#catalog` lists 46 scenes across 8 domains. Each entry states the question, inputs, outputs, the real engine that answers it (Foxglove, Rerun, CARLA, Isaac Sim, MuJoCo, Genesis, Cosmos, Spark, Cesium, deck.gl, Mol*, …) and its status: native lab, engine integration, or planned.

- [Research: value map, engine landscape, opportunities](docs/RESEARCH.md)
- [Roadmap: architecture, data contracts, phases, acceptance gates](docs/ROADMAP.md)
- `/stack` and `/methodology` in the app describe the build and the rules.

## Validate

```sh
node scripts/verify.mjs            # legacy geometry fixtures + privacy scan
node scripts/verify-platform.mjs   # catalog/registry integrity + privacy scan
npm run build
```

## Adding a scene

1. Add a record to `app/catalog/data.ts` (status `lab` with a `lab` id, or `engine` / `planned`).
2. For a native lab, add a `LabDef` in `app/labs/registry.ts` and an engine in `app/labs/engines/` that implements `EngineProps` from `app/labs/types.ts`.
3. Run the verification scripts.

## Geospatial archive

Earlier map-layer studies remain at `/examples`. Optional map SDK keys `NEXT_PUBLIC_AMAP_KEY` / `NEXT_PUBLIC_BAIDU_KEY` are read at build time; none are committed. Without keys those pages show clearly labeled synthetic studies.

## Data and attribution

Synthetic data is labeled synthetic. Rendering is not a claim of physical fidelity, safety validation, clinical accuracy or financial return. Engine links credit third-party technology; they do not claim it as this platform's work. Respect each engine's, dataset's and asset's license. Files opened in the model viewer stay on the device.
