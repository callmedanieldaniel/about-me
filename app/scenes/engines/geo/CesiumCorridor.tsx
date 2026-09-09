"use client";
import { useEffect, useRef, useState } from "react";
import { loadCesium, darkViewer } from "../../kit/cesium";
import type { EngineProps } from "../../types";

// CesiumJS drone corridor: a 3D flight path with altitude wall, a moving vehicle, geofence polygon and a time cursor — the digital-twin pattern on a real globe.
export default function CesiumCorridor({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const [status, setStatus] = useState("Loading CesiumJS…");
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return; let alive = true, cleanup = () => {};
    (async () => {
      const C = await loadCesium(); if (!alive) return;
      const viewer = darkViewer(C, el); setStatus("");
      const base: [number, number] = [-122.42, 37.77];
      const path = Array.from({ length: 120 }, (_, i) => { const a = (i / 120) * Math.PI * 2; return [base[0] + Math.cos(a) * 0.04 + Math.cos(a * 3) * 0.008, base[1] + Math.sin(a) * 0.03, 120 + Math.sin(a * 2) * 60 + Number(p.current.altitude)]; });
      const flat = path.flat();
      viewer.entities.add({ polyline: { positions: C.Cartesian3.fromDegreesArrayHeights(flat), width: 3, material: C.Color.fromCssColorString("#5ee7ff") } });
      const wall = viewer.entities.add({ wall: { positions: C.Cartesian3.fromDegreesArrayHeights(flat), material: C.Color.fromCssColorString("#5ee7ff").withAlpha(0.12), outline: false } });
      viewer.entities.add({ polygon: { hierarchy: C.Cartesian3.fromDegreesArray([base[0] - 0.02, base[1] - 0.012, base[0] + 0.02, base[1] - 0.012, base[0] + 0.02, base[1] + 0.012, base[0] - 0.02, base[1] + 0.012]), material: C.Color.fromCssColorString("#ff5d73").withAlpha(0.18), outline: true, outlineColor: C.Color.fromCssColorString("#ff5d73"), height: 0, extrudedHeight: 200 } });
      const drone = viewer.entities.add({ position: C.Cartesian3.fromDegrees(path[0][0], path[0][1], path[0][2]), point: { pixelSize: 12, color: C.Color.fromCssColorString("#ffb454"), outlineColor: C.Color.WHITE, outlineWidth: 2 }, label: { text: "UAV-01", font: "12px IBM Plex Mono", fillColor: C.Color.fromCssColorString("#e6eef8"), pixelOffset: new C.Cartesian2(0, -18) } });
      let t = 0, last = performance.now(), frames = 0, inFence = 0;
      const tick = () => { const now = performance.now(); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt * Number(p.current.speed); const i = Math.floor(t * 4) % path.length; const q = path[i]; drone.position = new C.ConstantPositionProperty(C.Cartesian3.fromDegrees(q[0], q[1], q[2])); wall.show = Boolean(p.current.wall); const inside = Math.abs(q[0] - base[0]) < 0.02 && Math.abs(q[1] - base[1]) < 0.012 && q[2] < 200; if (inside) inFence++; if ((frames++ & 15) === 0) onTelemetry({ Waypoint: `${i}/${path.length}`, "Altitude (m)": q[2], Geofence: inside ? "INSIDE — violation" : "clear", "Violation frames": inFence, Engine: "CesiumJS" }); };
      viewer.scene.preRender.addEventListener(tick);
      viewer.camera.flyTo({ destination: C.Cartesian3.fromDegrees(base[0] + 0.06, base[1] - 0.09, 6000), orientation: { heading: C.Math.toRadians(-30), pitch: C.Math.toRadians(-35), roll: 0 }, duration: 0 });
      cleanup = () => { viewer.scene.preRender.removeEventListener(tick); viewer.destroy(); };
    })().catch((e) => setStatus(`Cesium failed: ${e?.message ?? e}`));
    return () => { alive = false; cleanup(); };
  }, [resetKey, params.altitude, onTelemetry]);
  return (<div className="engine-host cesium-host"><div ref={host} className="engine-fill" />{status && <div className="engine-loading"><span className="spin" />{status}</div>}</div>);
}
