import Link from "next/link";
import { notFound } from "next/navigation";
import { domainOf, domains } from "../scenes/domains";
import { scenesIn } from "../scenes/registry";
import { Glyph } from "../components/Glyph";

export function generateStaticParams() {
  return domains.map((d) => ({ domain: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const d = domainOf(domain);
  return { title: d ? `${d.name} — XVIS` : "XVIS", description: d?.blurb };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const d = domainOf(domain);
  if (!d) notFound();
  const list = scenesIn(domain);
  const demoCount = list.reduce((n, s) => n + s.demos.length, 0);
  return (
    <main className="page domain-page" style={{ ["--hue" as string]: d.hue }}>
      <header className="domain-head reveal">
        <p className="crumb">
          <Link href="/">XVIS</Link> / {d.name}
        </p>
        <div className="domain-title">
          <Glyph id={d.icon} size={64} />
          <div>
            <h1>{d.name}</h1>
            <p className="lead">{d.blurb}</p>
          </div>
        </div>
        <div className="stats">
          <div>
            <b>{list.length}</b> scenes
          </div>
          <div>
            <b>{demoCount}</b> demos
          </div>
          <div>
            <b>0</b> external redirects
          </div>
        </div>
      </header>
      <ol className="scene-list">
        {list.map((s, i) => (
          <li key={s.id} className="scene-row reveal" style={{ animationDelay: `${i * 60}ms` }}>
            <Link href={`/${domain}/${s.id}`} className="scene-link">
              <span className="scene-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="scene-main">
                <strong>{s.title}</strong>
                <span className="scene-q">{s.question}</span>
              </span>
              <span className="scene-demos">
                {s.demos.map((dm) => (
                  <span key={dm.id} className="demo-pill">
                    {dm.title}
                  </span>
                ))}
              </span>
              <span className="scene-arrow">→</span>
            </Link>
          </li>
        ))}
      </ol>
      <nav className="domain-nav">
        {domains.map((x) => (
          <Link key={x.id} href={`/${x.id}`} className={x.id === domain ? "on" : ""}>
            {x.short}
          </Link>
        ))}
      </nav>
    </main>
  );
}
