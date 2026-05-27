export default function Home() {
  return (
    <main>
      <header className="intro">
        <h1>Shen Yang</h1>
        <p className="role">
          Frontend engineer. Eight years building developer tooling, 3D scene
          viewers, and real-time visualization for autonomous-driving and ML
          teams.
        </p>
        <div className="links">
          <a href="mailto:tell.k@outlook.com">tell.k@outlook.com</a>
          <a
            href="https://github.com/callmedanieldaniel"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span>Shanghai · open to relocation (tier-1 China)</span>
        </div>
      </header>

      <section>
        <h2>About</h2>
        <p>
          I build the internal tools that ML and autonomous-driving teams use
          every day — annotation, scene playback, training monitoring,
          experiment dashboards. I care about frame-accurate rendering,
          low-latency sensor streams, and APIs the perception team enjoys
          using.
        </p>
        <p>
          I&apos;m currently a full-stack architect on a financial AI analytics
          product, owning real-time visualization and the streaming pipeline
          end-to-end (React, Next.js, Go, Python/FastAPI, gRPC, WebSocket). The
          shape of the problem is the same as AD tooling; AD tooling is the
          domain I want to come back to.
        </p>
        <p>
          The Tesla Autopilot AI Tooling JD describes the work I&apos;ve been
          doing for the past four years.
        </p>
      </section>

      <section>
        <h2>Experience</h2>
        <ul className="plain">
          <li className="entry">
            <div>
              <div className="role-line">Full-Stack Architect</div>
              <div className="org">Innovation Platform Team</div>
            </div>
            <div className="when">May 2024 — Present</div>
            <p className="detail">
              Building a financial AI analytics product end-to-end. Real-time
              visualization, high-performance streaming and processing. React,
              Next.js, Go, Python (FastAPI), gRPC, WebSocket.
            </p>
          </li>

          <li className="entry">
            <div>
              <div className="role-line">
                Frontend Lead, AD AI Tooling Platform
              </div>
              <div className="org">DiDi</div>
            </div>
            <div className="when">Sep 2022 — Apr 2024</div>
            <p className="detail">
              Led the browser-based model-training toolchain behind every AD
              iteration — data, perception, planning, simulation. See selected
              project below.
            </p>
          </li>

          <li className="entry">
            <div>
              <div className="role-line">Frontend Owner, AD Data Platform</div>
              <div className="org">NIO</div>
            </div>
            <div className="when">Apr 2021 — Sep 2022</div>
            <p className="detail">
              Data labeling, scene management, and review tooling for the
              autonomous-driving data team.
            </p>
          </li>

          <li className="entry">
            <div>
              <div className="role-line">
                Frontend Owner, AMap Visualization
              </div>
              <div className="org">Alibaba</div>
            </div>
            <div className="when">Aug 2019 — Apr 2021</div>
            <p className="detail">
              Map and geospatial visualization. Open-source contributor to
              Mapv.
            </p>
          </li>

          <li className="entry">
            <div>
              <div className="role-line">
                Frontend Engineer, Maps &amp; Open Platform
              </div>
              <div className="org">Baidu</div>
            </div>
            <div className="when">Jul 2017 — Aug 2019</div>
            <p className="detail">
              Web SDK and developer tooling for the Baidu Maps Open Platform.
            </p>
          </li>
        </ul>
      </section>

      <section className="project">
        <h2>Selected Project</h2>
        <h3>DiDi AD Model-Training Toolchain</h3>
        <p className="meta">2022 — 2024 · Frontend Lead</p>

        <p>
          The platform behind every model iteration for DiDi&apos;s data,
          perception, planning, and simulation teams.
        </p>

        <p>
          <strong>Problem.</strong> AD researchers couldn&apos;t replay
          multi-sensor scenes (point cloud, camera, LiDAR) in the browser at
          full fidelity. They kept falling back to desktop ROS tools,
          fragmenting the toolchain and slowing iteration.
        </p>

        <p>
          <strong>What I built.</strong>
        </p>
        <ul>
          <li>
            Three.js / WebGL rendering engine on top of RViz and Foxglove
            (Webviz), with PlotJuggler-style telemetry plots.
          </li>
          <li>
            ROS-to-web bridge via rosbridge — streamed rosbag2 recordings and
            live ROS topics directly to the browser.
          </li>
          <li>
            200 Mb/s end-to-end gRPC / Protobuf pipeline plus multi-stream
            WebCodecs / H.264 video at &lt;100 ms latency, 20 FPS.
          </li>
          <li>
            Unified React / Vue / Android rendering engine — same code path
            powered the web tools and the in-vehicle HMI.
          </li>
        </ul>

        <div className="impact">
          <p>
            <strong>Impact.</strong>
          </p>
          <ul>
            <li>~200% rendering performance gain.</li>
            <li>
              Adopted as the AD data team&apos;s primary daily workspace (&gt;4
              hours daily time-in-tool per researcher).
            </li>
            <li>Earned the company-wide annual Efficiency Contribution Award.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Skills</h2>

        <div className="skills-group">
          <span className="k">Languages</span>
          <span className="v">
            TypeScript / JavaScript (8+ yrs) · Python · Go · C++ (working)
          </span>
        </div>

        <div className="skills-group">
          <span className="k">3D &amp; Viz</span>
          <span className="v">
            Three.js · WebGL · Canvas · RViz · Foxglove (Webviz) · PlotJuggler ·
            ECharts · D3
          </span>
        </div>

        <div className="skills-group">
          <span className="k">ROS &amp; Streaming</span>
          <span className="v">
            rosbridge · rosbag2 · Protobuf · WebCodecs · H.264 · WebRTC ·
            WebSocket · SSE
          </span>
        </div>

        <div className="skills-group">
          <span className="k">Frontend</span>
          <span className="v">
            React · Next.js · React Native · Redux · TypeScript
          </span>
        </div>

        <div className="skills-group">
          <span className="k">Backend</span>
          <span className="v">Node.js · Go · Python (FastAPI) · gRPC</span>
        </div>

        <div className="skills-group">
          <span className="k">Mapping</span>
          <span className="v">
            Leaflet · Mapbox · Mapv (open-source contributor)
          </span>
        </div>

        <div className="skills-group">
          <span className="k">Data / Infra</span>
          <span className="v">PostgreSQL · Redis · Kafka · Docker</span>
        </div>

        <div className="skills-group">
          <span className="k">Platforms</span>
          <span className="v">macOS · Linux / Ubuntu</span>
        </div>
      </section>

      <section>
        <h2>Education</h2>
        <ul className="plain">
          <li className="entry">
            <div>
              <div className="role-line">
                Peking University &mdash; M.E.M. (Engineering Management)
              </div>
            </div>
            <div className="when">2020 — 2022</div>
          </li>
          <li className="entry">
            <div>
              <div className="role-line">
                Qufu Normal University &mdash; B.Eng., Automation
              </div>
            </div>
            <div className="when">2013 — 2017</div>
          </li>
        </ul>
      </section>

      <section>
        <h2>Why Tesla</h2>
        <p>
          Four years building autonomous-driving tooling at NIO and DiDi gave me
          deep respect for Tesla&apos;s technical direction — enough that
          I&apos;m a long-term shareholder. I want to help accelerate FSD&apos;s
          rollout in China and bring this experience to drivers here. This is
          the work I&apos;m here to do.
        </p>
        <p>Onboarding: 2 – 4 weeks from offer.</p>
      </section>

      <footer className="foot">
        <a href="mailto:tell.k@outlook.com">tell.k@outlook.com</a> ·{" "}
        <a
          href="https://github.com/callmedanieldaniel"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/callmedanieldaniel
        </a>
      </footer>
    </main>
  );
}
