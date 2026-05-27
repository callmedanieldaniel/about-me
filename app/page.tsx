const impactMetrics = [
  { value: "200%", label: "rendering performance gain" },
  { value: "<100ms", label: "multi-stream video latency" },
  { value: "200 Mb/s", label: "gRPC / Protobuf pipeline" },
  { value: "20 FPS", label: "browser scene playback" },
] as const;

const toolchain = [
  "Three.js",
  "WebGL",
  "Canvas",
  "RViz",
  "Foxglove",
  "PlotJuggler",
  "rosbridge",
  "rosbag2",
  "Protobuf",
  "WebCodecs",
  "H.264",
  "WebRTC",
  "gRPC",
  "WebSocket",
] as const;

const experience = [
  {
    role: "Full-Stack Architect",
    org: "Innovation Platform Team",
    period: "May 2024 - Present",
    detail:
      "Building a financial AI analytics product end-to-end across real-time visualization, streaming, processing, and gateway services.",
  },
  {
    role: "Frontend Lead, AD AI Tooling Platform",
    org: "DiDi",
    period: "Sep 2022 - Apr 2024",
    detail:
      "Led browser-based autonomous-driving model-training tools for data, perception, planning, and simulation researchers.",
  },
  {
    role: "Frontend Owner, AD Data Platform",
    org: "NIO",
    period: "Apr 2021 - Sep 2022",
    detail:
      "Owned AD data workflows, visualization surfaces, and internal tooling for model iteration.",
  },
  {
    role: "Frontend Owner, AMap Visualization",
    org: "Alibaba",
    period: "Aug 2019 - Apr 2021",
    detail:
      "Built map and large-scale visualization systems, including open-source Mapv contributions.",
  },
  {
    role: "Frontend Engineer, Maps & Open Platform",
    org: "Baidu",
    period: "Jul 2017 - Aug 2019",
    detail:
      "Developed mapping, platform, and visualization products for web-scale geospatial experiences.",
  },
] as const;

const languageLevels = [
  "TypeScript / JavaScript - 8+ years, primary",
  "Python - AI agents, backend services, data processing",
  "Go - gRPC microservices and gateway layer",
  "C++ - working knowledge from AD platform integrations",
] as const;

const fitPoints = [
  "Internal tooling for autonomous-driving and robotics ML teams",
  "3D scene playback, annotation, telemetry, and experiment dashboards",
  "High-throughput browser pipelines for ROS, camera, LiDAR, and model data",
  "China-based FSD rollout perspective with relocation flexibility in tier-1 cities",
] as const;

function SceneVisual() {
  return (
    <div className="scene" aria-label="Autonomous-driving scene playback visual">
      <div className="scene__grid" />
      <div className="scene__road">
        <span className="scene__lane scene__lane--left" />
        <span className="scene__lane scene__lane--center" />
        <span className="scene__lane scene__lane--right" />
        <span className="scene__car">
          <span />
        </span>
      </div>
      <div className="scene__cloud scene__cloud--one" />
      <div className="scene__cloud scene__cloud--two" />
      <div className="scene__camera">
        <span>CAM FRONT</span>
        <b>20 FPS</b>
      </div>
      <div className="scene__telemetry">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}>) {
  return (
    <div className="section-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {children ? <div>{children}</div> : null}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header className="hero">
        <nav className="nav" aria-label="Primary navigation">
          <a href="#case-study">Case Study</a>
          <a href="#fit">Tesla Fit</a>
          <a href="#experience">Experience</a>
          <a href="https://github.com/callmedanieldaniel">GitHub</a>
        </nav>

        <div className="hero__content">
          <div className="hero__copy">
            <p className="kicker">Shanghai, China · Open to tier-1 China relocation</p>
            <h1>Shen Yang</h1>
            <p className="hero__title">AD AI Tooling Frontend Engineer</p>
            <p className="hero__summary">
              I build the browser workspace behind autonomous-driving model iteration:
              3D scene playback, multi-sensor streaming, telemetry visualization, and
              high-performance internal tools for ML researchers.
            </p>
            <div className="hero__actions" aria-label="Profile links">
              <a className="button button--primary" href="#case-study">
                View AD Tooling Work
              </a>
              <a className="button button--secondary" href="https://github.com/callmedanieldaniel">
                GitHub
              </a>
            </div>
          </div>
          <SceneVisual />
        </div>
      </header>

      <section className="metrics" aria-label="Engineering impact">
        {impactMetrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </section>

      <section className="case-study" id="case-study">
        <SectionHeading
          eyebrow="Selected work · DiDi AD Model-Training Toolchain"
          title="Browser-native replay for the full autonomous-driving scene."
        >
          <p>
            AD researchers needed to inspect point clouds, camera streams, LiDAR,
            trajectories, and telemetry in one fast web workspace instead of jumping
            between desktop ROS tools.
          </p>
        </SectionHeading>

        <div className="case-study__body">
          <div className="case-study__problem">
            <p className="label">Problem</p>
            <p>
              Researchers could not replay multi-sensor scenes in the browser at full
              fidelity. Model iteration slowed down because replay, plots, and HMI
              review lived in fragmented tools.
            </p>
          </div>
          <div className="case-study__solution">
            <p className="label">What I built</p>
            <ul>
              <li>Three.js / WebGL rendering engine on top of RViz and Foxglove.</li>
              <li>ROS-to-web bridge streaming rosbag2 recordings and live ROS topics.</li>
              <li>200 Mb/s gRPC / Protobuf pipeline with multi-stream H.264 video.</li>
              <li>Unified React / Vue / Android rendering engine for web tools and HMI.</li>
            </ul>
          </div>
          <div className="case-study__outcome">
            <p className="label">Outcome</p>
            <p>
              Adopted as the AD data team&apos;s primary daily workspace, with over
              four hours of daily time-in-tool per researcher, and recognized with a
              company-wide annual Efficiency Contribution Award.
            </p>
          </div>
        </div>
      </section>

      <section className="toolchain" aria-label="Technical toolchain">
        <SectionHeading eyebrow="Toolchain" title="Built where ML data meets the browser." />
        <div className="marquee" aria-hidden="true">
          <div>
            {[...toolchain, ...toolchain].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
        <div className="toolchain__list">
          {toolchain.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="fit" id="fit">
        <SectionHeading
          eyebrow="Tesla Autopilot AI Tooling fit"
          title="The work I want is the work I have been doing for four years."
        >
          <p>
            I want to build internal tooling and 3D visualization for AD or robotics ML
            teams: annotation, scene playback, training monitoring, and experiment dashboards.
          </p>
        </SectionHeading>
        <div className="fit__grid">
          {fitPoints.map((point) => (
            <p key={point}>{point}</p>
          ))}
        </div>
      </section>

      <section className="stack" aria-label="Languages and systems">
        <div>
          <p className="label">Languages</p>
          <ul>
            {languageLevels.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Systems</p>
          <p>
            macOS, Linux / Ubuntu, React, Next.js, React Native, Node.js, Go,
            Python FastAPI, PostgreSQL, Redis, Kafka, Docker, WebSocket, SSE.
          </p>
        </div>
        <div>
          <p className="label">Education</p>
          <p>
            Peking University, M.E.M. 2020 - 2022
            <br />
            Qufu Normal University, B.Eng. Automation 2013 - 2017
          </p>
        </div>
      </section>

      <section className="experience" id="experience">
        <SectionHeading eyebrow="Experience" title="Maps, AD data, AI tooling, and streaming systems." />
        <div className="timeline">
          {experience.map((item) => (
            <article className="timeline__item" key={`${item.org}-${item.period}`}>
              <div>
                <h3>{item.role}</h3>
                <p>{item.org}</p>
              </div>
              <time>{item.period}</time>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p className="label">Why Tesla</p>
        <h2>Help accelerate FSD rollout in China.</h2>
        <p>
          Four years building autonomous-driving tooling at NIO and DiDi gave me deep
          respect for Tesla&apos;s technical direction. I am a long-term shareholder and
          want to bring that tooling experience to the teams shipping FSD for drivers here.
        </p>
        <div className="footer__meta">
          <span>Onboarding: 2 - 4 weeks from offer</span>
          <a href="https://github.com/callmedanieldaniel">github.com/callmedanieldaniel</a>
        </div>
      </footer>
    </main>
  );
}
