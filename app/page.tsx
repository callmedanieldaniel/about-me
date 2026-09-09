import Link from "next/link";
import Catalog from "./components/Catalog";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Nav from "./components/Nav";
import { domainOf, domains, labs, scenes } from "./catalog/data";

export default function Home() {
  const engines = scenes.filter((s) => s.status === "engine").length;
  return (
    <main className="shell">
      <Nav />
      <section className="hero">
        <Hero />
        <div className="hero-copy">
          <h1>
            Visualize
            <br />
            everything.
          </h1>
          <p>
            Interactive labs for autonomous driving, embodied AI, simulation, world models, 3D twins, AI systems and
            markets. Each one runs in your browser, shows its assumptions, and lets you change the variable that
            matters.
          </p>
          <div className="hero-actions">
            <Link href="/labs/lidar" className="btn btn-primary">
              Open the LiDAR lab
            </Link>
            <a href="#catalog" className="btn">
              Browse {scenes.length} scenes
            </a>
          </div>
        </div>
        <ul className="hero-stats" aria-label="Platform at a glance">
          <li>
            <b>{labs.length}</b>
            <span>native labs, no sign-in</span>
          </li>
          <li>
            <b>{engines}</b>
            <span>real engines integrated or specified</span>
          </li>
          <li>
            <b>{domains.length}</b>
            <span>domains, one method</span>
          </li>
        </ul>
      </section>

      <section className="labs" id="labs" aria-labelledby="labs-title">
        <div className="section-head">
          <h2 id="labs-title">Start with a lab</h2>
          <p>Live computation and rendering in the page. Drag, change a parameter, export the run.</p>
        </div>
        <div className="lab-grid">
          {labs.map((s) => {
            const d = domainOf(s.domain);
            return (
              <Link href={`/labs/${s.lab}`} className="lab-card" key={s.id} style={{ "--hue": d.hue } as React.CSSProperties}>
                <LabGlyph id={s.lab!} />
                <div className="lab-card-body">
                  <small>{d.short}</small>
                  <h3>{s.title}</h3>
                  <p>{s.problem}</p>
                  <span>{s.engine}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="method-strip" aria-label="How every scene is built">
        <div>
          <h2>One pipeline, every domain</h2>
          <p>
            A scene is not a picture. It is a question, a data contract, an engine that computes the answer, a view
            that makes the answer legible, and evidence you can export and reproduce.
          </p>
        </div>
        <ol className="pipeline">
          <li>
            <b>Question</b>
            <span>“How much farther does a late brake travel?”</span>
          </li>
          <li>
            <b>Data contract</b>
            <span>Typed inputs, units, synthetic vs recorded</span>
          </li>
          <li>
            <b>Engine</b>
            <span>Analytic, rigid-body, planner, LOB, transformer…</span>
          </li>
          <li>
            <b>View</b>
            <span>3D stage, BEV inset, plots, arcs, depth</span>
          </li>
          <li>
            <b>Evidence</b>
            <span>Telemetry strip, JSON export, stated assumptions</span>
          </li>
        </ol>
      </section>

      <Catalog />

      <section className="domain-grid" aria-labelledby="domains-title">
        <h2 id="domains-title">Domains and the question each one asks</h2>
        <ul>
          {domains.map((d) => (
            <li key={d.id} style={{ "--hue": d.hue } as React.CSSProperties}>
              <i />
              <b>{d.name}</b>
              <span>{d.question}</span>
            </li>
          ))}
        </ul>
      </section>
      <Footer />
    </main>
  );
}

function LabGlyph({ id }: { id: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const };
  const g: Record<string, React.ReactNode> = {
    lidar: (
      <>
        <circle cx="32" cy="32" r="24" {...common} strokeDasharray="3 5" />
        <circle cx="32" cy="32" r="14" {...common} strokeDasharray="2 4" />
        <path d="M32 32 L52 20" {...common} stroke="#5ee7ff" strokeWidth="2" />
        <rect x="28" y="29" width="8" height="6" fill="#ffb454" />
      </>
    ),
    planner: (
      <>
        <path d="M8 44 Q 32 44 56 20" {...common} stroke="#7cf3a0" strokeWidth="2" />
        <path d="M8 44 Q 32 40 56 32" {...common} />
        <path d="M8 44 Q 32 48 56 44" {...common} />
        <path d="M8 44 Q 34 30 56 10" {...common} stroke="#ff5d73" />
      </>
    ),
    braking: (
      <>
        <path d="M6 40 H58" {...common} />
        <rect x="8" y="30" width="16" height="8" fill="#5ee7ff" />
        <rect x="8" y="46" width="16" height="8" fill="#ffb454" />
        <path d="M50 26 V58" {...common} stroke="#ff5d73" strokeWidth="3" />
      </>
    ),
    arm: (
      <>
        <circle cx="16" cy="48" r="4" {...common} />
        <path d="M16 48 L34 26 L52 32" {...common} strokeWidth="3" />
        <circle cx="52" cy="32" r="5" {...common} stroke="#ffb454" />
        <circle cx="16" cy="48" r="26" {...common} strokeDasharray="2 4" opacity="0.5" />
      </>
    ),
    gait: (
      <>
        <circle cx="32" cy="12" r="4" {...common} />
        <path d="M32 16 V32 L22 52 M32 32 L42 48 M32 20 L22 32 M32 20 L44 28" {...common} strokeWidth="2" />
        <circle cx="32" cy="30" r="2.5" fill="#7cf3a0" />
      </>
    ),
    swarm: (
      <>
        {[
          [14, 20], [24, 14], [36, 18], [46, 12], [18, 34], [30, 30], [42, 28], [52, 24], [22, 46], [34, 44], [46, 40],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l6 -2 l-4 4 z`} fill="#5ee7ff" />
        ))}
        <circle cx="38" cy="50" r="6" fill="#ff5d73" opacity="0.7" />
      </>
    ),
    physics: (
      <>
        <path d="M6 52 H58" {...common} />
        <circle cx="20" cy="42" r="8" fill="#5ee7ff" />
        <rect x="36" y="16" width="14" height="14" fill="#b99cff" transform="rotate(18 43 23)" />
        <path d="M20 8 V32" {...common} strokeDasharray="2 3" />
      </>
    ),
    model: (
      <>
        <path d="M32 8 L54 20 V44 L32 56 L10 44 V20 Z" {...common} />
        <path d="M32 8 V32 L54 20 M32 32 L10 20 M32 32 V56" {...common} />
      </>
    ),
    attention: (
      <>
        {[10, 21, 32, 43, 54].map((x) => (
          <circle key={x} cx={x} cy="44" r="3" fill="#e6eef8" />
        ))}
        <path d="M32 44 Q 21 20 10 44" {...common} stroke="#5ee7ff" strokeWidth="3" />
        <path d="M32 44 Q 26 30 21 44" {...common} stroke="#5ee7ff" />
        <path d="M32 44 Q 43 10 54 44" {...common} stroke="#5ee7ff" opacity="0.5" />
      </>
    ),
    orderbook: (
      <>
        <path d="M8 50 H30 V40 H24 V32 H16 V22 H8 Z" fill="#7cf3a0" opacity="0.8" />
        <path d="M56 50 H34 V42 H40 V30 H48 V18 H56 Z" fill="#ff5d73" opacity="0.8" />
        <path d="M32 10 V52" {...common} strokeDasharray="3 3" stroke="#5ee7ff" />
      </>
    ),
  };
  return (
    <svg className="lab-glyph" viewBox="0 0 64 64" aria-hidden="true">
      {g[id]}
    </svg>
  );
}
