import Link from "next/link";
import { projects } from "./projects/data";
import CardCover from "./components/CardCover";

export default function Home() {
  return (
    <div className="shell">
      <div className="nav">
        <div className="brand"><span className="dot" />ZIV</div>
        <nav>
          <a href="#work">work</a>
          <a href="https://github.com/callmedanieldaniel" target="_blank" rel="noopener noreferrer">github</a>
        </nav>
      </div>

      <section className="hero">
        <h1>
          I build <em>visualization tooling</em> — maps, 3D scene viewers, big-data dashboards.
        </h1>
        <p className="sub">
          Eight years of frontend at the intersection of <b>geospatial data</b>, <b>WebGL</b>, and
          <b> real-time streaming</b>. Map SDKs at Baidu and Alibaba; AD scene-viewer + telemetry workspace at
          DiDi; data-platform tooling at NIO.
        </p>
        <div className="tags">
          <span>Three.js / WebGL</span>
          <span>Canvas</span>
          <span>React · Next.js</span>
          <span>rosbridge · Protobuf</span>
          <span>gRPC · WebSocket</span>
          <span>L7 · Loca · Mapv</span>
        </div>
      </section>

      <section className="section" id="work">
        <div className="section-head">
          <h2>Selected Work</h2>
          <span className="count">{projects.length} projects · click any to open</span>
        </div>

        <div className="cards">
          {projects.map((p) => (
            <Link key={p.slug} className="card" href={`/projects/${p.slug}`}>
              <div className="cover">
                <CardCover kind={p.cover} />
              </div>
              <div className="meta">
                <div className="row1">
                  <h3>{p.title}</h3>
                  <span className="org">{p.org}</span>
                </div>
                <p>{p.tagline}</p>
                <div className="tag-row">
                  {p.tags.map((t) => <span key={t}>{t}</span>)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="foot">
        <span>© {new Date().getFullYear()} ZIV · <a href="mailto:ziv.king@outlook.com">ziv.king@outlook.com</a></span>
        <a href="https://github.com/callmedanieldaniel" target="_blank" rel="noopener noreferrer">github.com/callmedanieldaniel</a>
      </footer>
    </div>
  );
}
