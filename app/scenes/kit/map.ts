import * as maplibregl from "maplibre-gl";
import { MapLibreOverlay } from "@deck.gl/maplibre";
import type { Layer } from "@deck.gl/core";

export const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
export const SF: [number, number] = [-122.42, 37.77];

export function createMap(el: HTMLElement, opts: { center?: [number, number]; zoom?: number; pitch?: number; bearing?: number; style?: string } = {}) {
  const map = new maplibregl.Map({ container: el, style: opts.style ?? DARK_STYLE, center: opts.center ?? SF, zoom: opts.zoom ?? 12, pitch: opts.pitch ?? 45, bearing: opts.bearing ?? -10, attributionControl: { compact: true } });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  // Offline / blocked tiles: fall back to a plain dark canvas so data layers still render.
  let fell = false;
  map.on("error", (e) => { if (fell) return; const msg = String((e as { error?: { message?: string } }).error?.message ?? ""); if (/style|Failed to fetch|NetworkError|CORS|json/i.test(msg)) { fell = true; map.setStyle(FALLBACK_STYLE as never); } });
  return map;
}

export const FALLBACK_STYLE = { version: 8, name: "xvis-fallback", sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#0a111c" } }] };

export function deckOverlay(map: maplibregl.Map, layers: Layer[]) {
  const overlay = new MapLibreOverlay({ interleaved: false, layers });
  map.addControl(overlay);
  return overlay;
}
