export type Project = {
  slug: string;
  title: string;
  org: string;
  year: string;
  tagline: string;
  tags: string[];
  cover: "mapv" | "loca" | "truck" | "qianxi" | "jiaotong" | "renqi" | "mapv-pro" | "ad" | "l7" | "amap-sdk" | "baidu-sdk";
  links: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    slug: "ad-toolchain",
    title: "Autonomous-Driving Model-Training Toolchain",
    org: "DiDi · 2022–2024",
    year: "2024",
    tagline:
      "Browser scene viewer + telemetry workspace for AD researchers — 3D point cloud, multi-camera, rosbridge live streams.",
    tags: ["Three.js", "WebGL", "rosbridge", "rosbag2", "Protobuf", "WebCodecs", "gRPC"],
    cover: "ad",
    links: [],
  },
  {
    slug: "mapv",
    title: "Mapv — Spatial Data Visualization SDK",
    org: "Baidu · 2017–2019",
    year: "2019",
    tagline:
      "Open-source canvas/WebGL visualization library for geospatial data: heatmaps, point clouds, animated flows, choropleth.",
    tags: ["Canvas", "WebGL", "Open Source", "Maps"],
    cover: "mapv",
    links: [
      { label: "mapv.baidu.com/gallery", href: "https://mapv.baidu.com/gallery.html" },
      { label: "github / mapv", href: "https://github.com/huiyan-fe/mapv" },
    ],
  },
  {
    slug: "loca",
    title: "AMap Loca — 3D Geospatial Visualization",
    org: "Alibaba · 2019–2021",
    year: "2021",
    tagline:
      "3D map visualization engine for AMap — extruded buildings, animated heatmaps, scatter layers, scan effects.",
    tags: ["Three.js", "WebGL", "AMap", "Loca v2"],
    cover: "loca",
    links: [
      { label: "lbs.amap.com/product/loca", href: "https://lbs.amap.com/product/loca#/" },
      { label: "demo gallery", href: "https://developer.amap.com/demo/loca-v2/demos/cat-view-control/view-control" },
    ],
  },
  {
    slug: "truck",
    title: "LBS Truck Routing Solution",
    org: "Alibaba · 2020–2021",
    year: "2021",
    tagline:
      "End-to-end logistics route planning — truck-class restrictions, time-windowed road closures, multi-stop optimization.",
    tags: ["AMap", "Routing", "B2B"],
    cover: "truck",
    links: [
      { label: "lbs.amap.com/solution/truck", href: "https://lbs.amap.com/solution/truck" },
    ],
  },
  {
    slug: "qianxi",
    title: "Qianxi — Migration Big Data",
    org: "Baidu · 2018–2019",
    year: "2019",
    tagline:
      "Animated origin-destination flows showing inter-city population migration at provincial and city granularity.",
    tags: ["Canvas", "ECharts", "Real-time"],
    cover: "qianxi",
    links: [
      { label: "qianxi.baidu.com", href: "https://qianxi.baidu.com/#/" },
    ],
  },
  {
    slug: "jiaotong",
    title: "Smart Traffic — City Realtime Speed",
    org: "Baidu · 2018",
    year: "2018",
    tagline:
      "Live road-network color-coded by realtime average speed; supports per-city congestion analytics.",
    tags: ["Canvas", "Realtime", "Maps"],
    cover: "jiaotong",
    links: [
      { label: "jiaotong.baidu.com", href: "https://jiaotong.baidu.com/" },
    ],
  },
  {
    slug: "renqi",
    title: "Renqi — Commercial Site Selection",
    org: "Baidu · 2018–2019",
    year: "2019",
    tagline:
      "POI heat + isochrone analysis for real-estate and retail site selection.",
    tags: ["Heatmap", "Isochrone", "Maps"],
    cover: "renqi",
    links: [
      { label: "renqi.map.baidu.com/solution/estate", href: "https://renqi.map.baidu.com/solution/estate" },
    ],
  },
  {
    slug: "mapv-pro",
    title: "Mapv-Pro — Geo Data Big-Screen",
    org: "Baidu · 2018–2019",
    year: "2019",
    tagline:
      "Configurable big-screen dashboards for enterprise geo data — drag-drop tiles, real-time SSE, dark-mode native.",
    tags: ["React", "WebSocket", "Dashboards"],
    cover: "mapv-pro",
    links: [
      { label: "renqi.map.baidu.com/products/mapv-pro", href: "https://renqi.map.baidu.com/products/mapv-pro" },
    ],
  },
  {
    slug: "amap-sdk",
    title: "AMap JS API v2",
    org: "Alibaba · 2019–2021",
    year: "2021",
    tagline:
      "Core JS map SDK — vector tiles, layer system, marker / overlay APIs, full backward compatibility.",
    tags: ["TypeScript", "Canvas", "SDK"],
    cover: "amap-sdk",
    links: [
      { label: "javascript-api-v2 docs", href: "https://lbs.amap.com/api/javascript-api-v2/summary" },
      { label: "official layers", href: "https://lbs.amap.com/api/javascript-api-v2/guide/layers/official-layers" },
    ],
  },
  {
    slug: "l7",
    title: "L7 / AntV Geospatial Visualization",
    org: "Alibaba · 2020–2021",
    year: "2021",
    tagline:
      "Contributed to AntV L7 — hex-grid aggregation, extrusion, large-volume point rendering.",
    tags: ["L7", "AntV", "WebGL"],
    cover: "l7",
    links: [
      { label: "l7.antv.vision", href: "https://l7.antv.vision/" },
      { label: "li.antv (spatial analysis)", href: "https://li.antv.antgroup.com/" },
    ],
  },
  {
    slug: "baidu-sdk",
    title: "Baidu Maps Open Platform — Web SDK & Developer Tooling",
    org: "Baidu · 2017–2019",
    year: "2019",
    tagline:
      "B-end API platform, C-end push channel and web rendering — the developer surface for Baidu Maps.",
    tags: ["JS SDK", "API Platform", "Developer Tooling"],
    cover: "baidu-sdk",
    links: [
      { label: "lbsyun.baidu.com / demos", href: "https://lbsyun.baidu.com/index.php?title=open/demos" },
      { label: "visualize platform", href: "https://lbsyun.baidu.com/visualize/home" },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
