import Link from "next/link";
import { projects } from "./projects/data";
import CardCover from "./components/CardCover";
import ScenePlayground from "./components/ScenePlayground";

export default function Home() {
  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="#" aria-label="Spatial engineering home">
          <span className="brand-symbol">✳</span> FIELDWORK
          <span className="brand-suffix"> / ENGINEERING</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#work">Selected work</a>
          <a href="#practice">Practice</a>
          <span className="edition">PORTFOLIO / 01</span>
        </nav>
      </header>
      <section className="hero" aria-labelledby="intro-title">
        <div className="hero-copy">
          <p className="eyebrow">CREATIVE ENGINEERING · SPATIAL SYSTEMS</p>
          <h1 id="intro-title">
            Making
            <br />
            complexity
            <br />
            <em>visible.</em>
          </h1>
          <p className="sub">
            From a single pixel to a world of data.
            <br />I build interactive tools for spatial computing,
            <br className="desktop-break" /> autonomous systems, and AI.
          </p>
          <a className="work-link" href="#work">
            Explore the work <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ScenePlayground />
      </section>
      <div className="discipline-strip">
        <span>01 / GEOSPATIAL</span>
        <span>02 / PERCEPTION</span>
        <span>03 / REAL-TIME SYSTEMS</span>
        <span>04 / CROSS-PLATFORM</span>
      </div>
      <section className="section" id="work">
        <div className="section-head">
          <div>
            <p className="eyebrow">A SELECTION OF TECHNICAL EXPLORATIONS</p>
            <h2>Systems you can see.</h2>
          </div>
          <span className="count">
            {String(projects.length).padStart(2, "0")} studies / interactive
            demos
          </span>
        </div>
        <div className="cards">
          {projects.map((p, i) => (
            <Link key={p.slug} className="card" href={`/projects/${p.slug}`}>
              <div className="cover">
                <CardCover kind={p.cover} />
                <span className="cover-index">
                  STUDY {String(i + 1).padStart(2, "0")}
                </span>
                <span className="cover-open" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="meta">
                <span className="project-category">{p.org}</span>
                <h3>{p.title}</h3>
                <p>{p.tagline}</p>
                <div className="tag-row">
                  {p.tags.slice(0, 4).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section id="practice" className="practice section">
        <div>
          <p className="eyebrow">THE PRACTICE</p>
          <h2>
            Across the stack.
            <br />
            <em>Close to the pixels.</em>
          </h2>
          <p>
            My work connects rendering engines, data pipelines, and the
            interfaces people use to understand them.
          </p>
        </div>
        <div className="practice-list">
          <article>
            <span>01</span>
            <div>
              <h3>Spatial & visual computing</h3>
              <p>
                3D scene playback, point clouds, map editing, and multi-sensor
                visualization.
              </p>
              <small>Three.js / WebGL / Canvas / GIS</small>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Real-time & AI systems</h3>
              <p>
                Streaming interfaces, AI-assisted analysis, data workflows, and
                backend services.
              </p>
              <small>Node.js / Python / Go / SSE / gRPC</small>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Interfaces & engineering</h3>
              <p>
                Cross-platform applications, reusable SDKs, rendering
                architecture, and developer tools.
              </p>
              <small>React / React Native / TypeScript / Monorepo</small>
            </div>
          </article>
        </div>
      </section>
      <footer className="foot">
        <span>FIELDWORK / AN ENGINEERING PORTFOLIO</span>
        <span>Technical work, without the personal details.</span>
        <a href="#">Back to top ↑</a>
      </footer>
    </main>
  );
}
