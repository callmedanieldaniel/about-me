import Scene from "./Scene";

export default function Home() {
  return (
    <>
      <Scene />

      <header className="nav">
        <div className="brand"><span className="dot" /> SHEN&nbsp;YANG</div>
        <nav>
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#case">Case</a>
          <a href="#stack">Stack</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="kicker">FRONTEND&nbsp;·&nbsp;AUTONOMOUS&nbsp;DRIVING&nbsp;TOOLING</div>
          <h1>
            I build the tooling<br />
            that ships <span className="hl">autonomy</span>.
          </h1>
          <p className="lede">
            8+ years in frontend. The last 4 spent building 3D scene viewers,
            multi-sensor playback, and ML training dashboards for AD teams at{" "}
            <b>DiDi</b> and <b>NIO</b>. The Tesla Autopilot AI Tooling JD
            describes the work I&apos;ve been doing.
          </p>
          <div className="cta">
            <a className="btn primary" href="#case">See the work →</a>
            <a className="btn" href="https://github.com/callmedanieldaniel" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="btn" href="mailto:tell.k@outlook.com">Email</a>
          </div>
          <div className="meta">
            <span>Shanghai · open to relocation (tier-1 CN)</span>
            <span>·</span>
            <span>2–4 weeks to start</span>
          </div>
        </section>

        <section id="about" className="block">
          <div className="label">01 / ABOUT</div>
          <div className="grid two">
            <div>
              <h2>Frontend engineer with a focus on AD &amp; robotics ML tooling.</h2>
            </div>
            <div className="prose">
              <p>
                I build internal tools that AD researchers actually live in —
                annotation, scene playback, training monitoring, experiment
                dashboards. I care about <b>frame-accurate</b> rendering,{" "}
                <b>low-latency</b> sensor streams, and APIs the perception
                team enjoys using.
              </p>
              <p>
                Currently full-stack architect on a financial AI analytics product —
                real-time visualization, streaming pipelines, React / Next.js / Go /
                Python (FastAPI) / gRPC / WebSocket. The shape of the problem is the
                same as AD tooling; the domain is what I want to come back to.
              </p>
              <p>Tesla shareholder. Want to help ship FSD in China.</p>
            </div>
          </div>
        </section>

        <section id="work" className="block">
          <div className="label">02 / WORK</div>
          <ol className="timeline">
            <li>
              <div className="when">2024 — Now</div>
              <div>
                <h3>Full-Stack Architect · Innovation Platform Team</h3>
                <p>Financial AI analytics product, end-to-end. Real-time data viz, high-performance streaming &amp; processing. React, Next.js, Go, Python (FastAPI), gRPC, WebSocket.</p>
              </div>
            </li>
            <li>
              <div className="when">2022 — 2024</div>
              <div>
                <h3>Frontend Lead, AD AI Tooling Platform · DiDi</h3>
                <p>Built the model-training toolchain behind every AD iteration — data, perception, planning, simulation. 3D scene viewer on Three.js / WebGL, rosbridge ↔ browser, 200 Mb/s gRPC / Protobuf pipeline, multi-stream H.264 / WebCodecs &lt;100ms. ~200% rendering perf gain. Annual Efficiency Contribution Award.</p>
              </div>
            </li>
            <li>
              <div className="when">2021 — 2022</div>
              <div>
                <h3>Frontend Owner, AD Data Platform · NIO</h3>
                <p>Data labeling, scene management and review tooling for the autonomous-driving data team.</p>
              </div>
            </li>
            <li>
              <div className="when">2019 — 2021</div>
              <div>
                <h3>Frontend Owner, AMap Visualization · Alibaba</h3>
                <p>Map &amp; geospatial visualization. Open-source contributor to Mapv.</p>
              </div>
            </li>
            <li>
              <div className="when">2017 — 2019</div>
              <div>
                <h3>Frontend Engineer, Maps &amp; Open Platform · Baidu</h3>
                <p>Web SDK and developer tooling for Baidu Maps Open Platform.</p>
              </div>
            </li>
          </ol>
          <div className="edu">
            <span>Peking University — M.E.M., 2020–2022</span>
            <span>·</span>
            <span>Qufu Normal University — B.Eng. Automation, 2013–2017</span>
          </div>
        </section>

        <section id="case" className="block">
          <div className="label">03 / CASE STUDY</div>
          <h2>
            DiDi AD Model-Training Toolchain
            <span className="muted"> · 2022–2024</span>
          </h2>

          <div className="grid two case">
            <div>
              <h4>Problem</h4>
              <p>AD researchers couldn&apos;t replay multi-sensor scenes (point cloud, camera, LiDAR) in the browser at full fidelity. They kept falling back to desktop ROS tools — fragmenting the toolchain, slowing every iteration.</p>
            </div>
            <div>
              <h4>What I built</h4>
              <ul>
                <li>Three.js / WebGL rendering engine on top of RViz &amp; Foxglove (Webviz), with PlotJuggler-style telemetry plots.</li>
                <li>ROS ↔ web bridge via rosbridge — streamed <code>rosbag2</code> recordings and live ROS topics straight to the browser.</li>
                <li>200 Mb/s end-to-end gRPC / Protobuf pipeline + multi-stream WebCodecs / H.264 at &lt;100 ms latency, 20 FPS.</li>
                <li>One rendering engine, three surfaces — same code path drove React, Vue, and the Android in-vehicle HMI.</li>
              </ul>
            </div>
          </div>

          <div className="kpis">
            <div><b>~200%</b><span>rendering perf gain</span></div>
            <div><b>&lt;100 ms</b><span>multi-stream video latency</span></div>
            <div><b>&gt;4 h/day</b><span>per-researcher time-in-tool</span></div>
            <div><b>Annual</b><span>Efficiency Contribution Award</span></div>
          </div>
        </section>

        <section id="stack" className="block">
          <div className="label">04 / STACK</div>
          <div className="grid stack">
            <div>
              <h4>Languages</h4>
              <p>TypeScript / JavaScript · Python · Go · C++ (working)</p>
            </div>
            <div>
              <h4>3D &amp; Visualization</h4>
              <p>Three.js · WebGL · Canvas · RViz · Foxglove (Webviz) · PlotJuggler · ECharts · D3</p>
            </div>
            <div>
              <h4>ROS &amp; Streaming</h4>
              <p>rosbridge · rosbag2 · Protobuf · WebCodecs · H.264 · WebRTC · WebSocket · SSE</p>
            </div>
            <div>
              <h4>Frontend</h4>
              <p>React · Next.js · React Native · Redux · TypeScript</p>
            </div>
            <div>
              <h4>Backend</h4>
              <p>Node.js · Go · Python (FastAPI) · gRPC</p>
            </div>
            <div>
              <h4>Mapping &amp; Infra</h4>
              <p>Leaflet · Mapbox · Mapv (OSS) · PostgreSQL · Redis · Kafka · Docker</p>
            </div>
          </div>
        </section>

        <section id="contact" className="block contact">
          <div className="label">05 / CONTACT</div>
          <h2>Let&apos;s build the tooling FSD needs in China.</h2>
          <div className="cta">
            <a className="btn primary" href="mailto:tell.k@outlook.com">tell.k@outlook.com</a>
            <a className="btn" href="https://github.com/callmedanieldaniel" target="_blank" rel="noopener noreferrer">github.com/callmedanieldaniel</a>
          </div>
        </section>
      </main>

      <footer className="site">
        <span>© {new Date().getFullYear()} Shen Yang</span>
        <span className="mono">built with next.js · three.js</span>
      </footer>
    </>
  );
}
