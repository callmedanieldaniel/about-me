"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { EngineProps } from "../../types";

// Mapbox GL JS: Standard style (3D buildings, lighting presets), terrain, an animated route and a marker — requires NEXT_PUBLIC_MAPBOX_TOKEN.
export default function MapboxStandard({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    const map = new mapboxgl.Map({ container: el, style: String(p.current.style) === "standard" ? "mapbox://styles/mapbox/standard" : "mapbox://styles/mapbox/dark-v11", center: [-122.42, 37.77], zoom: 15.2, pitch: 62, bearing: -20, antialias: true });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
    let raf = 0, t = 0, last = performance.now(), frames = 0;
    const route: [number, number][] = Array.from({ length: 80 }, (_, i) => [-122.43 + i * 0.0004, 37.765 + Math.sin(i * 0.15) * 0.004 + i * 0.0001]);
    const marker = new mapboxgl.Marker({ color: "#ffb454" }).setLngLat(route[0]).addTo(map);
    map.on("style.load", () => {
      try { map.setConfigProperty?.("basemap", "lightPreset", String(p.current.light)); } catch { /* not Standard */ }
      if (Boolean(p.current.terrain)) { map.addSource("mapbox-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 }); map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 }); }
      map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } } });
      map.addLayer({ id: "route", type: "line", source: "route", paint: { "line-color": "#5ee7ff", "line-width": 4, "line-opacity": 0.8 }, ...(String(p.current.style) === "standard" ? { slot: "middle" } : {}) } as never);
    });
    const loop = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt; const i = Math.floor((t * 6) % route.length); marker.setLngLat(route[i]); if (Boolean(p.current.rotate)) map.setBearing(map.getBearing() + dt * 4); if ((frames++ & 15) === 0) onTelemetry({ Style: String(p.current.style), "Light preset": String(p.current.light), Terrain: Boolean(p.current.terrain) ? "on" : "off", "Route point": i }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, [params.style, params.light, params.terrain, resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
