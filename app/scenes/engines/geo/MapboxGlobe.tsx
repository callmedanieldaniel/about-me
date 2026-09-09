"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { CITIES } from "../../kit/geodata";
import type { EngineProps } from "../../types";

// Mapbox globe projection with atmosphere (fog), spinning, and city points with data-driven radius — requires NEXT_PUBLIC_MAPBOX_TOKEN.
export default function MapboxGlobe({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    const map = new mapboxgl.Map({ container: el, style: "mapbox://styles/mapbox/dark-v11", projection: "globe" as never, center: [110, 30], zoom: 1.8 });
    map.on("style.load", () => { map.setFog({ color: "rgb(12, 20, 36)", "high-color": "rgb(30, 60, 110)", "horizon-blend": 0.05, "space-color": "rgb(5, 8, 14)", "star-intensity": 0.6 } as never); map.addSource("cities", { type: "geojson", data: { type: "FeatureCollection", features: CITIES.map(([name, lon, lat, v]) => ({ type: "Feature", properties: { name, v }, geometry: { type: "Point", coordinates: [lon, lat] } })) } }); map.addLayer({ id: "cities", type: "circle", source: "cities", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "v"], 30, 4, 100, 16], "circle-color": "#5ee7ff", "circle-opacity": 0.7, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1 } }); map.addLayer({ id: "labels", type: "symbol", source: "cities", layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.4] }, paint: { "text-color": "#e6eef8" } }); });
    let raf = 0, last = performance.now(), frames = 0;
    const loop = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current && Boolean(p.current.spin)) { const c = map.getCenter(); map.setCenter([c.lng + dt * Number(p.current.speed), c.lat]); } if ((frames++ & 15) === 0) onTelemetry({ Projection: "globe", Cities: CITIES.length, Spin: Boolean(p.current.spin) ? `${Number(p.current.speed)}°/s` : "off", Zoom: map.getZoom() }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
