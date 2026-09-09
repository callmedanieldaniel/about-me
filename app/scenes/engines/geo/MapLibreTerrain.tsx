"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { createMap } from "../../kit/map";
import type { EngineProps } from "../../types";

// MapLibre 3D: raster-DEM terrain with exaggeration, hillshade, sky, and a synthetic building extrusion source.
export default function MapLibreTerrain({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const map = createMap(el, { center: [-121.7, 37.5] as [number, number], zoom: 10.5, pitch: 65, bearing: 20 });
    const onLoad = () => {
      try {
        map.addSource("dem", { type: "raster-dem", url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json", tileSize: 256 });
        if (Boolean(params.terrain)) map.setTerrain({ source: "dem", exaggeration: Number(params.exaggeration) });
        if (Boolean(params.hillshade)) map.addLayer({ id: "hills", type: "hillshade", source: "dem", paint: { "hillshade-shadow-color": "#050910", "hillshade-highlight-color": "#5ee7ff", "hillshade-accent-color": "#1c2a3d", "hillshade-exaggeration": 0.6 } });
        // synthetic extruded blocks
        const feats = []; for (let i = 0; i < 120; i++) { const x = -121.9 + (i % 12) * 0.03, y = 37.35 + Math.floor(i / 12) * 0.03; feats.push({ type: "Feature", properties: { h: 200 + ((i * 37) % 900) }, geometry: { type: "Polygon", coordinates: [[[x, y], [x + 0.012, y], [x + 0.012, y + 0.01], [x, y + 0.01], [x, y]]] } }); }
        map.addSource("blocks", { type: "geojson", data: { type: "FeatureCollection", features: feats } as never });
        map.addLayer({ id: "blocks", type: "fill-extrusion", source: "blocks", paint: { "fill-extrusion-color": ["interpolate", ["linear"], ["get", "h"], 200, "#27394f", 1100, "#5ee7ff"], "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": 0.85 } });
        map.setSky?.({ "sky-color": "#0b1424", "horizon-color": "#1a2740", "fog-color": "#070b12" } as never);
      } catch (e) { console.warn("terrain setup", e); }
    };
    map.on("load", onLoad);
    onTelemetry({ Terrain: Boolean(params.terrain) ? `exaggeration ${Number(params.exaggeration)}` : "off", Hillshade: Boolean(params.hillshade) ? "on" : "off", "DEM source": "demotiles.maplibre.org", Extrusions: 120 });
    void maplibregl;
    return () => map.remove();
  }, [params.terrain, params.exaggeration, params.hillshade, resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
