import Link from "next/link";
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

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

function Demo({ slug }: { slug: string }) {
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
      <Link href="/" className="back">← all work</Link>

      <header>
        <p className="kicker">{project.org}</p>
        <h1>{project.title}</h1>
        <p className="lede">{project.tagline}</p>
        {project.links.length > 0 && (
          <div className="ext-links">
            {project.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
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
        <a href="https://github.com/callmedanieldaniel" target="_blank" rel="noopener noreferrer">github.com/callmedanieldaniel</a>
      </footer>
    </div>
  );
}

function ProjectBody({ slug }: { slug: string }) {
  switch (slug) {
    case "ad-toolchain":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              The browser workspace that DiDi&apos;s AD researchers used every day —
              data, perception, planning, simulation. Replaced a fragmented mix of
              desktop ROS tools (RViz, Foxglove, PlotJuggler) with a single
              web-native viewer.
            </p>
          </section>
          <section>
            <h2>The interesting parts</h2>
            <ul>
              <li><strong>Three.js / WebGL scene viewer</strong> on top of RViz &amp; Foxglove (Webviz) — full-fidelity LiDAR playback, multi-camera mosaic, 3D bounding boxes synced to perception outputs.</li>
              <li><strong>ROS ↔ browser bridge</strong> via rosbridge — streamed rosbag2 recordings and live ROS topics into the browser.</li>
              <li><strong>200 Mb/s gRPC / Protobuf</strong> pipeline + multi-stream WebCodecs / H.264 video at &lt;100 ms latency, 20 FPS.</li>
              <li><strong>One rendering engine, three surfaces</strong> — the same code path drove React tools, a Vue analyst portal, and the Android in-vehicle HMI.</li>
            </ul>
          </section>
          <div className="kpi-grid">
            <div><b>~200%</b><span>render perf gain</span></div>
            <div><b>&lt;100 ms</b><span>video latency</span></div>
            <div><b>&gt;4 h/day</b><span>per-researcher use</span></div>
          </div>
          <section>
            <h2>Why it mattered</h2>
            <p>
              Became the AD data team&apos;s primary daily workspace. Earned the
              company-wide annual Efficiency Contribution Award.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              The demo above is a stylized recreation — the internal viewer is
              not publicly accessible.
            </p>
          </section>
        </>
      );
    case "mapv":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              Open-source spatial-data visualization library used across Baidu
              Maps Open Platform. Renders heatmaps, point clouds, animated
              origin-destination flows, choropleth, and clustered markers on a
              shared Canvas / WebGL pipeline.
            </p>
          </section>
          <section>
            <h2>What I contributed</h2>
            <ul>
              <li>Performance work on the canvas renderer (binned heatmap, grid aggregation).</li>
              <li>Animated flow layer — bezier paths with phased particle streams.</li>
              <li>Gallery samples + docs for the public-facing site.</li>
            </ul>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Reimplements the heatmap path in ~200 lines of canvas: ~1,600 points
              with a 12-pixel binning kernel and a mapv-style cool→hot color ramp.
              Same algorithm, no library — just the math.
            </p>
          </section>
        </>
      );
    case "loca":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              The 3D visualization engine for AMap (Alibaba) — extruded
              buildings, animated heatmaps, scan effects, scatter and arc layers
              composed over the AMap tile base.
            </p>
          </section>
          <section>
            <h2>What I worked on</h2>
            <ul>
              <li>Polygon extrusion layer with data-driven height and color.</li>
              <li>Animated scan / sweep overlays.</li>
              <li>Camera path scripting for showcase demos.</li>
            </ul>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Pure Three.js recreation of the Loca extrude pattern — height-driven
              hue ramp, edge wireframes, an orbital camera and a ground sweep bar.
              No AMap SDK, no API key.
            </p>
          </section>
        </>
      );
    case "truck":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              End-to-end logistics planning surface for AMap LBS — designed for
              freight operators. Handles truck-class restrictions (height, weight,
              hazmat), time-windowed road closures, and multi-stop optimization.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Mock dispatch UI — a routed waypoint chain that avoids three
              truck-restricted zones. Animates the truck along the polyline with
              a live ETA. Real product has full road-network routing; this is the
              visualization layer in isolation.
            </p>
          </section>
        </>
      );
    case "qianxi":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              Baidu&apos;s public-facing migration big-data product — visualizes
              inter-city population flow at provincial and city granularity, daily.
              During Spring Festival it&apos;s one of the most-cited data products
              in Chinese media.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              24 origin-destination flows across 9 cities, rendered as bezier arcs
              with three phased particles each. The same primitive used in the
              production map, scaled down.
            </p>
          </section>
        </>
      );
    case "jiaotong":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              City-scale realtime traffic for Baidu Maps — every road segment
              colored by realtime average speed, refreshed at 1 Hz from the
              backend. Used by municipal traffic ops centers.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Procedural ring + radial + grid network. Each segment has its own
              speed that drifts; the color ramp (jam / slow / free) and a moving
              particle communicate flow direction.
            </p>
          </section>
        </>
      );
    case "renqi":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              Site-selection workflow for retail and real-estate — combines POI
              density heat, demographic overlays, and isochrone (5/10/15/20-min
              walking) analysis around a candidate location.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Heat blobs + four expanding rings around a chosen POI. Simulates
              the &quot;is this address worth opening a store at&quot; analytic.
            </p>
          </section>
        </>
      );
    case "mapv-pro":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              Enterprise dashboard composer — a drag-drop big-screen builder
              with realtime SSE / WebSocket connectors, used by city ops and
              business intelligence teams.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Layout of one of the default templates — live KPI tiles, a 60-second
              throughput sparkline, a top-N city bar chart, and an animated map
              panel. All driven by deterministic noise so it looks alive without a
              backend.
            </p>
          </section>
        </>
      );
    case "amap-sdk":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              The core JavaScript map SDK for AMap (AMap JS API v2) — vector
              tiles, layer system, official layer pack, marker / overlay APIs,
              backward compatibility with v1.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Tiny &quot;map kernel&quot; — pan with drag, zoom with scroll,
              procedural tiles + roads + parks + markers. The API shape of the
              real product, in a few hundred lines.
            </p>
          </section>
        </>
      );
    case "l7":
      return (
        <>
          <section>
            <h2>What it is</h2>
            <p>
              AntV L7 — the open-source geospatial visualization framework from
              Alibaba&apos;s AntV team. The hex-grid aggregation layer is one of
              its signature primitives, used for population, mobility, and
              business analytics.
            </p>
          </section>
          <section>
            <h2>The demo above</h2>
            <p>
              Generated 2D gaussian field aggregated into a hex grid, extruded by
              value and colored by a divergent ramp. Camera orbits; heights
              breathe slightly to make the field feel alive.
            </p>
          </section>
        </>
      );
    case "baidu-sdk":
      return (
        <>
          <section>
            <h2>What I built</h2>
            <ul>
              <li>B-end API platform — endpoints, throttling, developer-key surface.</li>
              <li>C-end push channel and web rendering pipeline.</li>
              <li>Sample apps and demo gallery for the open platform.</li>
            </ul>
          </section>
          <section>
            <h2>Note on this page</h2>
            <p>
              The shipped product is itself the demo — see the links above. The
              cover graphic shows the developer-experience surface: a few lines
              of JS to instantiate a map.
            </p>
          </section>
        </>
      );
    default:
      return null;
  }
}
