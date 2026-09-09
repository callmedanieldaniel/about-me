"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { domains, scenes, type DomainId, type Status } from "../catalog/data";

const statusLabel: Record<Status, string> = {
  lab: "Native lab",
  engine: "Engine integration",
  planned: "Planned",
};

export default function Catalog() {
  const [domain, setDomain] = useState<DomainId | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scenes.filter(
      (s) =>
        (domain === "all" || s.domain === domain) &&
        (status === "all" || s.status === status) &&
        (!needle || `${s.title} ${s.problem} ${s.engine} ${s.input} ${s.output}`.toLowerCase().includes(needle)),
    );
  }, [domain, status, q]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    scenes.forEach((s) => (c[s.domain] = (c[s.domain] ?? 0) + 1));
    return c;
  }, []);

  return (
    <section className="catalog" id="catalog" aria-labelledby="catalog-title">
      <div className="catalog-head">
        <div>
          <h2 id="catalog-title">Scene catalog</h2>
          <p>
            {scenes.length} scenarios across {domains.length} domains. Each names a concrete question, its inputs and
            outputs, and the real engine that answers it.
          </p>
        </div>
        <label className="search">
          <span className="sr-only">Search scenes</span>
          <input
            type="search"
            placeholder="Search: point cloud, USD, order book…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      <div className="catalog-filters">
        <div className="chips" role="group" aria-label="Domain">
          <button type="button" aria-pressed={domain === "all"} onClick={() => setDomain("all")}>
            All domains
          </button>
          {domains.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={domain === d.id}
              style={{ "--hue": d.hue } as React.CSSProperties}
              onClick={() => setDomain(domain === d.id ? "all" : d.id)}
            >
              <i />
              {d.short}
              <small>{counts[d.id]}</small>
            </button>
          ))}
        </div>
        <div className="chips" role="group" aria-label="Status">
          {(["all", "lab", "engine", "planned"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? "Any status" : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
      <ol className="scene-list">
        {list.map((s) => {
          const d = domains.find((x) => x.id === s.domain)!;
          const inner = (
            <>
              <div className="scene-domain" style={{ "--hue": d.hue } as React.CSSProperties}>
                <i />
                <span>{d.short}</span>
              </div>
              <div className="scene-main">
                <h3>{s.title}</h3>
                <p>{s.problem}</p>
              </div>
              <dl className="scene-io">
                <dt>In</dt>
                <dd>{s.input}</dd>
                <dt>Out</dt>
                <dd>{s.output}</dd>
              </dl>
              <div className="scene-engine">
                <span className={`status status-${s.status}`}>{statusLabel[s.status]}</span>
                <b>{s.engine}</b>
                {s.status !== "lab" && (
                  <a href={s.source} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    {s.sourceLabel}
                  </a>
                )}
                {s.status === "lab" && <span className="open">Open lab</span>}
              </div>
            </>
          );
          return (
            <li key={s.id} className={`scene scene-${s.status}`}>
              {s.lab ? (
                <Link href={`/labs/${s.lab}`} className="scene-link">
                  {inner}
                </Link>
              ) : (
                <div className="scene-link">{inner}</div>
              )}
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="scene-empty">No scenes match. Try a broader term or clear the filters.</li>
        )}
      </ol>
    </section>
  );
}
