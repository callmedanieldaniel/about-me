"use client";
import { useEffect, useRef, useState } from "react";
import type { EngineProps } from "../../types";

// Agent trace: an LLM agent loop (plan → tool call → observation → reflect) replayed as a timeline of spans with token counts, latency and cost; a tree view shows nested sub-agents.
type Span = { id: number; parent: number | null; kind: "plan" | "tool" | "obs" | "reflect" | "answer"; name: string; t0: number; dur: number; tokens: number; ok: boolean };
function makeTrace(): Span[] {
  const out: Span[] = []; let t = 0, id = 0; const add = (parent: number | null, kind: Span["kind"], name: string, dur: number, tokens: number, ok = true) => { out.push({ id: id++, parent, kind, name, t0: t, dur, tokens, ok }); t += dur; return id - 1; };
  const root = add(null, "plan", "plan: analyze fleet regression", 1.2, 640);
  add(root, "tool", "search_events(kind='hard_brake', version='v2.4')", 0.8, 120); add(root, "obs", "37 events · 3 clusters", 0.2, 900);
  const sub = add(root, "plan", "sub-agent: root cause per cluster", 0.9, 420);
  add(sub, "tool", "replay_log(id=1042, from=118, to=126)", 1.6, 80); add(sub, "obs", "planner state LANE_CHANGE, TTC 1.1s", 0.3, 700); add(sub, "tool", "diff_versions(v2.3, v2.4, module='control')", 1.1, 90, false); add(sub, "reflect", "tool failed → retry with module='planning'", 0.6, 310); add(sub, "tool", "diff_versions(v2.3, v2.4, module='planning')", 1.0, 90); add(sub, "obs", "gain schedule changed in PR #4821", 0.2, 520);
  add(root, "reflect", "synthesize findings", 1.4, 880); add(root, "answer", "final: regression traced to PR #4821 · 2 follow-ups", 0.7, 460);
  return out;
}
export default function AgentTrace({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const spans = useRef(makeTrace()); const [t, setT] = useState(0); const tRef = useRef(0); const play = useRef(playing); play.current = playing; const p = useRef(params); p.current = params;
  useEffect(() => { tRef.current = 0; }, [resetKey]);
  useEffect(() => { let raf = 0, last = performance.now(); const total = spans.current.reduce((m, s) => Math.max(m, s.t0 + s.dur), 0); const loop = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) tRef.current = (tRef.current + dt * Number(p.current.speed)) % (total + 1); setT(tRef.current); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, []);
  const total = spans.current.reduce((m, s) => Math.max(m, s.t0 + s.dur), 0); const done = spans.current.filter((s) => s.t0 + s.dur <= t); const tokens = done.reduce((a, s) => a + s.tokens, 0);
  useEffect(() => { onTelemetry({ "t (s)": t, Spans: `${done.length}/${spans.current.length}`, Tokens: tokens, "Cost (USD)": (tokens / 1e6) * Number(p.current.price), "Tool calls": done.filter((s) => s.kind === "tool").length, "Failures": done.filter((s) => !s.ok).length }); }, [t, done.length, tokens, onTelemetry]);
  const color = (k: Span["kind"]) => ({ plan: "#b99cff", tool: "#5ee7ff", obs: "#7e90a8", reflect: "#ffb454", answer: "#7cf3a0" })[k];
  const depth = (s: Span): number => (s.parent === null ? 0 : 1 + depth(spans.current.find((x) => x.id === s.parent)!));
  return (
    <div className="engine-host qa-host trace-host">
      <div className="trace-bar">{spans.current.map((s) => (<div key={s.id} className="trace-span" style={{ left: `${(s.t0 / total) * 100}%`, width: `${(s.dur / total) * 100}%`, top: depth(s) * 22 + 4, background: color(s.kind), opacity: s.t0 <= t ? 1 : 0.2, outline: s.ok ? "none" : "2px solid #ff5d73" }} title={s.name} />))}<div className="trace-cursor" style={{ left: `${(t / total) * 100}%` }} /></div>
      <ul className="qa-list">{spans.current.map((s) => (<li key={s.id} className={s.ok ? "ok" : "error"} style={{ gridTemplateColumns: "70px 1fr auto auto", opacity: s.t0 <= t ? 1 : 0.3, borderLeftColor: color(s.kind), marginLeft: depth(s) * 16 }}><span className="qa-rule">{s.kind}</span><span className="qa-msg" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.name}</span><span className="qa-rule">{s.dur.toFixed(1)}s</span><span className="qa-rule">{s.tokens} tok</span></li>))}</ul>
    </div>
  );
}
