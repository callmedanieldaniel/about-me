"use client";
import { useEffect, useRef } from "react";
import type { EngineProps } from "../../types";
import { points, arcs, CITIES } from "../../kit/geodata";
import { DARK_STYLE, FALLBACK_STYLE } from "../../kit/map";

// AntV L7 on its MapLibre-backed `Map` basemap (no key): HeatmapLayer hexbin, LineLayer arcs, PointLayer bubbles and animated PointLayer — the same data, L7's API.
export default function L7Layers({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    let scene: { destroy: () => void } | null = null; let alive = true;
    (async () => {
      const L7 = await import("@antv/l7"); const Maps = await import("@antv/l7-maps");
      if (!alive) return;
      const mode = String(params.mode); const china = mode === "flights";
      const sc = new L7.Scene({ id: el, logoVisible: false, map: new Maps.Map({ style: DARK_STYLE, center: china ? [110, 33] : [-122.42, 37.77], zoom: china ? 3.4 : 10.8, pitch: china ? 30 : 45 }) as never });
      scene = sc;
      sc.on("loaded", () => {
        try {
          const ml = (sc.map as unknown as { on?: (e: string, f: (ev: { error?: { message?: string } }) => void) => void; setStyle?: (s: unknown) => void }); ml.on?.("error", (ev) => { if (/style|fetch|json/i.test(String(ev.error?.message))) ml.setStyle?.(FALLBACK_STYLE); });
          if (mode === "hexbin") { const pts = points(3000); const layer = new L7.HeatmapLayer({}).source(pts, { parser: { type: "json", x: "lon", y: "lat" }, transforms: [{ type: "hexagon", size: Number(params.size), field: "v", method: "sum" }] }).shape("hexagonColumn").size("sum", [0, 1200]).color("sum", ["#0c1628", "#27394f", "#5ee7ff", "#ffb454", "#ff5d73"]).style({ coverage: 0.85, opacity: 0.9 }); sc.addLayer(layer); }
          if (mode === "arcs") { const ar = arcs(80); const layer = new L7.LineLayer({}).source(ar.map((a) => ({ x1: a.from[0], y1: a.from[1], x2: a.to[0], y2: a.to[1], w: a.w })), { parser: { type: "json", x: "x1", y: "y1", x1: "x2", y1: "y2" } }).shape("arc3d").size(2).color("w", ["#5ee7ff", "#b99cff", "#ffb454"]).animate({ interval: 0.6, trailLength: 1, duration: 3 }).style({ opacity: 0.8 }); sc.addLayer(layer); }
          if (mode === "bubbles") { const pts = points(600, 7); const layer = new L7.PointLayer({}).source(pts, { parser: { type: "json", x: "lon", y: "lat" } }).shape("circle").size("v", [4, 28]).color("v", ["#5ee7ff", "#ffb454", "#ff5d73"]).style({ opacity: 0.6, strokeWidth: 1, stroke: "#ffffff" }).animate(Boolean(params.animate)); sc.addLayer(layer); }
          if (mode === "flights") { const hubs = CITIES.slice(0, 3); const lines = CITIES.flatMap((c) => hubs.filter((h) => h[0] !== c[0]).map((h) => ({ x1: h[1], y1: h[2], x2: c[1], y2: c[2], v: c[3] }))); sc.addLayer(new L7.LineLayer({}).source(lines, { parser: { type: "json", x: "x1", y: "y1", x1: "x2", y1: "y2" } }).shape("arc").size(1.5).color("#5ee7ff").animate({ interval: 0.5, trailLength: 0.6, duration: 2.5 }).style({ opacity: 0.7 })); sc.addLayer(new L7.PointLayer({}).source(CITIES.map(([name, lon, lat, v]) => ({ name, lon, lat, v })), { parser: { type: "json", x: "lon", y: "lat" } }).shape("circle").size("v", [6, 30]).color("#ffb454").animate(true).style({ opacity: 0.6 })); sc.addLayer(new L7.PointLayer({}).source(CITIES.map(([name, lon, lat, v]) => ({ name, lon, lat, v })), { parser: { type: "json", x: "lon", y: "lat" } }).shape("name", "text").size(11).color("#e6eef8").style({ textOffset: [0, 14] })); }
          onTelemetry({ Mode: mode, Engine: "AntV L7 · MapLibre basemap", Layers: sc.getLayers().length, Hexagon: mode === "hexbin" ? `${Number(params.size)} m` : "—" });
        } catch (e) { console.warn("L7", e); }
      });
    })();
    return () => { alive = false; try { scene?.destroy(); } catch { /* */ } };
  }, [params.mode, params.size, params.animate, resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host l7-host" />;
}
