import type { ComponentType } from "react";

export type Params = Record<string, number | boolean | string>;
export type Telemetry = Record<string, string | number>;
export type Command = { name: string; seq: number } | null;

export type EngineProps = {
  params: Params;
  playing: boolean;
  resetKey: number;
  asset: ArrayBuffer | null;
  command: Command;
  onTelemetry: (t: Telemetry) => void;
};

export type Control =
  | { key: string; label: string; type: "range"; min: number; max: number; step: number; unit?: string; default: number }
  | { key: string; label: string; type: "toggle"; default: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; default: string }
  | { key: string; label: string; type: "text"; default: string; hint?: string }
  | { key: string; label: string; type: "file"; accept: string; hint: string }
  | { key: string; label: string; type: "action"; hint?: string };

export type Lib = { name: string; version?: string; url: string; role: string };

export type DemoDef = {
  id: string;
  title: string;
  summary: string;
  controls: Control[];
  legend: { color: string; label: string }[];
  assumptions: string;
  camera?: string;
  libs: Lib[];
  needsKey?: "mapbox" | "amap" | "baidu";
  load: () => Promise<{ default: ComponentType<EngineProps> }>;
};

export type SceneDef = {
  id: string;
  domain: string;
  title: string;
  question: string;
  input: string;
  output: string;
  demos: DemoDef[];
};

export type DomainDef = {
  id: string;
  name: string;
  short: string;
  hue: number;
  blurb: string;
  icon: string;
};

export const c = {
  live: "#5ee7ff",
  ref: "#ffb454",
  ok: "#7cf3a0",
  bad: "#ff5d73",
  muted: "#7e90a8",
  violet: "#b99cff",
  fg: "#e6eef8",
};

export const lib = {
  three: { name: "Three.js", version: "r184", url: "https://threejs.org/docs/", role: "WebGL scene, instancing, controls" },
  rapier: { name: "Rapier", version: "0.19", url: "https://rapier.rs/docs/user_guides/javascript/getting_started_js", role: "Rigid-body physics (WASM)" },
  uplot: { name: "uPlot", version: "1.6", url: "https://github.com/leeoniya/uPlot", role: "Dense time-series plots" },
  deck: { name: "deck.gl", version: "9.4", url: "https://deck.gl/docs", role: "GPU geospatial layers" },
  maplibre: { name: "MapLibre GL JS", version: "5.x", url: "https://maplibre.org/maplibre-gl-js/docs/", role: "Vector-tile basemap" },
  mapbox: { name: "Mapbox GL JS", version: "3.x", url: "https://docs.mapbox.com/mapbox-gl-js/guides/", role: "Standard style, 3D terrain" },
  loca: { name: "AMap Loca", version: "2.0", url: "https://lbs.amap.com/api/loca-v2/intro", role: "Data visualization on AMap" },
  amap: { name: "AMap JSAPI", version: "2.0", url: "https://lbs.amap.com/api/javascript-api-v2/summary", role: "Basemap, buildings" },
  l7: { name: "AntV L7", version: "2.x", url: "https://l7.antv.antgroup.com/", role: "Geospatial layers on any basemap" },
  cesium: { name: "CesiumJS", version: "1.145", url: "https://cesium.com/learn/cesiumjs-learn/", role: "Globe, terrain, 3D Tiles" },
  satellite: { name: "satellite.js", url: "https://github.com/shashwatak/satellite-js", role: "SGP4 orbit propagation" },
  mapvgl: { name: "Baidu MapVGL", url: "https://mapv.baidu.com/gl/docs/", role: "WebGL layers on Baidu Maps" },
  mcap: { name: "@mcap/core", version: "2.2", url: "https://mcap.dev/guides/typescript", role: "MCAP read/write" },
  foxglove: { name: "Foxglove schemas", url: "https://docs.foxglove.dev/docs/sdk/schemas", role: "Message layouts for PointCloud, Image, TF" },
  urdf: { name: "urdf-loader", version: "0.13", url: "https://github.com/gkjohnson/urdf-loaders", role: "URDF → Three.js articulated model" },
  mujoco: { name: "MuJoCo WASM", version: "3.1", url: "https://github.com/google-deepmind/mujoco/tree/main/wasm", role: "Physics engine in the browser" },
  d3: { name: "D3", version: "7", url: "https://d3js.org/", role: "Scales, layouts, force graphs" },
  canvas: { name: "Canvas 2D", url: "https://developer.mozilla.org/docs/Web/API/Canvas_API", role: "Rasterized plots and overlays" },
  gltf: { name: "GLTFLoader", url: "https://threejs.org/docs/#examples/en/loaders/GLTFLoader", role: "glTF 2.0 import" },
  transform: { name: "TransformControls", url: "https://threejs.org/docs/#examples/en/controls/TransformControls", role: "Gizmo manipulation" },
  opendrive: { name: "ASAM OpenDRIVE", version: "1.8", url: "https://www.asam.net/standards/detail/opendrive/", role: "Road network format" },
  openscenario: { name: "ASAM OpenSCENARIO", url: "https://www.asam.net/standards/detail/openscenario/", role: "Scenario description reference" },
  nuscenes: { name: "nuScenes devkit", url: "https://github.com/nutonomy/nuscenes-devkit", role: "Export schema reference" },
  kitti: { name: "KITTI format", url: "https://www.cvlibs.net/datasets/kitti/eval_object.php", role: "Label export reference" },
  lerobot: { name: "LeRobot", url: "https://github.com/huggingface/lerobot", role: "Episode/dataset conventions" },
  rerun: { name: "Rerun", url: "https://rerun.io/", role: "Reference viewer for episodes" },
  foxgloveApp: { name: "Foxglove", url: "https://foxglove.dev/", role: "Reference layout for log review" },
  viser: { name: "Viser", url: "https://viser.studio/", role: "Reference for multi-env web viewers" },
  isaac: { name: "Isaac Lab", url: "https://isaac-sim.github.io/IsaacLab/", role: "Reference for parallel RL training" },
  carla: { name: "CARLA ScenarioRunner", url: "https://carla-scenariorunner.readthedocs.io/", role: "Reference for closed-loop scenarios" },
  sumo: { name: "SUMO", url: "https://sumo.dlr.de/docs/", role: "Reference traffic simulator" },
  cosmos: { name: "NVIDIA Cosmos", url: "https://github.com/nvidia-cosmos", role: "World foundation model reference" },
  xtreme1: { name: "Xtreme1", url: "https://github.com/xtreme1-io/xtreme1", role: "Reference annotation UX" },
  cvat: { name: "CVAT", url: "https://www.cvat.ai/", role: "Reference 2D/3D labeling" },
  splat: { name: "Gaussian splatting (three.js)", url: "https://github.com/mrdoob/three.js", role: "Splat rendering reference" },
  applied: { name: "Applied Intuition triage", url: "https://www.appliedintuition.com/use-cases/log-visualization-and-triage", role: "Reference triage workflow" },
  plotly: { name: "Plotly.js", url: "https://plotly.com/javascript/", role: "Reference for statistical charts" },
  ldjs: { name: "Lightweight Charts", url: "https://tradingview.github.io/lightweight-charts/", role: "Reference financial charting" },
};
