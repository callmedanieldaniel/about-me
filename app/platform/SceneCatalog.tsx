"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { scenes, domains } from "./catalog";
export default function SceneCatalog() {
  const [domain, setDomain] = useState("全部"),
    [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      scenes.filter(
        (s) =>
          (domain === "全部" || s.domain === domain) &&
          `${s.title} ${s.problem} ${s.engine} ${s.input}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [domain, query],
  );
  return (
    <section className="platform-catalog" id="scenes">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">SCENE DIRECTORY</p>
          <h2>从问题出发，选择工具。</h2>
        </div>
        <label className="scene-search">
          <span className="sr-only">搜索场景、引擎或文件格式</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索场景、引擎、文件格式…"
          />
        </label>
      </div>
      <div className="domain-filters" role="group" aria-label="按领域筛选">
        {["全部", ...domains].map((d) => (
          <button
            type="button"
            key={d}
            aria-pressed={domain === d}
            onClick={() => setDomain(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <p className="catalog-note" aria-live="polite">
        {filtered.length} 个场景 · {scenes.filter((s) => s.lab).length}{" "}
        个本地实验室可运行。其余条目提供真实引擎入口与接入方案，尚未集成到平台。
      </p>
      <div className="scenario-grid">
        {filtered.map((s) => (
          <article className="scenario-card" key={s.id}>
            <div className="scenario-card-top">
              <span>{s.domain}</span>
              <span className={s.lab ? "availability local" : "availability"}>
                {s.lab ? "可运行" : "引擎参考"}
              </span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.problem}</p>
            <dl>
              <div>
                <dt>输入</dt>
                <dd>{s.input}</dd>
              </div>
              <div>
                <dt>输出</dt>
                <dd>{s.output}</dd>
              </div>
            </dl>
            <div className="scenario-engine">{s.engine}</div>
            <div className="scenario-actions">
              {s.lab ? (
                <Link href={`/labs/${s.lab}`}>打开实验室 ↗</Link>
              ) : (
                <a href={s.source} target="_blank" rel="noopener noreferrer">
                  {s.sourceLabel} ↗
                </a>
              )}
              <span>{s.priority}</span>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="catalog-empty">
          <p>没有匹配的场景。</p>
          <button
            type="button"
            onClick={() => {
              setDomain("全部");
              setQuery("");
            }}
          >
            清除筛选
          </button>
        </div>
      )}
    </section>
  );
}
