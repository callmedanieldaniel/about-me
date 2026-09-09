import Link from "next/link";
import Hero from "./components/Hero";
import { Glyph } from "./components/Glyph";
import { domains } from "./scenes/domains";
import { scenes, scenesIn, featured, libCount } from "./scenes/registry";

export default function Home() {
  const demoCount = scenes.reduce((n, s) => n + s.demos.length, 0);
  return (
    <main className="shell">
      <section className="hero">
        <Hero />
        <div className="hero-copy">
          <p className="eyebrow reveal">Open visualization platform</p>
          <h1 className="reveal">
            Visualize
            <br />
            <span className="grad">everything.</span>
          </h1>
          <p className="reveal" style={{ animationDelay: "120ms" }}>
            {demoCount} interactive demos across driving, triage, map engines, embodied AI, simulation, annotation and the data loop. Every one runs in this site, in your browser, and names the engine it is built on.
          </p>
          <div className="hero-actions reveal" style={{ animationDelay: "200ms" }}>
            <Link href="/driving/perception" className="btn btn-primary">
              Open LiDAR perception
            </Link>
            <Link href="/annotation/lidar-cuboid" className="btn">
              Try the annotation tool
            </Link>
          </div>
        </div>
        <ul className="hero-stats" aria-label="Platform at a glance">
          <li>
            <b data-count={demoCount}>{demoCount}</b>
            <span>demos, zero redirects</span>
          </li>
          <li>
            <b data-count={scenes.length}>{scenes.length}</b>
            <span>scenes, ≤ 3 demos each</span>
          </li>
          <li>
            <b data-count={libCount}>{libCount}</b>
            <span>open-source libraries and engines credited</span>
          </li>
        </ul>
      </section>

      <section className="domains" id="domains" aria-labelledby="domains-title">
        <div className="section-head">
          <h2 id="domains-title">Twelve domains, one method</h2>
          <p>Pick a domain. Each scene answers one question with up to three demos that differ in what they compute, not just how they look.</p>
        </div>
        <div className="domain-grid">
          {domains.map((d, i) => {
            const list = scenesIn(d.id);
            const n = list.reduce((k, s) => k + s.demos.length, 0);
            return (
              <Link href={`/${d.id}`} className="domain-card reveal" key={d.id} style={{ ["--hue" as string]: d.hue, animationDelay: `${i * 50}ms` }}>
                <Glyph id={d.icon} />
                <div className="dc-body">
                  <h3>{d.name}</h3>
                  <p>{d.blurb}</p>
                </div>
                <div className="dc-foot">
                  <span>
                    {list.length} scenes · {n} demos
                  </span>
                  <span className="arrow">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="featured" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">Start here</h2>
          <p>The demos that show the most in the first thirty seconds.</p>
        </div>
        <div className="feat-grid">
          {featured.map(({ scene, demo }, i) => {
            const d = domains.find((x) => x.id === scene.domain)!;
            return (
              <Link key={`${scene.id}-${demo.id}`} href={`/${scene.domain}/${scene.id}?demo=${demo.id}`} className="feat-card reveal" style={{ ["--hue" as string]: d.hue, animationDelay: `${i * 70}ms` }}>
                <span className="feat-domain">{d.short}</span>
                <h3>{demo.title}</h3>
                <p>{demo.summary}</p>
                <span className="feat-libs">{demo.libs.slice(0, 3).map((l) => l.name).join(" · ")}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="method-strip" aria-labelledby="method-title">
        <div className="method-intro">
          <h2 id="method-title">One pipeline, every domain</h2>
          <p>A scene is not a picture. It is a question, a data contract, an engine that computes the answer, a view that makes the answer legible, and evidence you can export and reproduce.</p>
          <Link href="/methodology" className="btn">
            Read the method
          </Link>
        </div>
        <ol className="pipeline">
          {[
            ["Question", "“Which candidate trajectory did the planner pick, and why?”"],
            ["Data contract", "Typed inputs, units, synthetic vs recorded"],
            ["Engine", "Planner, MuJoCo, deck.gl, LOB, transformer…"],
            ["View", "3D stage, BEV inset, plots, maps, timelines"],
            ["Evidence", "Telemetry strip, JSON export, stated assumptions"],
          ].map(([t, s], i) => (
            <li key={t}>
              <b>{t}</b>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
