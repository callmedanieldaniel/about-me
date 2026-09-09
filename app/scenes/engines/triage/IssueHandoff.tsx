"use client";
import { useEffect, useMemo, useRef } from "react";
import { fleet, mine, rules } from "../../kit/fleet";
import type { EngineProps } from "../../types";

// Issue hand-off: a reviewed event becomes a tracker-ready payload (title, severity, cause, log pointer, clip range, reproduction command) — preview and copy/download.
export default function IssueHandoff({ params, command, onTelemetry }: EngineProps) {
  const hits = useMemo(() => mine(fleet(), rules({ brake: 0.5, accel: 3, dropHz: 5, steerRate: 0.08 })).slice(0, 20), []);
  const lastCmd = useRef(0);
  const h = hits[Math.min(hits.length - 1, Number(params.event))];
  const payload = useMemo(() => {
    const ev = fleet()[h.vehicle - 1].events.find((e) => Math.abs(e.t - h.t) < 3);
    const base = { title: `[${ev?.version ?? "v2.4"}] ${h.kind.replace("_", " ")} on vehicle ${h.vehicle} at t=${h.t.toFixed(1)}s`, severity: `S${ev?.severity ?? 2}`, cause: ev?.cause ?? "unclassified", location: { lat: Number(h.lat.toFixed(6)), lon: Number(h.lon.toFixed(6)) }, log: { uri: `s3://fleet-logs/${ev?.version ?? "v2.4"}/vehicle-${h.vehicle}/drive-0001.mcap`, start_s: Number((h.t - Number(params.pre)).toFixed(1)), end_s: Number((h.t + Number(params.post)).toFixed(1)), topics: ["/tf/ego", "/lidar/points", "/camera/front", "/planner/state", "/vehicle/*"] }, reproduce: `omnivis-cli replay --log drive-0001.mcap --from ${(h.t - Number(params.pre)).toFixed(1)} --to ${(h.t + Number(params.post)).toFixed(1)} --policy ${ev?.version ?? "v2.4"}`, labels: ["triage", h.kind, ev?.cause ?? "unclassified"] };
    if (params.target === "jira") return { fields: { project: { key: "AD" }, issuetype: { name: "Bug" }, summary: base.title, priority: { name: base.severity === "S3" ? "Highest" : base.severity === "S2" ? "High" : "Medium" }, labels: base.labels, description: `h3. Root cause\n${base.cause}\n\nh3. Log\n${base.log.uri} [${base.log.start_s}s – ${base.log.end_s}s]\n\nh3. Reproduce\n{code}${base.reproduce}{code}` } };
    if (params.target === "github") return { title: base.title, labels: base.labels, body: `## Root cause\n${base.cause}\n\n## Log\n\`${base.log.uri}\` from ${base.log.start_s}s to ${base.log.end_s}s\n\n## Reproduce\n\`\`\`\n${base.reproduce}\n\`\`\`` };
    return base;
  }, [h, params.pre, params.post, params.target]);
  const text = JSON.stringify(payload, null, 2);
  useEffect(() => { onTelemetry({ Event: `${Number(params.event) + 1}/${hits.length}`, Kind: h.kind, Target: String(params.target), "Clip length (s)": Number(params.pre) + Number(params.post), Bytes: text.length }); }, [params, h, hits.length, text, onTelemetry]);
  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "copy") navigator.clipboard?.writeText(text); if (command.name === "download") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = `issue-${Number(params.event) + 1}.json`; a.click(); } }, [command, text, params.event]);
  return (
    <div className="engine-host qa-host">
      <div className="qa-summary"><div><b>{String(params.target)}</b><span>payload for the selected event, ready for the tracker API · includes log pointer, clip range and a reproduction command</span></div></div>
      <pre className="export-pre">{text}</pre>
    </div>
  );
}
