import Link from "next/link";
import { projects } from "../projects/data";
import CardCover from "../components/CardCover";
export const metadata = { title: "Geospatial archive" };
export default function Examples() {
  return (
    <main className="shell project-page">
      <Link className="back" href="/">
        ← Back to platform
      </Link>
      <header>
        <h1>Geospatial archive</h1>
        <p className="lede">
          Earlier map-layer studies kept for reference. Without map service keys configured, each page shows a clearly labeled synthetic 3D study instead.
        </p>
      </header>
      <div className="cards">
        {projects.map((p) => (
          <Link key={p.slug} className="card" href={`/projects/${p.slug}`}>
            <div className="cover">
              <CardCover kind={p.cover} />
            </div>
            <div className="meta">
              <h3>{p.title}</h3>
              <p>{p.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
