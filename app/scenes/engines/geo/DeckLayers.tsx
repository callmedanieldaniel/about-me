"use client";
import { useEffect, useRef } from "react";
import { ScatterplotLayer, ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { HexagonLayer, HeatmapLayer } from "@deck.gl/aggregation-layers";
import { createMap, deckOverlay } from "../../kit/map";
import { points, arcs } from "../../kit/geodata";
import type { EngineProps } from "../../types";
import type { Layer } from "@deck.gl/core";

// deck.gl layer browser on a MapLibre basemap: Scatterplot, Hexagon, Heatmap, Arc and GeoJSON layers over the same synthetic dataset.
export default function DeckLayers({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const pts = points(Number(params.count)), ar = arcs();
    const map = createMap(el, { zoom: 11.5, pitch: Number(params.pitch) });
    const layers: Layer[] = [];
    const kind = String(params.layer);
    if (kind === "scatter") layers.push(new ScatterplotLayer({ id: "s", data: pts, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat], getFillColor: (d: { v: number }) => [94 + d.v * 160, 231 - d.v * 140, 255 - d.v * 140, 180], getRadius: (d: { v: number }) => 30 + d.v * 120, radiusMinPixels: 2, pickable: true }));
    if (kind === "hexagon") layers.push(new HexagonLayer({ id: "h", data: pts, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat], radius: 350, extruded: true, elevationScale: 12, coverage: 0.85, colorRange: [[12, 22, 40], [39, 57, 79], [94, 231, 255], [255, 180, 84], [255, 93, 115], [255, 60, 90]] }));
    if (kind === "heatmap") layers.push(new HeatmapLayer({ id: "hm", data: pts, getPosition: (d: { lon: number; lat: number }) => [d.lon, d.lat], getWeight: (d: { v: number }) => d.v, radiusPixels: 50, colorRange: [[12, 22, 40], [39, 57, 79], [94, 231, 255], [255, 180, 84], [255, 93, 115]] }));
    if (kind === "arc") layers.push(new ArcLayer({ id: "a", data: ar, getSourcePosition: (d: { from: number[] }) => d.from as [number, number], getTargetPosition: (d: { to: number[] }) => d.to as [number, number], getSourceColor: [94, 231, 255], getTargetColor: [255, 180, 84], getWidth: (d: { w: number }) => 1 + d.w * 4, greatCircle: false }));
    if (kind === "geojson") { const fc = { type: "FeatureCollection", features: pts.slice(0, 40).map((p, i) => ({ type: "Feature", properties: { v: p.v, i }, geometry: { type: "Polygon", coordinates: [[[p.lon - 0.004, p.lat - 0.003], [p.lon + 0.004, p.lat - 0.003], [p.lon + 0.004, p.lat + 0.003], [p.lon - 0.004, p.lat + 0.003], [p.lon - 0.004, p.lat - 0.003]]] } })) }; layers.push(new GeoJsonLayer({ id: "g", data: fc as never, extruded: true, getElevation: (f: { properties: { v: number } }) => f.properties.v * 400, getFillColor: (f: { properties: { v: number } }) => [94, 231, 255, 60 + f.properties.v * 160], getLineColor: [255, 255, 255, 80], lineWidthMinPixels: 1 })); }
    const overlay = deckOverlay(map, layers);
    onTelemetry({ Layer: `${kind}Layer`, Points: pts.length, Arcs: kind === "arc" ? ar.length : 0, Pitch: Number(params.pitch), Basemap: "MapLibre · Carto dark" });
    return () => { overlay.finalize(); map.remove(); };
  }, [params.layer, params.count, params.pitch, resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
