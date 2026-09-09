import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata = { title: "Technology stack" };

const layers = [
  {
    name: "Data",
    now: "Typed parameter contracts per lab; synthetic generators seeded for reproducibility; local GLB import that never leaves the device.",
    next: "MCAP/rosbag2 parsing in a Web Worker, LeRobot parquet episodes, Arrow tables for geospatial layers, 3D Tiles and .spz streaming.",
  },
  {
    name: "Compute",
    now: "Analytic kinematics, Frenet lattice planner, boids with spatial hash, zero-intelligence LOB, toy multi-head attention, Rapier WASM rigid bodies — all at fixed step in the main thread.",
    next: "WebGPU compute for ray casting and Monte Carlo sweeps; server jobs for CARLA, Isaac Sim, SUMO and world-model rollouts with results streamed back as MCAP.",
  },
  {
    name: "Render",
    now: "Three.js WebGL stages with instancing, custom point shaders and canvas insets for BEV, plots and depth charts. Each lab owns its scene and disposes it.",
    next: "WebGPU renderer with TSL, native Gaussian splat mesh, deck.gl layers on MapLibre, Cesium globe for city and orbit scenes.",
  },
  {
    name: "Evidence",
    now: "Live telemetry strip, stated assumptions, JSON export of parameters and outputs, keyboard transport (space, r).",
    next: "Shareable run URLs, side-by-side run diff, bookmarks on a timeline, and provenance labels on every input.",
  },
];

const engines: [string, string, string][] = [
  ["Robotics data", "Foxglove SDK, Rerun, MCAP", "Multi-modal timeline replay, live WebSocket bridges, 3D panels"],
  ["Simulation", "CARLA, SUMO, Isaac Sim/Lab, MuJoCo, Genesis, Rapier", "Closed-loop scenarios, traffic, GPU-parallel RL, contact physics"],
  ["World models", "NVIDIA Cosmos, Wayve GAIA-2, OmniDreams", "Action-conditioned future generation for driving and manipulation"],
  ["3D & neural rendering", "Three.js (WebGL/WebGPU), Spark 2.0, glTF, OpenUSD, 3D Tiles", "Assets, splats, scene composition, city-scale streaming"],
  ["Geospatial", "deck.gl, MapLibre, CesiumJS, satellite.js", "Millions of points, arcs, hexbins, orbits, terrain"],
  ["AI observability", "Netron, BertViz, Embedding Projector, Phoenix, uPlot", "Graphs, attention, embeddings, agent traces, training curves"],
  ["Markets", "Lightweight Charts, Plotly.js, D3", "Candles, depth, surfaces, factor and flow diagrams"],
  ["Science", "Mol*, VTK.js, Cornerstone3D, Z-Anatomy", "Molecules, volumes, anatomy layers"],
];

export default function Stack() {
  return (
    <main className="shell doc-page">
      <Nav current="/stack" />
      <header className="doc-head">
        <h1>How the platform is built</h1>
        <p>
          Every scene passes through four layers. The native labs implement all four in the browser; engine
          integrations replace the compute layer with a real simulator, viewer or model and keep the rest.
        </p>
      </header>

      <figure className="arch">
        <svg viewBox="0 0 900 260" role="img" aria-label="Architecture: data, compute, render and evidence layers with browser and server split">
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stopColor="#5ee7ff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#b99cff" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x="10" y="20" width="560" height="220" rx="10" fill="none" stroke="#1c2a3d" />
          <text x="26" y="44" fill="#7e90a8" fontSize="12" fontFamily="'IBM Plex Mono', monospace">browser · local, no account</text>
          <rect x="600" y="20" width="290" height="220" rx="10" fill="none" stroke="#1c2a3d" strokeDasharray="4 4" />
          <text x="616" y="44" fill="#7e90a8" fontSize="12" fontFamily="'IBM Plex Mono', monospace">optional services</text>
          {[
            ["Data", "params · GLB · MCAP · Arrow", 30],
            ["Compute", "planner · physics · LOB · attention", 165],
            ["Render", "Three.js · canvas · deck.gl", 300],
            ["Evidence", "telemetry · export · assumptions", 435],
          ].map(([t, s, x]) => (
            <g key={t as string} transform={`translate(${x}, 70)`}>
              <rect width="120" height="120" rx="8" fill="#0d1420" stroke="url(#g)" />
              <text x="12" y="30" fill="#e6eef8" fontSize="16" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">{t}</text>
              <foreignObject x="10" y="42" width="104" height="70">
                <div style={{ color: "#7e90a8", fontSize: 11, lineHeight: 1.35, fontFamily: "'IBM Plex Mono', monospace" }}>{s}</div>
              </foreignObject>
            </g>
          ))}
          {[150, 285, 420].map((x) => (
            <path key={x} d={`M${x} 130 h12`} stroke="#5ee7ff" strokeWidth="2" />
          ))}
          {[
            ["Sim jobs", "CARLA · Isaac · SUMO", 620],
            ["World models", "Cosmos · GAIA-2", 760],
          ].map(([t, s, x]) => (
            <g key={t as string} transform={`translate(${x}, 70)`}>
              <rect width="120" height="60" rx="8" fill="#0d1420" stroke="#1c2a3d" />
              <text x="12" y="24" fill="#e6eef8" fontSize="14" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">{t}</text>
              <text x="12" y="44" fill="#7e90a8" fontSize="11" fontFamily="'IBM Plex Mono', monospace">{s}</text>
            </g>
          ))}
          <g transform="translate(620, 150)">
            <rect width="260" height="40" rx="8" fill="#0d1420" stroke="#1c2a3d" />
            <text x="12" y="25" fill="#7e90a8" fontSize="12" fontFamily="'IBM Plex Mono', monospace">results stream back as MCAP → Data layer</text>
          </g>
          <path d="M570 100 C 590 100, 590 100, 600 100" stroke="#ffb454" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          <path d="M600 170 C 590 170, 590 100, 570 100" stroke="#ffb454" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
        </svg>
        <figcaption>Native labs live entirely in the left box. Heavy simulators run as optional jobs and feed the same data layer.</figcaption>
      </figure>

      <section className="layers">
        {layers.map((l) => (
          <article key={l.name}>
            <h2>{l.name}</h2>
            <h3>Implemented</h3>
            <p>{l.now}</p>
            <h3>Roadmap</h3>
            <p>{l.next}</p>
          </article>
        ))}
      </section>

      <section className="engine-table">
        <h2>Engines by capability</h2>
        <table>
          <thead>
            <tr>
              <th>Capability</th>
              <th>Engines</th>
              <th>What they bring</th>
            </tr>
          </thead>
          <tbody>
            {engines.map(([a, b, c]) => (
              <tr key={a}>
                <td>{a}</td>
                <td>{b}</td>
                <td>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="contract">
        <h2>Adding a scene</h2>
        <p>
          A lab is a registry entry plus one engine component. The registry declares typed controls, a legend and the
          assumptions text; the engine receives parameters, a play flag, a reset counter and an optional binary asset,
          and reports telemetry. The shell handles transport, export and layout, so a new scene is usually one file.
        </p>
        <pre>
          <code>{`export type EngineProps = {
  params: Record<string, number | boolean | string>;
  playing: boolean;
  resetKey: number;
  asset: ArrayBuffer | null;
  onTelemetry: (t: Record<string, string | number>) => void;
};`}</code>
        </pre>
      </section>
      <Footer />
    </main>
  );
}
