import Link from "next/link";
import { projects } from "../projects/data";
import CardCover from "../components/CardCover";
export const metadata = { title: "地图与空间示例" };
export default function Examples() {
  return (
    <main className="shell project-page">
      <Link className="back" href="/">
        ← 返回平台
      </Link>
      <header>
        <h1>地图与空间示例</h1>
        <p className="lede">
          已有图层和地图实验。未配置地图服务时会显示明确标注的合成 3D 示例。
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
