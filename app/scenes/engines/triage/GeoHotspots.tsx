"use client";
import { useEffect, useRef } from "react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer, PathLayer } from "@deck.gl/layers";
import { fleet } from "../../kit/fleet";
import { createMap, deckOverlay } from "../../kit/map";
import type { EngineProps } from "../../types";

// Geographic hotspots: fleet drive paths (PathLayer) and event density (HexagonLayer, extruded) on a MapLibre dark basemap via deck.gl MapboxOverlay.
export default function GeoHotspots({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const drives = fleet();
    const events = drives.flatMap((d) => d.events).filter((e) => params.kind === "all" || e.kind === params.kind);
    const map = createMap(el, { zoom: 12.6, pitch: 50 });
    const layers = [
      new PathLayer({ id: "paths", data: drives.map((d) => ({ path: d.lon.filter((_, i) => i % 10 === 0).map((lon, i) => [lon, d.lat[i * 10]]), v: d.vehicle })), getPath: (d: { path: number[][] }) => d.path as [number, number][], getColor: (d: { v: number }) => [94, 231, 255, 90 + d.v * 20], getWidth: 3, widthMinPixels: 2 }),
      new HexagonLayer({ id: "hex", data: events, getPosition: (e: { lon: number; lat: number }) => [e.lon, e.lat], radius: Number(params.radius), elevationScale: Number(params.elevation), extruded: true, coverage: 0.85, colorRange: [[12, 22, 40], [39, 57, 79], [94, 231, 255], [255, 180, 84], [255, 93, 115], [255, 60, 90]], opacity: 0.7, pickable: true }),
      new ScatterplotLayer({ id: "events", data: events, getPosition: (e: { lon: number; lat: number }) => [e.lon, e.lat], getFillColor: (e: { severity: number }) => (e.severity >= 3 ? [255, 93, 115] : e.severity === 2 ? [255, 180, 84] : [124, 243, 160]), getRadius: (e: { severity: number }) => 20 + e.severity * 15, radiusMinPixels: 3, visible: Boolean(params.points) }),
    ];
    const overlay = deckOverlay(map, layers);
    onTelemetry({ Events: events.length, Vehicles: drives.length, "Hex radius (m)": Number(params.radius), "S3 events": events.filter((e) => e.severity >= 3).length, Basemap: "MapLibre · Carto dark" });
    return () => { overlay.finalize(); map.remove(); };
  }, [params.kind, params.radius, params.elevation, params.points, resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
