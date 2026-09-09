"use client";
import { useEffect, useRef, useState } from "react";
import { loadCesium, darkViewer } from "../../kit/cesium";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// CesiumJS globe with a synthetic satellite constellation: circular orbits propagated analytically, ground tracks and sensor cones, OpenStreetMap imagery (no Ion token).
export default function CesiumOrbits({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const [status, setStatus] = useState("Loading CesiumJS…");
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return; let alive = true, cleanup = () => {};
    (async () => {
      const C = await loadCesium(); if (!alive) return;
      const viewer = darkViewer(C, el); setStatus("");
      const rng = mulberry32(5); const N = Number(p.current.count); const R = 6371000;
      const sats = Array.from({ length: N }, (_, i) => ({ alt: 500000 + rng() * 900000, inc: (40 + rng() * 55) * Math.PI / 180, raan: rng() * Math.PI * 2, phase: rng() * Math.PI * 2, plane: i % 6 }));
      const ents = sats.map((s) => viewer.entities.add({ position: C.Cartesian3.fromDegrees(0, 0, s.alt), point: { pixelSize: 6, color: C.Color.fromCssColorString(["#5ee7ff", "#ffb454", "#7cf3a0", "#b99cff", "#ff5d73", "#e6eef8"][s.plane]) }, path: undefined }));
      const tracks = sats.map(() => viewer.entities.add({ polyline: { positions: [], width: 1, material: C.Color.fromCssColorString("#5ee7ff").withAlpha(0.35) } }));
      const hist: InstanceType<typeof C.Cartesian3>[][] = sats.map(() => []);
      let t = 0, last = performance.now(), frames = 0;
      const posAt = (s: typeof sats[number], tt: number) => { const a = R + s.alt; const n = Math.sqrt(3.986e14 / (a * a * a)); const u = s.phase + n * tt; const x = a * (Math.cos(s.raan) * Math.cos(u) - Math.sin(s.raan) * Math.sin(u) * Math.cos(s.inc)), y = a * (Math.sin(s.raan) * Math.cos(u) + Math.cos(s.raan) * Math.sin(u) * Math.cos(s.inc)), z = a * Math.sin(u) * Math.sin(s.inc); const rot = -7.2921e-5 * tt; return new C.Cartesian3(x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot), z); };
      const tick = () => { const now = performance.now(); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt * Number(p.current.speed); sats.forEach((s, i) => { const pos = posAt(s, t); ents[i].position = new C.ConstantPositionProperty(pos); if (Boolean(p.current.tracks)) { const h = hist[i]; h.push(pos); if (h.length > 120) h.shift(); tracks[i].polyline!.positions = new C.ConstantProperty(h.slice()); } else tracks[i].polyline!.positions = new C.ConstantProperty([]); }); if ((frames++ & 15) === 0) onTelemetry({ Satellites: N, "Sim time (min)": t / 60, "Time scale": `${Number(p.current.speed)}×`, Imagery: "OpenStreetMap", Engine: "CesiumJS" }); };
      viewer.scene.preRender.addEventListener(tick);
      viewer.camera.flyTo({ destination: C.Cartesian3.fromDegrees(100, 20, 22000000), duration: 0 });
      cleanup = () => { viewer.scene.preRender.removeEventListener(tick); viewer.destroy(); };
    })().catch((e) => setStatus(`Cesium failed: ${e?.message ?? e}`));
    return () => { alive = false; cleanup(); };
  }, [resetKey, onTelemetry]);
  return (<div className="engine-host cesium-host"><div ref={host} className="engine-fill" />{status && <div className="engine-loading"><span className="spin" />{status}</div>}</div>);
}
