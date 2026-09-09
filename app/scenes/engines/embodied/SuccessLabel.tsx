"use client";
import { useEffect, useMemo, useState } from "react";
import { makeEpisodes } from "../../kit/episode";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// Success / failure labeling: rate episodes with a failure taxonomy, see per-task success rates and the agreement between the human label and the auto-detector (reward threshold).
const FAIL = ["grasp slip", "collision", "timeout", "wrong object", "other"];
export default function SuccessLabel({ params, resetKey, onTelemetry }: EngineProps) {
  const eps = useMemo(() => makeEpisodes(), []);
  const [labels, setLabels] = useState<Record<number, { ok: boolean; mode?: string }>>({});
  const [idx, setIdx] = useState(0);
  useEffect(() => { setLabels({}); setIdx(0); }, [resetKey]);
  const ep = eps[idx]; const ret = ep.reward.reduce((a, b) => a + b, 0);
  const auto = (e: typeof ep) => e.reward.reduce((a, b) => a + b, 0) > Number(params.threshold);
  const stats = useMemo(() => { const tasks = [...new Set(eps.map((e) => e.task))]; return tasks.map((t) => { const es = eps.filter((e) => e.task === t); const lab = es.filter((e) => labels[e.id]); return { t, n: es.length, labeled: lab.length, ok: lab.filter((e) => labels[e.id].ok).length, agree: lab.filter((e) => labels[e.id].ok === auto(e)).length }; }); }, [eps, labels, params.threshold]);
  useEffect(() => { const n = Object.keys(labels).length; onTelemetry({ Episode: `${idx + 1}/${eps.length}`, Labeled: n, "Human success %": n ? (100 * Object.values(labels).filter((l) => l.ok).length) / n : 0, "Auto/human agreement %": n ? (100 * eps.filter((e) => labels[e.id] && labels[e.id].ok === auto(e)).length) / n : 0, "Auto threshold": Number(params.threshold) }); }, [labels, idx, eps, params.threshold, onTelemetry]);
  const rng = mulberry32(idx + 1); const failGuess = FAIL[Math.floor(rng() * FAIL.length)];
  return (
    <div className="engine-host qa-host">
      <div className="qa-summary">
        <div><b>ep{ep.id}</b><span>{ep.task} · {ep.steps} steps · return {ret.toFixed(2)} · auto-detector says <strong style={{ color: auto(ep) ? "#7cf3a0" : "#ff5d73" }}>{auto(ep) ? "success" : "failure"}</strong> · hidden truth revealed after labeling</span></div>
        <div className="qa-bars">
          <button className="act-btn ok" onClick={() => { setLabels((l) => ({ ...l, [ep.id]: { ok: true } })); setIdx((i) => (i + 1) % eps.length); }}>Success (s)</button>
          {FAIL.map((f) => (<button key={f} className="act-btn bad" onClick={() => { setLabels((l) => ({ ...l, [ep.id]: { ok: false, mode: f } })); setIdx((i) => (i + 1) % eps.length); }}>Fail · {f}</button>))}
          <button className="act-btn" onClick={() => setIdx((i) => (i + 1) % eps.length)}>Skip</button>
          <span className="qa-pill">suggested: {failGuess}</span>
        </div>
      </div>
      <ul className="qa-list">
        {stats.map((s) => (<li key={s.t} className="ok"><span>{s.t}: {s.labeled}/{s.n} labeled · success {s.labeled ? Math.round((100 * s.ok) / s.labeled) : 0}% · auto agreement {s.labeled ? Math.round((100 * s.agree) / s.labeled) : 0}%</span></li>))}
        {eps.filter((e) => labels[e.id]).map((e) => (<li key={e.id} className={labels[e.id].ok ? "ok" : "error"} style={{ gridTemplateColumns: "56px 1fr auto" }}><span className="qa-id">ep{e.id}</span><span className="qa-msg">{e.task} · human: {labels[e.id].ok ? "success" : `failure (${labels[e.id].mode})`} · truth: {e.success ? "success" : "failure"} · auto: {auto(e) ? "success" : "failure"}</span><span className="qa-rule">{labels[e.id].ok === e.success ? "✓ match" : "✗ mismatch"}</span></li>))}
      </ul>
    </div>
  );
}
