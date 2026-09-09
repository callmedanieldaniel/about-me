"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { sceneOf } from "./registry";
import type { Command, Control, DemoDef, EngineProps, Params, Telemetry } from "./types";

const cache = new Map<string, ComponentType<EngineProps>>();

function defaults(def: DemoDef): Params {
  const p: Params = {};
  def.controls.forEach((ctl) => {
    if (ctl.type !== "file" && ctl.type !== "action") p[ctl.key] = ctl.default;
  });
  return p;
}

export default function SceneShell({ sceneId, initialDemo }: { sceneId: string; initialDemo?: string }) {
  const scene = sceneOf(sceneId)!;
  const [demoId, setDemoId] = useState(initialDemo && scene.demos.some((d) => d.id === initialDemo) ? initialDemo : scene.demos[0].id);
  const def = scene.demos.find((d) => d.id === demoId)!;
  const [params, setParams] = useState<Params>(() => defaults(def));
  const [playing, setPlaying] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [asset, setAsset] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [command, setCommand] = useState<Command>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const [railOpen, setRailOpen] = useState(true);
  const lastTelemetry = useRef<Telemetry>({});
  const seq = useRef(0);
  const onTelemetry = useCallback((t: Telemetry) => {
    lastTelemetry.current = t;
    setTelemetry(t);
  }, []);

  const switchDemo = (id: string) => {
    const next = scene.demos.find((d) => d.id === id)!;
    setDemoId(id);
    setParams(defaults(next));
    setTelemetry({});
    setAsset(null);
    setFileName("");
    setError("");
    setCommand(null);
    setPlaying(true);
    setResetKey((n) => n + 1);
    const url = new URL(window.location.href);
    url.searchParams.set("demo", id);
    window.history.replaceState(null, "", url.toString());
  };

  const Engine = useMemo(() => {
    const key = `${scene.id}:${def.id}`;
    let C = cache.get(key);
    if (!C) {
      C = dynamic(def.load, {
        ssr: false,
        loading: () => (
          <div className="engine-loading" role="status">
            <span className="spin" /> Loading engine
          </div>
        ),
      });
      cache.set(key, C);
    }
    return C;
  }, [scene.id, def]);

  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("demo");
    if (want && want !== demoId && scene.demos.some((d) => d.id === want)) switchDemo(want);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "r") setResetKey((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (key: string, value: number | boolean | string) => setParams((p) => ({ ...p, [key]: value }));
  const fire = (name: string) => setCommand({ name, seq: ++seq.current });
  const reset = () => {
    setParams(defaults(def));
    setResetKey((n) => n + 1);
    setPlaying(true);
  };

  async function openFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 60 * 1024 * 1024) {
      setError("Choose a file under 60 MB.");
      return;
    }
    try {
      setAsset(await file.arrayBuffer());
      setFileName(file.name);
      setResetKey((n) => n + 1);
    } catch {
      setError("The file could not be read.");
    }
  }

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ scene: scene.id, demo: def.id, title: def.title, exportedAt: new Date().toISOString(), params, telemetry: lastTelemetry.current, assumptions: def.assumptions, libs: def.libs.map((l) => l.name) }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${scene.id}-${def.id}-run.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const keyNote = def.needsKey && !hasKey(def.needsKey) ? keyHint(def.needsKey) : null;

  return (
    <div className={`lab ${railOpen ? "" : "rail-collapsed"}`}>
      <div className="demo-tabs" role="tablist" aria-label="Demos">
        {scene.demos.map((d, i) => (
          <button key={d.id} role="tab" aria-selected={d.id === demoId} className={d.id === demoId ? "on" : ""} onClick={() => switchDemo(d.id)}>
            <span className="tab-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="tab-t">{d.title}</span>
          </button>
        ))}
      </div>

      <section className="lab-stage" aria-label="Interactive view">
        <div className="stage-corners" aria-hidden />
        {keyNote ? (
          <div className="key-gate">
            <h3>{keyNote.title}</h3>
            <p>{keyNote.text}</p>
            <code>{keyNote.env}</code>
          </div>
        ) : (
          <Engine key={`${def.id}`} params={params} playing={playing} resetKey={resetKey} asset={asset} command={command} onTelemetry={onTelemetry} />
        )}
        <div className="lab-hud">
          <div className="lab-transport">
            <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={() => setResetKey((n) => n + 1)}>
              Restart
            </button>
            <span className="lab-hint">{def.camera ?? "Drag to orbit · scroll to zoom"}</span>
          </div>
          <ul className="lab-legend">
            {def.legend.map((l) => (
              <li key={l.label}>
                <i style={{ background: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <aside className="lab-rail">
        <div className="rail-head">
          <h2>Parameters</h2>
          <button type="button" className="rail-toggle" onClick={() => setRailOpen((o) => !o)} aria-label="Toggle parameters">
            {railOpen ? "–" : "+"}
          </button>
        </div>
        <div className="rail-body">
          {def.controls.map((ctl) => (
            <ControlField key={ctl.key} ctl={ctl} params={params} update={update} fire={fire} openFile={openFile} fileName={fileName} error={error} />
          ))}
          <div className="rail-actions">
            <button type="button" onClick={reset}>
              Reset parameters
            </button>
            <button type="button" onClick={exportJson}>
              Export run as JSON
            </button>
          </div>
          <p className="rail-note">{def.assumptions}</p>
        </div>
      </aside>

      <section className="lab-telemetry" aria-live="polite">
        {Object.entries(telemetry).map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <b>{typeof v === "number" ? formatNum(v) : v}</b>
          </div>
        ))}
      </section>

      <section className="built-with">
        <h3>
          <span className="eyebrow">Built with</span> {def.title}
        </h3>
        <p className="bw-summary">{def.summary}</p>
        <ul>
          {def.libs.map((l) => (
            <li key={l.name}>
              <Link href={l.url} target="_blank" rel="noreferrer">
                {l.name}
                {l.version ? <small> {l.version}</small> : null}
              </Link>
              <span>{l.role}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ControlField({ ctl, params, update, fire, openFile, fileName, error }: { ctl: Control; params: Params; update: (k: string, v: number | boolean | string) => void; fire: (n: string) => void; openFile: (f: File | undefined) => void; fileName: string; error: string }) {
  if (ctl.type === "range")
    return (
      <label className="ctl">
        <span>
          {ctl.label}
          <output>
            {Number(params[ctl.key]).toFixed(ctl.step < 0.1 ? 2 : ctl.step < 1 ? 1 : 0)}
            {ctl.unit ? ` ${ctl.unit}` : ""}
          </output>
        </span>
        <input type="range" min={ctl.min} max={ctl.max} step={ctl.step} value={Number(params[ctl.key])} onChange={(e) => update(ctl.key, Number(e.target.value))} />
      </label>
    );
  if (ctl.type === "toggle")
    return (
      <label className="ctl ctl-toggle">
        <input type="checkbox" checked={Boolean(params[ctl.key])} onChange={(e) => update(ctl.key, e.target.checked)} />
        <span>{ctl.label}</span>
      </label>
    );
  if (ctl.type === "select")
    return (
      <label className="ctl">
        <span>{ctl.label}</span>
        <select value={String(params[ctl.key])} onChange={(e) => update(ctl.key, e.target.value)}>
          {ctl.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (ctl.type === "text")
    return (
      <label className="ctl">
        <span>{ctl.label}</span>
        <input type="text" value={String(params[ctl.key])} onChange={(e) => update(ctl.key, e.target.value)} spellCheck={false} />
        {ctl.hint && <small>{ctl.hint}</small>}
      </label>
    );
  if (ctl.type === "action")
    return (
      <div className="ctl">
        <button type="button" className="act" onClick={() => fire(ctl.key)}>
          {ctl.label}
        </button>
        {ctl.hint && <small>{ctl.hint}</small>}
      </div>
    );
  return (
    <div className="ctl">
      <label className="file-btn">
        <input type="file" accept={ctl.accept} onChange={(e) => openFile(e.target.files?.[0])} />
        <span>{ctl.label}</span>
      </label>
      <small>{fileName || ctl.hint}</small>
      {error && <small className="err">{error}</small>}
    </div>
  );
}

function hasKey(k: "mapbox" | "amap" | "baidu") {
  if (k === "mapbox") return Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  if (k === "amap") return Boolean(process.env.NEXT_PUBLIC_AMAP_KEY);
  return Boolean(process.env.NEXT_PUBLIC_BAIDU_KEY);
}
function keyHint(k: "mapbox" | "amap" | "baidu") {
  const m = {
    mapbox: { title: "Mapbox token not configured", text: "This demo renders Mapbox Standard style with 3D terrain. Provide a public token at build time and redeploy; every other map demo runs without keys.", env: "NEXT_PUBLIC_MAPBOX_TOKEN=pk.…" },
    amap: { title: "AMap key not configured", text: "Loca layers render on top of AMap JSAPI 2.0, which requires a browser key from the AMap console.", env: "NEXT_PUBLIC_AMAP_KEY=…" },
    baidu: { title: "Baidu key not configured", text: "MapVGL layers render on Baidu Maps GL, which requires a browser AK.", env: "NEXT_PUBLIC_BAIDU_KEY=…" },
  };
  return m[k];
}
function formatNum(v: number) {
  if (Number.isInteger(v)) return String(v);
  return Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2);
}
