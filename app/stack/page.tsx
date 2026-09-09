import Link from "next/link";
import { domains } from "../scenes/domains";
import { scenes, scenesIn } from "../scenes/registry";
import type { Lib } from "../scenes/types";

export const metadata = { title: "Stack", description: "How OMNIVIS is built: scene registry, engines, libraries, verification." };

export default function Stack() {
  const libs = new Map<string, Lib & { uses: number }>();
  for (const s of scenes) for (const d of s.demos) for (const l of d.libs) { const e = libs.get(l.name); if (e) e.uses++; else libs.set(l.name, { ...l, uses: 1 }); }
  const list = [...libs.values()].sort((a, b) => b.uses - a.uses);
  const demoCount = scenes.reduce((n, s) => n + s.demos.length, 0);
  return (
    <main className="shell doc-page">
      <header className="doc-head reveal">
        <p className="eyebrow">Stack</p>
        <h1>How the platform is built</h1>
        <p>{scenes.length} scenes and {demoCount} demos share one shell. Every demo is a registry entry (typed controls, legend, assumptions, library credits) plus one engine component that runs in the browser. Nothing redirects; heavy engines load lazily.</p>
      </header>

      <section className="layers">
        {[
          ["Routing", "app/[domain]/[scene] with ?demo= selection. Domain and scene pages are statically generated from the registry; the shell hydrates on the client."],
          ["Shell", "SceneShell: demo tabs, transport (space / r), controls (range, toggle, select, text, file, action), telemetry strip, JSON export, key gating for map providers, Built-with panel."],
          ["Engines", "One component per demo under app/scenes/engines/<domain>. Three.js stages via createStage, canvas plots via kit/plot, real engines (MuJoCo WASM, Rapier, deck.gl, MapLibre, Cesium, @mcap/core, urdf-loader) behind shared kits."],
          ["Assets", "scripts/copy-assets.mjs copies MuJoCo and Cesium runtime files into public/vendor before dev/build; both are loaded at runtime to keep them out of the bundle."],
        ].map(([t, s]) => (
          <article key={t}><h2>{t}</h2><p>{s}</p></article>
        ))}
      </section>

      <section className="engine-table">
        <h2>Libraries and engines credited across demos</h2>
        <table>
          <thead><tr><th>Library</th><th>Version</th><th>Role</th><th>Demos</th></tr></thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.name}><td><a href={l.url} target="_blank" rel="noreferrer">{l.name}</a></td><td>{l.version ?? "—"}</td><td>{l.role}</td><td>{l.uses}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="engine-table">
        <h2>Scenes by domain</h2>
        <table>
          <thead><tr><th>Domain</th><th>Scenes</th><th>Demos</th></tr></thead>
          <tbody>
            {domains.map((d) => { const list = scenesIn(d.id); return (<tr key={d.id}><td><Link href={`/${d.id}`}>{d.name}</Link></td><td>{list.map((s) => s.title).join(" · ")}</td><td>{list.reduce((n, s) => n + s.demos.length, 0)}</td></tr>); })}
          </tbody>
        </table>
      </section>

      <section className="contract">
        <h2>Adding a demo</h2>
        <p>Add a DemoDef to a scene in app/scenes/domains/*.ts and an engine component. The engine receives parameters, a play flag, a reset counter, an optional uploaded asset and action commands, and reports telemetry.</p>
        <pre><code>{`export type EngineProps = {
  params: Record<string, number | boolean | string>;
  playing: boolean;
  resetKey: number;
  asset: ArrayBuffer | null;
  command: { name: string; seq: number } | null;
  onTelemetry: (t: Record<string, string | number>) => void;
};`}</code></pre>
      </section>
    </main>
  );
}
