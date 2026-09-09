"use client";
import { useEffect, useMemo, useState } from "react";
import { makeObjects } from "../../kit/pointcloud";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Ontology & rule validation: a label set is checked against the class ontology (allowed dims, required attributes, overlap, off-ground) and each violation is listed with a fix suggestion.
type Label = { id: number; cls: string; l: number; w: number; h: number; x: number; z: number; y: number; attrs: Record<string, string> };
const ONTOLOGY: Record<string, { dims: [number, number][]; attrs: string[] }> = {
  car: { dims: [[3.2, 6.0], [1.5, 2.3], [1.2, 2.2]], attrs: ["occlusion", "moving"] },
  pedestrian: { dims: [[0.3, 1.2], [0.3, 1.2], [1.2, 2.1]], attrs: ["occlusion", "pose"] },
  cyclist: { dims: [[1.2, 2.4], [0.4, 1.0], [1.2, 2.0]], attrs: ["occlusion", "moving"] },
};

export default function Validation({ params, resetKey, onTelemetry }: EngineProps) {
  const [fixed, setFixed] = useState<Set<number>>(new Set());
  useEffect(() => setFixed(new Set()), [resetKey]);
  const labels = useMemo<Label[]>(() => { const rng = mulberry32(77); return makeObjects(55, 12).map((o, i) => { const lab: Label = { id: i + 1, cls: o.cls, l: o.l, w: o.w, h: o.h, x: o.x, z: o.z, y: 0, attrs: { occlusion: ["none", "partial", "heavy"][Math.floor(rng() * 3)], moving: rng() < 0.5 ? "yes" : "no", pose: "walking" } }; const f = rng(); if (f < 0.2) lab.h *= 2.4; else if (f < 0.35) lab.y = 0.9; else if (f < 0.5) delete lab.attrs.occlusion; else if (f < 0.6) lab.cls = "truck"; return lab; }); }, []);
  const issues = useMemo(() => {
    const out: { id: number; rule: string; msg: string; fix: string; sev: "error" | "warn" }[] = [];
    const strict = Boolean(params.strict);
    for (const l of labels) {
      const ont = ONTOLOGY[l.cls];
      if (!ont) { out.push({ id: l.id, rule: "ontology", msg: `class "${l.cls}" is not in the ontology`, fix: "map to car / pedestrian / cyclist", sev: "error" }); continue; }
      const dims = [l.l, l.w, l.h]; ["length", "width", "height"].forEach((n, k) => { const [lo, hi] = ont.dims[k]; if (dims[k] < lo || dims[k] > hi) out.push({ id: l.id, rule: "dimension", msg: `${n} ${dims[k].toFixed(2)} m outside ${lo}–${hi} m for ${l.cls}`, fix: "resize box or change class", sev: "error" }); });
      for (const a of ont.attrs) if (!(a in l.attrs)) out.push({ id: l.id, rule: "attribute", msg: `missing required attribute "${a}"`, fix: `set ${a}`, sev: strict ? "error" : "warn" });
      if (l.y > Number(params.groundTol)) out.push({ id: l.id, rule: "ground", msg: `box floats ${l.y.toFixed(2)} m above ground`, fix: "snap bottom to ground", sev: "warn" });
      for (const m of labels) if (m.id > l.id && Math.abs(m.x - l.x) < (l.l + m.l) / 2 * 0.6 && Math.abs(m.z - l.z) < (l.w + m.w) / 2 * 0.6) out.push({ id: l.id, rule: "overlap", msg: `overlaps #${m.id}`, fix: "merge or separate", sev: "warn" });
    }
    return out.filter((i) => !fixed.has(i.id));
  }, [labels, params.strict, params.groundTol, fixed]);
  useEffect(() => { onTelemetry({ Labels: labels.length, Issues: issues.length, Errors: issues.filter((i) => i.sev === "error").length, Warnings: issues.filter((i) => i.sev === "warn").length, "Labels with issues": new Set(issues.map((i) => i.id)).size, "Fixed": fixed.size, "Pass rate %": (100 * (labels.length - new Set(issues.map((i) => i.id)).size)) / labels.length }); }, [issues, labels, fixed, onTelemetry]);
  const byRule = issues.reduce<Record<string, number>>((m, i) => ((m[i.rule] = (m[i.rule] ?? 0) + 1), m), {});
  return (
    <div className="engine-host qa-host">
      <div className="qa-summary">
        {Object.entries(ONTOLOGY).map(([k, v]) => (
          <div key={k}><b>{k}</b><span>l {v.dims[0].join("–")} · w {v.dims[1].join("–")} · h {v.dims[2].join("–")} m · attrs: {v.attrs.join(", ")}</span></div>
        ))}
        <div className="qa-bars">{Object.entries(byRule).map(([r, n]) => (<span key={r} className={`qa-pill ${r}`}>{r} {n}</span>))}</div>
      </div>
      <ul className="qa-list">
        {issues.map((i, k) => (
          <li key={k} className={i.sev}>
            <span className="qa-id">#{i.id}</span>
            <span className="qa-rule">{i.rule}</span>
            <span className="qa-msg">{i.msg}</span>
            <button type="button" onClick={() => setFixed((s) => new Set(s).add(i.id))}>Apply: {i.fix}</button>
          </li>
        ))}
        {!issues.length && <li className="ok">All labels pass the ontology rules.</li>}
      </ul>
    </div>
  );
}
