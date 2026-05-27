"use client";

import { useEffect, useRef } from "react";
import { loadLoca } from "../lib/sdk";

// L7-style hex aggregation — use Loca PolygonLayer to render hex tiles
// over a real AMap base (the visual is what L7 ships).
type Hex = { coords: [number, number][]; value: number };

export default function L7Demo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let map: { destroy?: () => void } | null = null;

    loadLoca()
      .then(() => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Loca = (window as any).Loca;

        const center: [number, number] = [121.473, 31.230];
        map = new AMap.Map(ref.current, {
          mapStyle: "amap://styles/dark",
          viewMode: "3D",
          pitch: 55,
          rotation: 25,
          zoom: 12.5,
          center,
          features: ["bg", "road"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;

        const loca = new Loca.Container({ map: _map });

        // Build hex grid centered on shanghai people's square
        const hexSize = 0.005; // degrees ~ 500m
        const cols = 18;
        const rows = 14;

        const hexes: Hex[] = [];
        const dx = hexSize * Math.sqrt(3);
        const dy = hexSize * 1.5;

        for (let r = -rows / 2; r < rows / 2; r++) {
          for (let q = -cols / 2; q < cols / 2; q++) {
            const cx = center[0] + (q + (r % 2 ? 0.5 : 0)) * dx;
            const cy = center[1] + r * dy;
            // gaussian field — two peaks
            const v =
              Math.exp(
                -Math.pow((cx - center[0]) * 100, 2) -
                  Math.pow((cy - center[1]) * 100, 2)
              ) *
                0.7 +
              Math.exp(
                -Math.pow((cx - center[0] - 0.03) * 80, 2) -
                  Math.pow((cy - center[1] - 0.015) * 80, 2)
              ) *
                0.5 +
              Math.random() * 0.05;
            if (v < 0.05) continue;
            const coords: [number, number][] = [];
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i + Math.PI / 6;
              coords.push([cx + Math.cos(a) * hexSize, cy + Math.sin(a) * hexSize]);
            }
            coords.push(coords[0]);
            hexes.push({ coords, value: v });
          }
        }

        const features = hexes.map((h) => ({
          type: "Feature",
          properties: { value: h.value },
          geometry: { type: "Polygon", coordinates: [h.coords] },
        }));
        const source = new Loca.GeoJSONSource({
          data: { type: "FeatureCollection", features },
        });

        const layer = new Loca.PolygonLayer({ loca, zIndex: 20 });
        layer.setSource(source);
        layer.setStyle({
          topNormal: true,
          altitude: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          height: (_i: number, f: any) => f.properties.value * 1500,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          topColor: (_i: number, f: any) => {
            const v = f.properties.value;
            if (v > 0.5) return "#ff7eb6";
            if (v > 0.25) return "#f0c83c";
            return "#79ffe1";
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sideTopColor: (_i: number, f: any) => {
            const v = f.properties.value;
            if (v > 0.5) return "#ff7eb6";
            if (v > 0.25) return "#f0c83c";
            return "#79ffe1";
          },
          sideBottomColor: "#0a0a10",
        });
        loca.add(layer);
        loca.animate.start();
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = errorBox();
      });

    return () => {
      alive = false;
      if (map && typeof map.destroy === "function") map.destroy();
    };
  }, []);

  return (
    <div style={{ height: 440 }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">L7 failed to load</div>`;
}
