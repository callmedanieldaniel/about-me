export type DomainId =
  | "driving"
  | "embodied"
  | "simulation"
  | "spatial"
  | "ai"
  | "markets"
  | "science"
  | "industry";

export type Domain = {
  id: DomainId;
  name: string;
  short: string;
  question: string;
  hue: number;
};

export const domains: Domain[] = [
  {
    id: "driving",
    name: "Autonomous driving",
    short: "Driving",
    question: "What did the car see, and why did it act?",
    hue: 190,
  },
  {
    id: "embodied",
    name: "Embodied AI & robotics",
    short: "Robotics",
    question: "Can this body reach, balance and learn?",
    hue: 150,
  },
  {
    id: "simulation",
    name: "Simulation & world models",
    short: "Simulation",
    question: "What happens if we change one variable?",
    hue: 40,
  },
  {
    id: "spatial",
    name: "3D, digital twins & neural rendering",
    short: "3D",
    question: "How does this object or city actually look and fit?",
    hue: 275,
  },
  {
    id: "ai",
    name: "AI systems",
    short: "AI",
    question: "What is the model attending to, and where does it fail?",
    hue: 320,
  },
  {
    id: "markets",
    name: "Finance & markets",
    short: "Markets",
    question: "Where is liquidity, risk and flow right now?",
    hue: 60,
  },
  {
    id: "science",
    name: "Science & life",
    short: "Science",
    question: "What structure is hidden inside the body, the molecule or the atmosphere?",
    hue: 0,
  },
  {
    id: "industry",
    name: "Industry & infrastructure",
    short: "Industry",
    question: "Where is the bottleneck in the chain, the grid or the sky?",
    hue: 220,
  },
];

export type Status = "lab" | "engine" | "planned";

export type Scene = {
  id: string;
  title: string;
  domain: DomainId;
  problem: string;
  engine: string;
  source: string;
  sourceLabel: string;
  input: string;
  output: string;
  status: Status;
  lab?: string;
};

export const scenes: Scene[] = [
  // ─── Autonomous driving ───────────────────────────────────────────
  {
    id: "lidar-perception",
    title: "LiDAR perception & bird's-eye view",
    domain: "driving",
    problem:
      "Look at a rotating LiDAR sweep, ground segmentation and 3D boxes from the ego frame and from above, at the same instant.",
    engine: "Three.js instanced points + custom BEV rasterizer",
    source: "https://threejs.org/",
    sourceLabel: "Three.js",
    input: "Synthetic sweep, actor list, sensor rate",
    output: "Point cloud, BEV occupancy, tracked boxes",
    status: "lab",
    lab: "lidar",
  },
  {
    id: "motion-planning",
    title: "Trajectory sampling & cost map",
    domain: "driving",
    problem:
      "Watch a cut-in unfold, see every candidate trajectory the planner scored, and why the winning one was chosen.",
    engine: "Frenet-frame lattice planner (in-browser)",
    source: "https://github.com/AtsushiSakai/PythonRobotics",
    sourceLabel: "PythonRobotics reference",
    input: "Speed, cut-in gap, comfort weight",
    output: "Ranked trajectories, TTC, chosen path",
    status: "lab",
    lab: "planner",
  },
  {
    id: "braking",
    title: "Braking distance",
    domain: "driving",
    problem:
      "Brake 0.8 s late and see exactly how much farther the vehicle travels. Compare speed, friction and reaction delay.",
    engine: "Three.js + analytic kinematics",
    source: "https://threejs.org/",
    sourceLabel: "Three.js",
    input: "Speed, obstacle distance, delay, μ",
    output: "Stopping distance, impact speed, two trajectories",
    status: "lab",
    lab: "braking",
  },
  {
    id: "ros-replay",
    title: "ROS / MCAP multi-sensor replay",
    domain: "driving",
    problem:
      "Scrub point clouds, cameras, TF and control signals on one timeline and find the frame where it went wrong.",
    engine: "Foxglove SDK or Rerun web viewer + MCAP",
    source: "https://foxglove.dev/",
    sourceLabel: "Foxglove",
    input: "MCAP / rosbag2, images, TF tree",
    output: "Synchronized replay, bookmarks, clips",
    status: "engine",
  },
  {
    id: "calibration",
    title: "Sensor calibration diagnostics",
    domain: "driving",
    problem:
      "Separate time offset from extrinsic error from model misdetection by projecting LiDAR into the camera and measuring residuals.",
    engine: "Three.js + OpenCV.js + Rerun",
    source: "https://rerun.io/",
    sourceLabel: "Rerun",
    input: "Intrinsics, extrinsics, point cloud, image",
    output: "Overlay, residual heatmap, before/after",
    status: "engine",
  },
  {
    id: "scenario-regression",
    title: "Closed-loop scenario regression",
    domain: "driving",
    problem:
      "Replay cut-ins, occlusions and jaywalking against two policy versions in the same scenario file.",
    engine: "CARLA + ScenarioRunner / OpenSCENARIO",
    source: "https://carla.org/",
    sourceLabel: "CARLA",
    input: "OpenDRIVE, OpenSCENARIO, seed",
    output: "Collision, TTC, trajectory diff",
    status: "engine",
  },
  {
    id: "occupancy",
    title: "Occupancy & open-vocabulary 3D grid",
    domain: "driving",
    problem:
      "Render voxel occupancy predictions with semantics and flow so you can see what the network thinks is free space.",
    engine: "Three.js instanced voxels + nuScenes/Occ3D",
    source: "https://www.nuscenes.org/",
    sourceLabel: "nuScenes",
    input: "Occ tensor (H×W×Z×C), flow",
    output: "Voxel scene, semantic legend, time scrub",
    status: "planned",
  },
  {
    id: "annotation",
    title: "3D annotation workbench",
    domain: "driving",
    problem:
      "Draw and refine cuboids across frames with tracking propagation, camera projection and QA overlays.",
    engine: "Three.js + Xtreme1 / CVAT reference",
    source: "https://github.com/xtreme1-io/xtreme1",
    sourceLabel: "Xtreme1",
    input: "Point clouds, images, prior labels",
    output: "Labels, propagation, QA metrics",
    status: "planned",
  },

  // ─── Embodied AI & robotics ──────────────────────────────────────
  {
    id: "arm-kinematics",
    title: "Manipulator reach & inverse kinematics",
    domain: "embodied",
    problem:
      "Move a target and watch the arm solve joint angles. See the reachable annulus and the endpoint error.",
    engine: "Three.js + analytic 2-link IK",
    source: "https://threejs.org/",
    sourceLabel: "Three.js",
    input: "Joint angles, target position",
    output: "Pose, error, reachability",
    status: "lab",
    lab: "arm",
  },
  {
    id: "humanoid-gait",
    title: "Humanoid gait & center of mass",
    domain: "embodied",
    problem:
      "Animate a walking skeleton, track the center of mass against the support polygon and read joint angle curves.",
    engine: "Three.js skeleton + gait phase model",
    source: "https://mujoco.readthedocs.io/",
    sourceLabel: "MuJoCo reference",
    input: "Cadence, stride, hip/knee amplitude",
    output: "CoM trace, support phase, joint plots",
    status: "lab",
    lab: "gait",
  },
  {
    id: "drone-swarm",
    title: "Swarm coordination",
    domain: "embodied",
    problem:
      "Run 400 agents with separation, alignment and cohesion in a spatial hash and see how the flock reorganizes around obstacles.",
    engine: "Three.js instanced meshes + spatial hash",
    source: "https://threejs.org/",
    sourceLabel: "Three.js",
    input: "Agent count, perception radius, weights",
    output: "Flock topology, neighbor graph, density",
    status: "lab",
    lab: "swarm",
  },
  {
    id: "lerobot-episodes",
    title: "Teleop episode review",
    domain: "embodied",
    problem:
      "Scrub a LeRobot episode: synchronized multi-camera video, joint states and actions on one timeline.",
    engine: "LeRobot dataset visualizer / Foxglove",
    source: "https://github.com/huggingface/lerobot-dataset-visualizer",
    sourceLabel: "LeRobot visualizer",
    input: "LeRobot v2 dataset",
    output: "Episode player, action plots, QA flags",
    status: "engine",
  },
  {
    id: "urdf",
    title: "URDF / MJCF robot inspector",
    domain: "embodied",
    problem:
      "Load a robot description, drag joints through their limits and inspect collision bodies and the TF tree.",
    engine: "urdf-loaders (Three.js)",
    source: "https://github.com/gkjohnson/urdf-loaders",
    sourceLabel: "urdf-loaders",
    input: "URDF + meshes",
    output: "Articulated model, joint sliders, TF",
    status: "engine",
  },
  {
    id: "rl-training",
    title: "RL policy training monitor",
    domain: "embodied",
    problem:
      "Watch thousands of parallel environments train a locomotion policy and correlate reward curves with rendered rollouts.",
    engine: "Isaac Lab / MuJoCo MJX + Weights & Biases",
    source: "https://isaac-sim.github.io/IsaacLab/",
    sourceLabel: "Isaac Lab",
    input: "Rollouts, reward terms, checkpoints",
    output: "Reward decomposition, rollout grid",
    status: "planned",
  },

  // ─── Simulation & world models ───────────────────────────────────
  {
    id: "rigid-body",
    title: "Rigid-body physics sandbox",
    domain: "simulation",
    problem:
      "Drop objects with real contact solving. Change gravity and restitution and compare bounce peaks.",
    engine: "Rapier WASM + Three.js",
    source: "https://rapier.rs/",
    sourceLabel: "Rapier",
    input: "Gravity, restitution, drop height",
    output: "Height and velocity traces, settle time",
    status: "lab",
    lab: "physics",
  },
  {
    id: "world-model-rollout",
    title: "Generative world-model rollouts",
    domain: "simulation",
    problem:
      "Compare generated futures from a driving world model against the recorded future for the same past frames and actions.",
    engine: "NVIDIA Cosmos / Wayve GAIA-2 outputs + video grid",
    source: "https://github.com/nvidia-cosmos",
    sourceLabel: "Cosmos",
    input: "Context frames, action sequence",
    output: "Multi-sample rollout grid, divergence metrics",
    status: "engine",
  },
  {
    id: "traffic-sim",
    title: "Microscopic traffic simulation",
    domain: "simulation",
    problem:
      "Run a SUMO network, inject a bottleneck and watch queues form on the map in real time.",
    engine: "SUMO + deck.gl trips layer",
    source: "https://eclipse.dev/sumo/",
    sourceLabel: "SUMO",
    input: "Network, demand, signal plans",
    output: "Vehicle traces, queue length, throughput",
    status: "engine",
  },
  {
    id: "isaac-sim",
    title: "Photoreal robot simulation twin",
    domain: "simulation",
    problem:
      "Stream an Isaac Sim stage—cameras, IMUs, articulations—into a browser viewer for the robot's-eye view.",
    engine: "Isaac Sim + Foxglove extension",
    source: "https://foxglove.dev/blog/realtime-isaac-sim-data-visualization-using-foxglove",
    sourceLabel: "Isaac Sim ↔ Foxglove",
    input: "USD stage, sensor graph",
    output: "Synchronized sensor panels, TF tree",
    status: "engine",
  },
  {
    id: "genesis",
    title: "Differentiable physics playground",
    domain: "simulation",
    problem:
      "Simulate cloth, fluids and rigid bodies together and compare solver settings side by side.",
    engine: "Genesis / MuJoCo Warp",
    source: "https://genesis-world.readthedocs.io/",
    sourceLabel: "Genesis",
    input: "Scene description, solver params",
    output: "Rendered rollout, energy plots",
    status: "planned",
  },
  {
    id: "monte-carlo",
    title: "Monte Carlo scenario sweeps",
    domain: "simulation",
    problem:
      "Sample thousands of parameter combinations and see the failure surface, not just the average.",
    engine: "Web Workers + WebGPU compute + Plotly",
    source: "https://plotly.com/javascript/",
    sourceLabel: "Plotly.js",
    input: "Parameter ranges, model",
    output: "Failure heatmap, sensitivity ranking",
    status: "planned",
  },

  // ─── 3D, digital twins & neural rendering ────────────────────────
  {
    id: "model-viewer",
    title: "Vehicle & product model viewer",
    domain: "spatial",
    problem:
      "Inspect a GLB locally: mesh hierarchy, bounds, animations and wireframe. Files never leave the browser.",
    engine: "Three.js GLTFLoader",
    source: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader",
    sourceLabel: "GLTFLoader",
    input: "Self-contained .glb ≤ 30 MB",
    output: "Node tree, dimensions, turntable",
    status: "lab",
    lab: "model",
  },
  {
    id: "gaussian-splats",
    title: "Gaussian-splat scene capture",
    domain: "spatial",
    problem:
      "Walk through a photoreal 3DGS capture of a car, a showroom or a street, streamed with level of detail.",
    engine: "Spark 2.0 / three.js GaussianSplatMesh",
    source: "https://sparkjs.dev/",
    sourceLabel: "Spark",
    input: ".spz / .ply / .splat",
    output: "Real-time radiance field, LoD streaming",
    status: "engine",
  },
  {
    id: "city-twin",
    title: "City-scale digital twin",
    domain: "spatial",
    problem:
      "Stream 3D Tiles of a city, overlay traffic, sensors and drone corridors with geodetic accuracy.",
    engine: "CesiumJS + 3D Tiles",
    source: "https://cesium.com/platform/cesiumjs/",
    sourceLabel: "CesiumJS",
    input: "3D Tiles, GeoJSON, telemetry",
    output: "Globe twin, layers, time dynamic",
    status: "engine",
  },
  {
    id: "geo-layers",
    title: "Large-scale geospatial layers",
    domain: "spatial",
    problem:
      "Render millions of points, trips and hexbins over a basemap without dropping frames.",
    engine: "deck.gl + MapLibre",
    source: "https://deck.gl/",
    sourceLabel: "deck.gl",
    input: "Parquet / Arrow tables",
    output: "GPU layers, brushing, aggregation",
    status: "engine",
  },
  {
    id: "usd-composition",
    title: "OpenUSD scene composition",
    domain: "spatial",
    problem:
      "Layer variants, references and overrides in a USD stage and see what each layer changes.",
    engine: "OpenUSD + usd-viewer (WASM)",
    source: "https://openusd.org/",
    sourceLabel: "OpenUSD",
    input: ".usd / .usdz",
    output: "Stage tree, variant sets, diff",
    status: "planned",
  },
  {
    id: "bim",
    title: "Building & factory twin (BIM)",
    domain: "spatial",
    problem:
      "Load an IFC model, section it, and attach live sensor readings to rooms and machines.",
    engine: "That Open Engine (IFC.js) + Three.js",
    source: "https://thatopen.com/",
    sourceLabel: "That Open",
    input: "IFC, sensor feed",
    output: "Sectioned model, property panels",
    status: "planned",
  },

  // ─── AI systems ──────────────────────────────────────────────────
  {
    id: "attention",
    title: "Transformer attention explorer",
    domain: "ai",
    problem:
      "Type a sentence and watch which tokens each head attends to. Sharpen or flatten the softmax temperature.",
    engine: "In-browser toy transformer + canvas heatmap",
    source: "https://github.com/jessevig/bertviz",
    sourceLabel: "BertViz reference",
    input: "Tokens, head, temperature",
    output: "Attention matrix, arc diagram",
    status: "lab",
    lab: "attention",
  },
  {
    id: "embedding-space",
    title: "Embedding space explorer",
    domain: "ai",
    problem:
      "Project embeddings with UMAP, color by label and find clusters, outliers and mislabeled samples.",
    engine: "umap-js + Three.js points / TensorBoard projector",
    source: "https://projector.tensorflow.org/",
    sourceLabel: "Embedding Projector",
    input: "Vectors + metadata",
    output: "2D/3D projection, neighbors, selection",
    status: "engine",
  },
  {
    id: "agent-trace",
    title: "Agent trace & tool-call timeline",
    domain: "ai",
    problem:
      "Follow an LLM agent through planning, tool calls and retries; see cost, latency and where it looped.",
    engine: "OpenTelemetry + Arize Phoenix",
    source: "https://github.com/Arize-ai/phoenix",
    sourceLabel: "Phoenix",
    input: "OTel spans",
    output: "Span tree, token cost, loops",
    status: "engine",
  },
  {
    id: "model-graph",
    title: "Neural network graph inspector",
    domain: "ai",
    problem:
      "Open an ONNX model and browse operators, shapes and weights layer by layer.",
    engine: "Netron",
    source: "https://netron.app/",
    sourceLabel: "Netron",
    input: "ONNX / SafeTensors",
    output: "Operator graph, tensor shapes",
    status: "engine",
  },
  {
    id: "training-curves",
    title: "Training run comparison",
    domain: "ai",
    problem:
      "Overlay loss, learning rate and gradient norm across runs and spot the divergence early.",
    engine: "uPlot + Parquet run logs",
    source: "https://github.com/leeoniya/uPlot",
    sourceLabel: "uPlot",
    input: "Run metrics",
    output: "Aligned curves, smoothing, anomalies",
    status: "planned",
  },
  {
    id: "crypto-algorithms",
    title: "Cryptography algorithm walkthroughs",
    domain: "ai",
    problem:
      "Step through SHA-256 compression, elliptic-curve point addition and Merkle proofs one operation at a time.",
    engine: "Canvas step animator",
    source: "https://github.com/paulmillr/noble-curves",
    sourceLabel: "noble-curves reference",
    input: "Message, key, block",
    output: "State per round, proof path",
    status: "planned",
  },

  // ─── Finance & markets ───────────────────────────────────────────
  {
    id: "order-book",
    title: "Order book & microstructure",
    domain: "markets",
    problem:
      "Watch a simulated limit order book fill and cancel, see depth, imbalance and how a market order walks the book.",
    engine: "Canvas depth chart + LOB simulator",
    source: "https://www.tradingview.com/lightweight-charts/",
    sourceLabel: "Lightweight Charts reference",
    input: "Order arrival rate, spread, volatility",
    output: "Depth, mid price, imbalance, trades",
    status: "lab",
    lab: "orderbook",
  },
  {
    id: "options-surface",
    title: "Implied volatility surface",
    domain: "markets",
    problem:
      "Rotate a 3D IV surface across strike and expiry and see skew and term structure move with the spot.",
    engine: "Plotly.js surface / Three.js",
    source: "https://plotly.com/javascript/3d-surface-plots/",
    sourceLabel: "Plotly.js",
    input: "Option chain",
    output: "Surface, skew slices, Greeks",
    status: "planned",
  },
  {
    id: "liquidation-map",
    title: "Derivatives liquidation heatmap",
    domain: "markets",
    problem:
      "Locate leverage clusters above and below price and see funding, OI and CVD divergence on one timeline.",
    engine: "Canvas heatmap + Lightweight Charts",
    source: "https://github.com/tradingview/lightweight-charts",
    sourceLabel: "Lightweight Charts",
    input: "OI, funding, aggregated trades",
    output: "Liquidity heatmap, divergence flags",
    status: "planned",
  },
  {
    id: "portfolio-risk",
    title: "Portfolio factor exposure",
    domain: "markets",
    problem:
      "Decompose a portfolio into factor exposures and stress it against historical regimes.",
    engine: "D3 + WebAssembly linear algebra",
    source: "https://d3js.org/",
    sourceLabel: "D3",
    input: "Holdings, factor returns",
    output: "Exposure bars, stress paths",
    status: "planned",
  },
  {
    id: "capital-flows",
    title: "Cross-border capital flow map",
    domain: "markets",
    problem:
      "Animate ETF, northbound and FX flows between markets as arcs on a globe.",
    engine: "deck.gl ArcLayer / globe.gl",
    source: "https://globe.gl/",
    sourceLabel: "globe.gl",
    input: "Flow matrices by day",
    output: "Animated arcs, net flow ranking",
    status: "planned",
  },

  // ─── Science & life ──────────────────────────────────────────────
  {
    id: "human-anatomy",
    title: "Human anatomy explorer",
    domain: "science",
    problem:
      "Peel systems apart—skeleton, muscles, organs—and locate a structure with search.",
    engine: "Three.js + Z-Anatomy open model",
    source: "https://www.z-anatomy.com/",
    sourceLabel: "Z-Anatomy",
    input: "Layer selection, search term",
    output: "Isolated system, labels, cross-section",
    status: "engine",
  },
  {
    id: "protein",
    title: "Protein structure viewer",
    domain: "science",
    problem:
      "Load a PDB or AlphaFold prediction, color by confidence and inspect binding pockets.",
    engine: "Mol* (molstar)",
    source: "https://molstar.org/",
    sourceLabel: "Mol*",
    input: "PDB / mmCIF",
    output: "Cartoon, surface, pLDDT color",
    status: "engine",
  },
  {
    id: "medical-volume",
    title: "Medical volume rendering",
    domain: "science",
    problem:
      "Scroll through CT slices and raycast the volume in 3D with transfer functions.",
    engine: "Cornerstone3D / VTK.js",
    source: "https://kitware.github.io/vtk-js/",
    sourceLabel: "VTK.js",
    input: "DICOM / NIfTI",
    output: "MPR slices, volume raycast",
    status: "planned",
  },
  {
    id: "weather",
    title: "Global wind & weather fields",
    domain: "science",
    problem:
      "Advect particles through a global wind field and overlay temperature or pressure.",
    engine: "WebGL particle advection (earth.nullschool style)",
    source: "https://github.com/cambecc/earth",
    sourceLabel: "earth",
    input: "GFS / ERA5 grids",
    output: "Streamlines, scalar overlays",
    status: "planned",
  },

  // ─── Industry & infrastructure ───────────────────────────────────
  {
    id: "supply-chain",
    title: "Industry chain & supplier graph",
    domain: "industry",
    problem:
      "Map an industry from raw material to end product; click a node and see who depends on it and single points of failure.",
    engine: "Sigma.js / G6 force graph",
    source: "https://www.sigmajs.org/",
    sourceLabel: "Sigma.js",
    input: "Company–component edges",
    output: "Layered graph, dependency paths",
    status: "engine",
  },
  {
    id: "power-grid",
    title: "Power grid load flow",
    domain: "industry",
    problem:
      "See generation, transmission load and congestion on a grid map as demand ramps through the day.",
    engine: "deck.gl + pandapower results",
    source: "https://www.pandapower.org/",
    sourceLabel: "pandapower",
    input: "Network, load profiles",
    output: "Line loading, voltage, congestion",
    status: "planned",
  },
  {
    id: "orbits",
    title: "Satellite constellation & orbits",
    domain: "industry",
    problem:
      "Propagate TLEs and watch a constellation's coverage and ground tracks in real time.",
    engine: "satellite.js + CesiumJS",
    source: "https://github.com/shashwatak/satellite-js",
    sourceLabel: "satellite.js",
    input: "TLE set",
    output: "Orbits, ground tracks, coverage",
    status: "planned",
  },
  {
    id: "low-altitude",
    title: "Low-altitude drone corridors",
    domain: "industry",
    problem:
      "Plan UAV corridors over a city, check no-fly zones and simulate deconfliction between flights.",
    engine: "CesiumJS + corridor planner",
    source: "https://cesium.com/",
    sourceLabel: "Cesium",
    input: "Flight plans, zones, terrain",
    output: "Corridors, conflicts, altitude profile",
    status: "planned",
  },
  {
    id: "factory-flow",
    title: "Factory line & AGV flow",
    domain: "industry",
    problem:
      "Simulate an assembly line with AGVs and see takt time, WIP and where queues build.",
    engine: "Three.js + discrete-event sim",
    source: "https://threejs.org/",
    sourceLabel: "Three.js",
    input: "Layout, process times, fleet size",
    output: "Throughput, utilization, heatmap",
    status: "planned",
  },
];

export const labs = scenes.filter((s) => s.status === "lab");

export const domainOf = (id: DomainId) => domains.find((d) => d.id === id)!;
