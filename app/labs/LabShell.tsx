"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { labDefOf } from "./registry";
import type { Control, EngineProps, Params, Telemetry } from "./types";

const cache = new Map<string, ComponentType<EngineProps>>();

export default function LabShell({ labId, title }: { labId: string; title: string }) {
  const def = labDefOf(labId)!;
  const initial = useMemo(() => {
    const p: Params = {};
    def.controls.forEach((c) => {
      if (c.type !== "file") p[c.key] = c.default;
    });
    return p;
  }, [def]);
  const [params, setParams] = useState<Params>(initial);
  const [playing, setPlaying] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [asset, setAsset] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [telemetry, setTelemetry] = useState<Telemetry>({});
  const lastTelemetry = useRef<Telemetry>({});
  const onTelemetry = useCallback((t: Telemetry) => {
    lastTelemetry.current = t;
    setTelemetry(t);
  }, []);

  const Engine = useMemo(() => {
    let C = cache.get(def.id);
    if (!C) {
      C = dynamic(def.load, {
        ssr: false,
        loading: () => (
          <div className="engine-loading" role="status">
            Loading engine
          </div>
        ),
      });
      cache.set(def.id, C);
    }
    return C;
  }, [def]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "r") setResetKey((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const update = (key: string, value: number | boolean | string) =>
    setParams((p) => ({ ...p, [key]: value }));

  const reset = () => {
    setParams(initial);
    setResetKey((n) => n + 1);
    setPlaying(true);
  };

  async function openFile(file: File | undefined, control: Control) {
    if (!file || control.type !== "file") return;
    setError("");
    if (file.size > 30 * 1024 * 1024) {
      setError("Choose a file under 30 MB.");
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      setAsset(buf);
      setFileName(file.name);
      setResetKey((n) => n + 1);
    } catch {
      setError("The file could not be read.");
    }
  }

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            lab: def.id,
            title,
            exportedAt: new Date().toISOString(),
            params,
            telemetry: lastTelemetry.current,
            assumptions: def.assumptions,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${def.id}-run.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="lab">
      <section className="lab-stage" aria-label="Interactive view">
        <Engine
          params={params}
          playing={playing}
          resetKey={resetKey}
          asset={asset}
          onTelemetry={onTelemetry}
        />
        <div className="lab-hud">
          <div className="lab-transport">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-pressed={playing}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={() => setResetKey((n) => n + 1)}>
              Restart
            </button>
            <span className="lab-hint">{def.camera}</span>
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
        <h2>Parameters</h2>
        {def.controls.map((c) => {
          if (c.type === "range")
            return (
              <label className="ctl" key={c.key}>
                <span>
                  {c.label}
                  <output>
                    {Number(params[c.key]).toFixed(
                      c.step < 0.1 ? 2 : c.step < 1 ? 1 : 0,
                    )}
                    {c.unit ? ` ${c.unit}` : ""}
                  </output>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(params[c.key])}
                  onChange={(e) => update(c.key, Number(e.target.value))}
                />
              </label>
            );
          if (c.type === "toggle")
            return (
              <label className="ctl ctl-toggle" key={c.key}>
                <input
                  type="checkbox"
                  checked={Boolean(params[c.key])}
                  onChange={(e) => update(c.key, e.target.checked)}
                />
                <span>{c.label}</span>
              </label>
            );
          if (c.type === "text")
            return (
              <label className="ctl" key={c.key}>
                <span>{c.label}</span>
                <input
                  type="text"
                  value={String(params[c.key])}
                  onChange={(e) => update(c.key, e.target.value)}
                  spellCheck={false}
                />
                {c.hint && <small>{c.hint}</small>}
              </label>
            );
          return (
            <div className="ctl" key={c.key}>
              <label className="file-btn">
                <input
                  type="file"
                  accept={c.accept}
                  onChange={(e) => openFile(e.target.files?.[0], c)}
                />
                <span>{c.label}</span>
              </label>
              <small>{fileName || c.hint}</small>
              {error && <small className="err">{error}</small>}
            </div>
          );
        })}
        <div className="rail-actions">
          <button type="button" onClick={reset}>
            Reset parameters
          </button>
          <button type="button" onClick={exportJson}>
            Export run as JSON
          </button>
        </div>
        <p className="rail-note">{def.assumptions}</p>
      </aside>

      <section className="lab-telemetry" aria-live="polite">
        {Object.entries(telemetry).map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <b>{typeof v === "number" ? formatNum(v) : v}</b>
          </div>
        ))}
      </section>
    </div>
  );
}

function formatNum(v: number) {
  if (Number.isInteger(v)) return String(v);
  return Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2);
}
