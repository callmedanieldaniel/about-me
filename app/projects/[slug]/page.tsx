import Link from "next/link";
import type { Metadata } from "next";
import ScenePlayground from "../../components/ScenePlayground";
import { notFound } from "next/navigation";
import { projects, getProject } from "../data";
import MapvDemo from "../../demos/MapvDemo";
import LocaDemo from "../../demos/LocaDemo";
import TruckDemo from "../../demos/TruckDemo";
import QianxiDemo from "../../demos/QianxiDemo";
import JiaotongDemo from "../../demos/JiaotongDemo";
import RenqiDemo from "../../demos/RenqiDemo";
import MapvProDemo from "../../demos/MapvProDemo";
import L7Demo from "../../demos/L7Demo";
import AdSceneDemo from "../../demos/AdSceneDemo";
import AmapSdkDemo from "../../demos/AmapSdkDemo";
import BaiduSdkDemo from "../../demos/BaiduSdkDemo";
import DemoFrame from "../../demos/DemoFrame";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return {
    title: project?.title ?? "Study not found",
    description: project?.tagline,
  };
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

function Demo({ slug }: { slug: string }) {
  const needsBaidu = ["mapv", "qianxi", "baidu-sdk"].includes(slug);
  const configured = needsBaidu
    ? Boolean(process.env.NEXT_PUBLIC_BAIDU_KEY)
    : Boolean(process.env.NEXT_PUBLIC_AMAP_KEY);
  if (slug === "ad-toolchain" || !configured) {
    const mode =
      slug === "ad-toolchain"
        ? "lidar"
        : ["qianxi", "truck", "mapv-pro", "baidu-sdk"].includes(slug)
          ? "network"
          : "field";
    return (
      <>
        <div className="demo-wrap">
          <ScenePlayground initialMode={mode} compact />
        </div>
        <p className="demo-caption">
          Interactive synthetic study · illustrative geometry, not a recording
          of a production system or real geographic data.
        </p>
      </>
    );
  }
  switch (slug) {
    case "mapv":
      return (
        <DemoFrame
          title="new mapv.baiduMapLayer() · heatmap"
          caption="Real mapv on Baidu Map GL · 5,400 points across 6 Beijing hotspots · gaussian heatmap, midnight style."
        >
          <MapvDemo />
        </DemoFrame>
      );
    case "loca":
      return (
        <DemoFrame
          title="new Loca.Container() · 3D buildings + pulse line"
          caption="Real AMap + Loca v2 · Shanghai · extruded buildings (pink→teal ramp), animated pulse polyline, breathing scatter."
        >
          <LocaDemo />
        </DemoFrame>
      );
    case "truck":
      return (
        <DemoFrame
          title="AMap.Driving.search() + restricted polygons"
          caption="Real AMap routing · 2 waypoints, 2 truck-restricted zones drawn as dashed polygons."
        >
          <TruckDemo />
        </DemoFrame>
      );
    case "qianxi":
      return (
        <DemoFrame
          title="new mapv.baiduMapLayer() · migration"
          caption="Real mapv migration layer on Baidu Map · 15 cities, 56 OD pairs · animated polyline trails."
        >
          <QianxiDemo />
        </DemoFrame>
      );
    case "jiaotong":
      return (
        <DemoFrame
          title="new AMap.TileLayer.Traffic()"
          caption="Real-time AMap traffic tiles · Beijing · refreshed every 60s from the network."
        >
          <JiaotongDemo />
        </DemoFrame>
      );
    case "renqi":
      return (
        <DemoFrame
          title="new AMap.Heatmap() + AMap.Circle"
          caption="Real AMap heatmap (320 points / 4 clusters) + 4-ring isochrone (5/10/15/20 min)."
        >
          <RenqiDemo />
        </DemoFrame>
      );
    case "mapv-pro":
      return (
        <DemoFrame
          title="big-screen composition · Loca + dashboard"
          caption="Real Loca scatter + pulse-line layer (Beijing→cities) + live KPI tiles, sparkline, top-N bars."
        >
          <MapvProDemo />
        </DemoFrame>
      );
    case "l7":
      return (
        <DemoFrame
          title="hex aggregation via Loca.PolygonLayer"
          caption="Real AMap + Loca · gaussian field aggregated into hex tiles · data-driven height and color."
        >
          <L7Demo />
        </DemoFrame>
      );
    case "ad-toolchain":
      return (
        <DemoFrame
          title="adviewer.PointCloud + Boxes"
          caption="Simulated LiDAR rings + 3D bounding boxes (cars, peds) · ego vehicle wireframe centered."
        >
          <AdSceneDemo />
        </DemoFrame>
      );
    case "amap-sdk":
      return (
        <DemoFrame
          title="new AMap.Map() · v2.0 · 3D"
          caption="Real AMap JS API v2 · Shanghai · dark style, 50° pitch, 3D buildings, auto-rotation."
        >
          <AmapSdkDemo />
        </DemoFrame>
      );
    case "baidu-sdk":
      return (
        <DemoFrame
          title="new BMapGL.Map() · 3D"
          caption="Real Baidu Map GL · Beijing · 60° tilt, midnight style, heading sweep, labeled markers."
        >
          <BaiduSdkDemo />
        </DemoFrame>
      );
    default:
      return null;
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <div className="shell project-page">
      <Link href="/" className="back">
        ← all work
      </Link>

      <header>
        <p className="kicker">{project.org}</p>
        <h1>{project.title}</h1>
        <p className="lede">{project.tagline}</p>
        {project.links.length > 0 && (
          <div className="ext-links">
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        )}
      </header>

      <Demo slug={slug} />

      <ProjectBody slug={slug} />

      <footer className="foot">
        <Link href="/">← all work</Link>
        <span>FIELDWORK / ENGINEERING STUDIES</span>
      </footer>
    </div>
  );
}

const notes: Record<string, { focus: string; techniques: string[] }> = {
  "ad-toolchain": {
    focus:
      "Bring point clouds, object bounds, and synchronized telemetry into a browser workspace for perception and simulation analysis.",
    techniques: [
      "Render multi-sensor scene data with Three.js and WebGL.",
      "Coordinate streaming and playback across interfaces using Protobuf, gRPC, and browser media APIs.",
      "Separate data ingestion, scene state, and rendering so tools can share a consistent engine.",
    ],
  },
  mapv: {
    focus:
      "Make dense spatial datasets readable through a consistent family of rendering layers.",
    techniques: [
      "Aggregate samples before drawing heatmaps and point layers.",
      "Use Canvas and WebGL according to data density and interaction requirements.",
    ],
  },
  loca: {
    focus:
      "Explore how height, color, and movement reveal patterns in spatial data.",
    techniques: [
      "Compose extruded polygons, scatter layers, and animated paths.",
      "Keep camera interaction and layer state independent from data updates.",
    ],
  },
  truck: {
    focus:
      "Represent routes, waypoints, and restricted areas clearly enough to support a planning workflow.",
    techniques: [
      "Distinguish planned paths from restriction overlays.",
      "Keep the visualization separate from the routing service and its constraints.",
    ],
  },
  qianxi: {
    focus:
      "Show origin-destination relationships and direction across a spatial network.",
    techniques: [
      "Use curved paths to separate overlapping flows.",
      "Animate particles along paths without changing the underlying data.",
    ],
  },
  jiaotong: {
    focus:
      "Connect road-network visualization to changing traffic measurements.",
    techniques: [
      "Encode segment conditions using a consistent color scale.",
      "Separate periodic data refreshes from the rendering loop.",
    ],
  },
  renqi: {
    focus:
      "Support geographic exploration through density layers and distance-based overlays.",
    techniques: [
      "Combine points of interest with heatmap layers.",
      "Distinguish illustrative distance rings from routing-based travel-time calculations.",
    ],
  },
  "mapv-pro": {
    focus:
      "Compose spatial views, charts, and streaming indicators into a reusable analysis surface.",
    techniques: [
      "Maintain clear boundaries between data adapters and display components.",
      "Coordinate updates without rebuilding the entire workspace.",
    ],
  },
  "amap-sdk": {
    focus:
      "Design reusable map interfaces around layers, overlays, events, and camera state.",
    techniques: [
      "Make rendering primitives composable through a stable SDK.",
      "Handle initialization, interaction, and disposal as explicit lifecycle steps.",
    ],
  },
  l7: {
    focus:
      "Reduce complex spatial distributions to a readable field of aggregated cells.",
    techniques: [
      "Bin spatial samples into a hexagonal grid.",
      "Map aggregation values to extrusion height and color.",
    ],
  },
  "baidu-sdk": {
    focus:
      "Connect API capabilities with the documentation, examples, and interfaces developers need.",
    techniques: [
      "Build reusable SDK and rendering abstractions.",
      "Create clear integration paths across platform APIs and browser tooling.",
    ],
  },
};
function ProjectBody({ slug }: { slug: string }) {
  const note = notes[slug];
  if (!note) return null;
  return (
    <>
      <section>
        <h2>Engineering focus</h2>
        <p>{note.focus}</p>
      </section>
      <section>
        <h2>Technical approach</h2>
        <ul>
          {note.techniques.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <p className="privacy-note">
        An anonymized technical study based on engineering experience.
        Demonstrations use synthetic data or public map services. Product
        references identify technologies, not employment or ownership.
      </p>
    </>
  );
}
