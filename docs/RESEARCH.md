# Research: what is worth visualizing, and with which engine

Last revised September 2026. Sources are the projects' own documentation and release notes; where a claim depends on a moving target (release versions, benchmarks) the catalog links to the primary page rather than restating numbers.

## 1. Where visualization creates real-world value

The scenes were chosen against three tests: someone has this question today, the answer is hard to read from raw numbers, and a browser can either compute it or replay a real engine's result. Domains that pass all three:

| Domain | Who has the question | What they cannot see without a view | Why it matters |
| --- | --- | --- | --- |
| Autonomous driving | Perception, planning, data and safety teams | Sensor geometry, timing, planner intent, scenario outcomes | Every disengagement review, every regression run and every labeling job is a visualization task |
| Embodied AI & robotics | Manipulation, locomotion and teleoperation teams | Reachability, balance, episode quality, sim-to-real gaps | Data collection and policy debugging are bottlenecks; both are visual |
| Simulation & world models | Simulation engineers, ML researchers | Whether a generated future is causally faithful to the action | Generative world models (Cosmos, GAIA-2, OmniDreams) are judged on action faithfulness, not image quality |
| 3D, twins & neural rendering | Product, showroom, city and facility owners | Fit, configuration, streaming scale | Gaussian splats now stream 100M+ splat worlds to phones; glTF gained a splat extension in 2026 |
| AI systems | ML and agent engineers | Attention, embeddings, traces, training divergence | Observability is the difference between a demo and a product |
| Finance & markets | Traders, risk and research | Liquidity, impact, skew, flows, exposure | Microstructure and derivatives are inherently spatial (price × time × size) |
| Science & life | Clinicians, educators, researchers | Anatomy layers, molecular structure, volumes, fields | Established viewers exist; integration and clarity are the gap |
| Industry & infrastructure | Supply chain, grid, aerospace and factory operators | Dependency paths, congestion, coverage, queues | Single points of failure are invisible in tables |

## 2. Engine landscape (2026)

### Robotics and driving data
- **Foxglove** — multi-modal timeline viewer with an SDK, WebSocket live protocol and MCAP as the storage format. Native backend for LeRobot 0.6 (`--display_mode=foxglove`), and an Isaac Sim extension that exposes cameras, IMUs, articulations and the TF tree. Best default for replay and live bridges.
- **Rerun** — Rust/egui viewer with Python/C++/Rust logging, embeddable web viewer. Excellent for code-driven, scripted inspection; less pluggable than Foxglove.
- **RViz** — the ROS 2 classic; still the reference for TF and marker semantics.
- **LeRobot dataset visualizer** — web app for browsing episodes: synchronized multi-camera video and action/state plots. The reference UX for teleop QA.
- **urdf-loaders** — Three.js URDF import with joint manipulation; the shortest path to a robot inspector in a browser.

### Simulation
- **CARLA + ScenarioRunner** — OpenDRIVE/OpenSCENARIO closed-loop driving scenarios; the standard for policy regression.
- **SUMO** — microscopic traffic; combine with deck.gl trips layers for city-scale playback.
- **Isaac Sim / Isaac Lab** — photoreal USD stages, synthetic perception data, GPU-parallel RL for humanoids and quadrupeds.
- **MuJoCo (+ MJX / Warp)** — default for manipulation research and VLA evaluation; batch rendering for RL.
- **Genesis**, **Newton** — differentiable / multi-physics (rigid, cloth, fluid) with GPU batch renderers.
- **Rapier** — Rust rigid-body engine compiled to WASM; the only one on this list that runs fully in the browser, which is why the native physics lab uses it.

### World models
- **NVIDIA Cosmos** — open-weight world foundation models; Cosmos-Drive-Dreams and OmniDreams specialize them to driving with action conditioning and closed-loop use.
- **Wayve GAIA-2** — multi-view controllable driving world model.
- Research direction to watch: action faithfulness metrics (does the generated future reflect the intervention?) and occupancy-space world models for multi-kilometer rollouts.

### 3D and neural rendering
- **Three.js** — WebGL2 and WebGPU renderers; r186 adds a native `GaussianSplatMesh` written in TSL that loads PLY/SPLAT/SPZ/KSPLAT and the glTF `KHR_gaussian_splatting` extension (Khronos, February 2026).
- **Spark 2.0 (World Labs)** — Three.js-integrated splat renderer with a streamable level-of-detail system for 100M+ splat worlds on mobile and VR.
- **GaussianSplats3D** — earlier Three.js splat renderer, still widely used.
- **OpenUSD** — scene composition (layers, variants, references); the format Isaac Sim and Omniverse speak.
- **CesiumJS + 3D Tiles** — geodetic city-scale streaming.
- **deck.gl + MapLibre** — GPU layers for millions of points, trips and hexbins.
- **That Open Engine** — IFC/BIM in Three.js.

### AI observability
- **Netron** (ONNX/SafeTensors graphs), **BertViz** (attention), **TensorBoard Embedding Projector** / **umap-js** (embeddings), **Arize Phoenix** on OpenTelemetry (agent traces), **uPlot** (dense time series).

### Markets and science
- **TradingView Lightweight Charts** (note its attribution requirement), **Plotly.js** (surfaces), **D3**, **globe.gl**.
- **Mol\*** (molecules), **VTK.js** and **Cornerstone3D** (volumes), **Z-Anatomy** (open anatomy model), **earth** (wind particle advection).

## 3. Opportunities beyond the current catalog

Ranked by demand signal and feasibility in a browser:

1. **Occupancy and open-vocabulary 3D grids** — the representation most driving stacks are converging on; almost no good interactive viewer exists.
2. **Action-faithfulness diff for world models** — side-by-side generated vs recorded futures with divergence metrics; the evaluation everyone needs and few tools provide.
3. **Teleop episode QA at scale** — thumbnails, outlier detection on action traces, one-click reject; LeRobot datasets are growing faster than review tools.
4. **Gaussian-splat product configurators** — photoreal captures with swappable parts, replacing rendered CGI for vehicles and consumer products.
5. **Low-altitude corridor planning** — regulators and operators need deconfliction views over terrain; Cesium plus a corridor planner is enough for a first version.
6. **Liquidation and leverage heatmaps** — traders read these daily; an honest, reproducible implementation is rare.
7. **Supply-chain dependency graphs with failure propagation** — industrial policy and procurement teams ask "who else breaks if this node breaks?".
8. **Agent trace explorer** — loops, retries and cost per step for LLM agents; the observability layer is still immature.
9. **Training-run comparison with early divergence detection** — cheap to build with uPlot and Parquet, valuable for every ML team.
10. **Medical volume rendering with transfer functions** — education and pre-clinical use; Cornerstone3D makes it tractable.

## 4. Principles that shaped the catalog

- Prefer a smaller, honest native lab over a large claimed integration. Status is shown on every entry.
- Reuse real engines by contract (MCAP in, telemetry out) rather than re-implementing them.
- Every scene must answer one question; if a scene needs two paragraphs to justify, it is two scenes.
- Synthetic data is fine for teaching mechanisms; it must be labeled and must never be presented as measured.
