"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Preview } from "./Preview";
import { domains } from "../scenes/domains";

// Auto-rotating showcase of the domains: large live preview + domain copy + route, with a progress ring.
export function Showcase({ counts }: { counts: Record<string, { scenes: number; demos: number; first: string }> }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const id = setInterval(() => setI((k) => (k + 1) % domains.length), 5000); return () => clearInterval(id); }, [paused]);
  const d = domains[i];
  return (
    <section className="showcase" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} style={{ ["--hue" as string]: d.hue }}>
      <div className="sc-stage">
        <Preview key={d.id} kind={d.id} className="sc-canvas" seed={3} />
        <div className="sc-corners" aria-hidden />
        <div className="sc-scan" aria-hidden />
        <Link href={`/${d.id}/${counts[d.id].first}`} className="sc-route">/{d.id}/{counts[d.id].first} →</Link>
      </div>
      <div className="sc-copy" key={d.id}>
        <p className="eyebrow">{String(i + 1).padStart(2, "0")} / {domains.length}</p>
        <h2>{d.name}</h2>
        <p>{d.blurb}</p>
        <p className="sc-meta">{counts[d.id].scenes} scenes · {counts[d.id].demos} demos · all in the browser</p>
        <Link href={`/${d.id}`} className="btn btn-primary">Open {d.short}</Link>
      </div>
      <ol className="sc-dots" aria-label="Domains">
        {domains.map((x, k) => (
          <li key={x.id}><button type="button" className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={x.name} style={{ ["--hue" as string]: x.hue }}>{k === i && !paused ? <span className="sc-progress" /> : null}</button></li>
        ))}
      </ol>
    </section>
  );
}
