import Link from "next/link";
import SceneCatalog from "./platform/SceneCatalog";
import { labs } from "./platform/catalog";
export default function Home() {
  return (
    <main className="platform-shell">
      <header className="platform-nav">
        <Link className="platform-brand" href="/">
          <span aria-hidden="true">✳</span> FIELDWORK{" "}
          <small>VISUAL SYSTEMS</small>
        </Link>
        <nav aria-label="主导航">
          <a href="#scenes">场景库</a>
          <Link href="/labs/braking">实验室</Link>
          <Link href="/methodology">方法与边界</Link>
        </nav>
      </header>
      <section className="platform-intro">
        <div>
          <p className="eyebrow">OBSERVE / UNDERSTAND / EXPERIMENT</p>
          <h1>
            让复杂系统，
            <br />
            <em>变得可理解。</em>
          </h1>
          <p>
            回放真实数据，检查空间结构，比较算法与仿真结果。
            <br />
            从自动驾驶和机器人，到 AI、数字孪生与金融分析。
          </p>
        </div>
        <div className="platform-principle">
          <span>VISUALIZE → INVESTIGATE → VERIFY</span>
          <p>每个场景，都应回答一个问题。</p>
          <div>
            <b>可操作</b>
            <b>可追溯</b>
            <b>可复现</b>
          </div>
        </div>
      </section>
      <section className="launch-section" aria-labelledby="launch-title">
        <div className="launch-heading">
          <h2 id="launch-title">直接开始实验</h2>
          <span>无需注册 · 浏览器本地运行</span>
        </div>
        <div className="launch-grid">
          {labs.map((s, i) => (
            <Link
              className={`launch-card launch-${s.lab}`}
              href={`/labs/${s.lab}`}
              key={s.id}
            >
              <span className="launch-number">0{i + 1}</span>
              <div>
                <small>{s.domain}</small>
                <h3>{s.title}</h3>
                <p>{s.engine}</p>
              </div>
              <span className="launch-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
      <SceneCatalog />
      <section className="platform-bottom">
        <h2>看到变化，也能解释变化。</h2>
        <p>
          数据来源、计算假设、交互参数和输出结果应同时可见。模拟数据会明确标注；引擎演示与平台已集成能力分别展示。
        </p>
        <Link href="/methodology">了解数据与仿真边界 ↗</Link>
      </section>
      <footer className="platform-footer">
        <span>FIELDWORK / VISUAL SYSTEMS</span>
        <Link href="/examples">地图与空间示例</Link>
        <span>Explore systems. Find evidence.</span>
      </footer>
    </main>
  );
}
