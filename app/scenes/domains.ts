import type { DomainDef } from "./types";

export const domains: DomainDef[] = [
  { id: "driving", name: "Autonomous driving", short: "Driving", hue: 190, blurb: "Perception, planning, log replay, calibration and HD maps.", icon: "lidar" },
  { id: "triage", name: "Triage", short: "Triage", hue: 350, blurb: "Mine events from fleet logs, review them, re-simulate past the disengagement, track the fleet.", icon: "triage" },
  { id: "geo", name: "Map engines", short: "Geo", hue: 150, blurb: "deck.gl, MapLibre, Mapbox, AMap Loca, AntV L7, Cesium and Baidu MapVGL, side by side.", icon: "map" },
  { id: "embodied", name: "Embodied AI", short: "Embodied", hue: 120, blurb: "Episode review, MuJoCo in the browser, robot inspection, kinematics and policy monitoring.", icon: "robot" },
  { id: "simulation", name: "Simulation & world models", short: "Simulation", hue: 35, blurb: "Scenario editing, regression, physics, traffic and generated futures.", icon: "sim" },
  { id: "annotation", name: "Annotation", short: "Annotation", hue: 280, blurb: "LiDAR cuboids, tracking propagation, image tools and quality control.", icon: "annot" },
  { id: "dataloop", name: "Data loop", short: "Data loop", hue: 210, blurb: "Pipeline status, dataset statistics and training-run comparison.", icon: "loop" },
  { id: "spatial", name: "3D & neural rendering", short: "3D", hue: 260, blurb: "glTF inspection and Gaussian splats.", icon: "cube" },
  { id: "ai", name: "AI systems", short: "AI", hue: 300, blurb: "Attention, embeddings and agent traces.", icon: "ai" },
  { id: "markets", name: "Markets", short: "Markets", hue: 55, blurb: "Order books, volatility surfaces and liquidation maps.", icon: "chart" },
  { id: "science", name: "Science", short: "Science", hue: 170, blurb: "Dynamical systems and fields.", icon: "science" },
  { id: "industry", name: "Industry", short: "Industry", hue: 20, blurb: "Power flow and supply-chain dependency.", icon: "grid" },
];

export const domainOf = (id: string) => domains.find((d) => d.id === id);
