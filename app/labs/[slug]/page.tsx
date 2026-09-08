import Link from "next/link";
import { notFound } from "next/navigation";
import { labs } from "../../platform/catalog";
import LabWorkbench from "../../platform/LabWorkbench";
export function generateStaticParams() {
  return labs.map((s) => ({ slug: s.lab }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: labs.find((s) => s.lab === slug)?.title ?? "实验室" };
}
export default async function LabPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scene = labs.find((s) => s.lab === slug);
  if (!scene) notFound();
  return (
    <main className="platform-shell lab-page">
      <header className="lab-page-heading">
        <div>
          <Link href="/" className="back">
            ← 返回场景库
          </Link>
          <p className="eyebrow">{scene.domain} / LOCAL LAB</p>
          <h1>{scene.title}</h1>
          <p>{scene.problem}</p>
        </div>
        <a href={scene.source} target="_blank" rel="noopener noreferrer">
          {scene.sourceLabel} ↗
        </a>
      </header>
      <LabWorkbench key={scene.lab} kind={scene.lab} />
      <footer className="platform-footer">
        <span>{scene.engine}</span>
        <Link href="/methodology">计算假设与数据边界</Link>
      </footer>
    </main>
  );
}
