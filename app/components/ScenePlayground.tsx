"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SceneMode } from "../lib/particle-fields";
const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading" role="status">
      Preparing spatial field…
    </div>
  ),
});
const modes: { id: SceneMode; label: string; title: string; detail: string }[] =
  [
    {
      id: "field",
      label: "Spatial field",
      title: "The shape of data",
      detail: "A continuous terrain, sampled into points.",
    },
    {
      id: "lidar",
      label: "Perception",
      title: "A world, reconstructed",
      detail: "Synthetic LiDAR rings and object bounds.",
    },
    {
      id: "network",
      label: "Systems",
      title: "Everything connects",
      detail: "An abstract network of orbiting data paths.",
    },
  ];
export default function ScenePlayground({
  initialMode = "field",
  compact = false,
}: {
  initialMode?: SceneMode;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<SceneMode>(initialMode);
  const [playing, setPlaying] = useState(false);
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPlaying(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const selected = modes.find((m) => m.id === mode)!;
  return (
    <div className={`scene-playground${compact ? " scene-compact" : ""}`}>
      <div className="scene-topline">
        <span>
          INTERACTIVE STUDY /{" "}
          {String(modes.findIndex((m) => m.id === mode) + 1).padStart(2, "0")}
        </span>
        <span>3D / GENERATIVE</span>
      </div>
      <div className="scene-viewport">
        <SceneCanvas mode={mode} playing={playing} reset={reset} />
      </div>
      <div className="scene-caption" aria-live="polite">
        <h2>{selected.title}</h2>
        <p>{selected.detail}</p>
      </div>
      <div className="scene-tools">
        <span>Drag to rotate · pinch to zoom</span>
        <div>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={playing}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={() => setReset((n) => n + 1)}>
            Reset view
          </button>
        </div>
      </div>
      <div className="scene-modes" role="group" aria-label="3D study">
        {modes.map((m, i) => (
          <button
            type="button"
            key={m.id}
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            <span>0{i + 1}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
