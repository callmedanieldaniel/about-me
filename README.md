# Fieldwork — Visual Systems

A platform for understanding complex systems through interactive visualization, local experiments and traceable evidence. Focus areas are autonomous driving, robotics/ROS, simulation, 3D assets/digital twins, AI, and analytical tools. There is no personal profile or employment history.

## Run

```sh
npm ci
npm run dev
```

```sh
npm run build
npm start
```

## Available now

- Search/filter a catalog of 24 scenarios across six domains. Native tools and third-party engine references are clearly distinguished.
- **Braking:** compare reaction delays with an explicit analytic model, replay the result and export JSON.
- **Robot:** solve two-link planar FK/IK and inspect endpoint error and reachability.
- **Physics:** run a real Rapier WASM rigid-body experiment with adjustable gravity, drop height and restitution.
- **Model:** inspect local self-contained GLB files using Three.js, including mesh names, original bounds, wireframe and the first animation. Files are not uploaded. Maximum 30 MB; no external resources or separate compression decoder support.

Native routes: `/labs/braking`, `/labs/robot`, `/labs/physics`, `/labs/model`.

The catalog's remaining entries link to real official engines or demos, with intended inputs and outputs. They are not presented as integrated features. The roadmap does not imply that private datasets, GPU services or external applications have been imported.

## Research and implementation plan

- [Research, 24 scenarios, demand hypotheses, source links and additional opportunities](docs/PLATFORM_RESEARCH.zh-CN.md)
- [Platform architecture, data contracts, integration sequence and acceptance gates](docs/PLATFORM_PLAN.zh-CN.md)
- [Exact implementation status and verification limits](docs/IMPLEMENTATION_STATUS.md)

## Validation

```sh
node scripts/verify.mjs
node scripts/verify-platform.mjs
npm run build
```

## Existing examples

The original 11 project URLs remain available via `/examples`. Optional map SDK examples use build-time public browser keys `NEXT_PUBLIC_AMAP_KEY` and `NEXT_PUBLIC_BAIDU_KEY`; no keys are committed. When not configured, those legacy pages show explicitly labeled synthetic studies. The new labs do not need those services or credentials.

## Data and attribution

Inputs/results distinguish synthetic, generated and recorded data. Native experiments state their assumptions. Rendering is not a claim of physical fidelity, safety validation, clinical diagnosis or financial returns. The model viewer does not include branded vehicle assets. Official library links identify third-party technology, not authorship of this platform. Respect every engine, dataset and asset license individually.

Current source contains no personal branding, contacts or credentials. Repository ownership, previous Git history and old deployment caches are outside page-level anonymity; history is not rewritten. Local filenames and model node names shown during imports are user-provided and are not published or persisted by this platform.
