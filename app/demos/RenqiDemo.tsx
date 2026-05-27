"use client";

import { useEffect, useRef } from "react";
import { loadAMap } from "../lib/sdk";

// AMap heatmap + isochrone circles around a candidate POI
export default function RenqiDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let map: { destroy?: () => void } | null = null;

    loadAMap(["AMap.Heatmap"])
      .then((AMapAny) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = AMapAny as any;

        const center: [number, number] = [121.4737, 31.2304]; // Shanghai People's Sq.
        map = new AMap.Map(ref.current, {
          viewMode: "2D",
          mapStyle: "amap://styles/dark",
          center,
          zoom: 13,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;

        // Generate random POI points around center with multiple clusters
        const pts: { lng: number; lat: number; count: number }[] = [];
        const clusters: [number, number, number][] = [
          [center[0], center[1], 0.012],
          [center[0] + 0.025, center[1] + 0.01, 0.01],
          [center[0] - 0.02, center[1] + 0.008, 0.008],
          [center[0] + 0.015, center[1] - 0.012, 0.009],
        ];
        clusters.forEach(([clng, clat, spread]) => {
          for (let i = 0; i < 80; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.7) * spread;
            pts.push({
              lng: clng + Math.cos(a) * r,
              lat: clat + Math.sin(a) * r,
              count: 30 + Math.random() * 70,
            });
          }
        });

        const heatmap = new AMap.Heatmap(_map, {
          radius: 25,
          opacity: [0, 0.85],
          gradient: {
            "0.2": "#3742fa",
            "0.4": "#79ffe1",
            "0.6": "#f0c83c",
            "0.8": "#ff7eb6",
            "1.0": "#ff5a50",
          },
        });
        heatmap.setDataSet({ data: pts, max: 100 });

        // Isochrone rings (5/10/15/20 min as concentric circles)
        const rings = [
          { r: 600, label: "5 min" },
          { r: 1100, label: "10 min" },
          { r: 1700, label: "15 min" },
          { r: 2400, label: "20 min" },
        ];
        rings.forEach((ring) => {
          new AMap.Circle({
            center,
            radius: ring.r,
            strokeColor: "#79ffe1",
            strokeWeight: 1,
            strokeOpacity: 0.7,
            strokeStyle: "dashed",
            fillOpacity: 0,
            map: _map,
          });
        });

        // POI marker at center
        const dot = document.createElement("div");
        dot.style.cssText = `
          width:14px;height:14px;border-radius:50%;
          background:#ff7eb6;border:2px solid #fff;
          box-shadow:0 0 12px #ff7eb6;
          transform:translate(-50%,-50%);
        `;
        new AMap.Marker({
          position: center,
          content: dot,
          anchor: "center",
          map: _map,
        });

        // Header overlay
        const hud = document.createElement("div");
        hud.style.cssText = `
          position:absolute;top:12px;left:12px;z-index:10;
          color:rgba(255,255,255,0.85);font:11px ui-monospace,monospace;
          background:rgba(10,10,16,0.75);padding:8px 12px;border-radius:6px;
          border:1px solid rgba(255,126,182,0.3);pointer-events:none;
        `;
        hud.innerHTML = `
          <div style="color:#ff7eb6;margin-bottom:4px">SITE SELECTION · POPULATION HEAT</div>
          <div>candidate · People's Square · 5/10/15/20 min</div>
        `;
        ref.current.appendChild(hud);
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
    <div style={{ height: 420, position: "relative" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">heatmap failed to load</div>`;
}
