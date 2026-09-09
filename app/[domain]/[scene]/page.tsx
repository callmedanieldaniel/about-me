import Link from "next/link";
import { notFound } from "next/navigation";
import { domainOf, domains } from "../../scenes/domains";
import { sceneOf, scenes, scenesIn } from "../../scenes/registry";
import SceneShell from "../../scenes/SceneShell";

export function generateStaticParams() {
  return scenes.map((s) => ({ domain: s.domain, scene: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string; scene: string }> }) {
  const { scene } = await params;
  const s = sceneOf(scene);
  return { title: s ? `${s.title} — OMNIVIS` : "OMNIVIS", description: s?.question };
}

export default async function ScenePage({ params }: { params: Promise<{ domain: string; scene: string }> }) {
  const { domain, scene } = await params;
  const s = sceneOf(scene);
  const d = domainOf(domain);
  if (!s || !d || s.domain !== domain) notFound();
  const siblings = scenesIn(domain);
  const idx = siblings.findIndex((x) => x.id === s.id);
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length];
  const next = siblings[(idx + 1) % siblings.length];
  const di = domains.findIndex((x) => x.id === domain);
  const nextDomain = domains[(di + 1) % domains.length];
  return (
    <main className="page scene-page" style={{ ["--hue" as string]: d.hue }}>
      <header className="lab-head reveal">
        <div>
        <p className="crumb">
          <Link href="/">OMNIVIS</Link> / <Link href={`/${d.id}`}>{d.name}</Link>
        </p>
        <h1>{s.title}</h1>
        <p className="lead">{s.question}</p>
        </div>
        <div className="lab-meta"><dl>
          <dt>Input</dt>
          <dd>{s.input}</dd>
          <dt>Output</dt>
          <dd>{s.output}</dd>
          <dt>Demos</dt>
          <dd>{s.demos.length} · all run in the browser</dd>
        </dl></div>
      </header>
      <SceneShell sceneId={s.id} />
      <nav className="pager">
        <Link href={`/${domain}/${prev.id}`}>← {prev.title}</Link>
        <Link href={`/${nextDomain.id}`} className="pager-mid">
          Next domain: {nextDomain.short} →
        </Link>
        <Link href={`/${domain}/${next.id}`}>{next.title} →</Link>
      </nav>
    </main>
  );
}
