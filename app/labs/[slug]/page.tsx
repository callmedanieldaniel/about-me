import Link from "next/link";
import { notFound } from "next/navigation";
import { domainOf, labs } from "../../catalog/data";
import Footer from "../../components/Footer";
import Nav from "../../components/Nav";
import LabShell from "../LabShell";
import { labDefOf } from "../registry";

export function generateStaticParams() {
  return labs.map((s) => ({ slug: s.lab! }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = labs.find((x) => x.lab === slug);
  return { title: s?.title ?? "Lab", description: s?.problem };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scene = labs.find((s) => s.lab === slug);
  const def = labDefOf(slug);
  if (!scene || !def) notFound();
  const d = domainOf(scene.domain);
  const idx = labs.findIndex((s) => s.lab === slug);
  const next = labs[(idx + 1) % labs.length];
  const prev = labs[(idx - 1 + labs.length) % labs.length];
  return (
    <main className="shell lab-page">
      <Nav current="/#labs" />
      <header className="lab-head" style={{ "--hue": d.hue } as React.CSSProperties}>
        <div>
          <p className="crumb">
            <Link href="/#labs">Labs</Link> / {d.name}
          </p>
          <h1>{scene.title}</h1>
          <p className="lead">{scene.problem}</p>
        </div>
        <div className="lab-meta">
          <dl>
            <dt>Engine</dt>
            <dd>{scene.engine}</dd>
            <dt>Input</dt>
            <dd>{scene.input}</dd>
            <dt>Output</dt>
            <dd>{scene.output}</dd>
            <dt>Runs</dt>
            <dd>In the browser, locally</dd>
          </dl>
          <a href={scene.source} target="_blank" rel="noopener noreferrer">
            {scene.sourceLabel} documentation
          </a>
        </div>
      </header>
      <LabShell labId={slug} title={scene.title} />
      <nav className="lab-pager" aria-label="Other labs">
        <Link href={`/labs/${prev.lab}`}>
          <small>Previous</small>
          {prev.title}
        </Link>
        <Link href={`/labs/${next.lab}`}>
          <small>Next</small>
          {next.title}
        </Link>
      </nav>
      <Footer />
    </main>
  );
}
