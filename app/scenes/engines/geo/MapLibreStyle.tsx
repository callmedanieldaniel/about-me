"use client";
import { useEffect, useRef } from "react";
import { createMap } from "../../kit/map";
import type { EngineProps } from "../../types";

// Live style editing: paint properties of the basemap (water, roads, labels) change at runtime via setPaintProperty / setLayoutProperty, plus a data-driven choropleth from expressions.
export default function MapLibreStyle({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof createMap> | null>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const map = createMap(el, { zoom: 12, pitch: 0, bearing: 0 }); mapRef.current = map;
    map.on("load", () => {
      const feats = []; for (let i = 0; i < 80; i++) { const x = -122.52 + (i % 10) * 0.02, y = 37.7 + Math.floor(i / 10) * 0.018; feats.push({ type: "Feature", properties: { v: (i * 53) % 100 }, geometry: { type: "Polygon", coordinates: [[[x, y], [x + 0.018, y], [x + 0.018, y + 0.016], [x, y + 0.016], [x, y]]] } }); }
      map.addSource("cells", { type: "geojson", data: { type: "FeatureCollection", features: feats } as never });
      map.addLayer({ id: "cells", type: "fill", source: "cells", paint: { "fill-color": ["interpolate", ["linear"], ["get", "v"], 0, "#0c1628", 50, "#5ee7ff", 100, "#ff5d73"], "fill-opacity": 0.45 } });
      map.addLayer({ id: "cells-line", type: "line", source: "cells", paint: { "line-color": "#ffffff", "line-opacity": 0.15 } });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [resetKey]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const apply = () => {
      const layers = map.getStyle()?.layers ?? []; let touched = 0;
      for (const l of layers) {
        const id = l.id.toLowerCase();
        try {
          if (l.type === "fill" && id.includes("water")) { map.setPaintProperty(l.id, "fill-color", String(params.water)); touched++; }
          if (l.type === "line" && id.includes("road")) { map.setPaintProperty(l.id, "line-color", String(params.roads)); touched++; }
          if (l.type === "symbol") { map.setLayoutProperty(l.id, "visibility", Boolean(params.labels) ? "visible" : "none"); touched++; }
          if (l.id === "cells") map.setPaintProperty("cells", "fill-opacity", Number(params.opacity));
        } catch { /* layer may not accept property */ }
      }
      onTelemetry({ "Layers in style": layers.length, "Layers touched": touched, Water: String(params.water), Roads: String(params.roads), Labels: Boolean(params.labels) ? "visible" : "hidden" });
    };
    if (map.isStyleLoaded()) apply(); else map.once("idle", apply);
  }, [params.water, params.roads, params.labels, params.opacity, onTelemetry, resetKey]);
  return <div ref={host} className="engine-host map-host" />;
}
