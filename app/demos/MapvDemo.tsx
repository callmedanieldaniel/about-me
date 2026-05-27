"use client";

import { useEffect, useRef } from "react";
import { loadBMap, loadMapv } from "../lib/sdk";

// Real mapv on Baidu BMapGL — heatmap with 5000 points
export default function MapvDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let mapRef: { destroy?: () => void } | null = null;

    Promise.all([loadBMap(), loadMapv()])
      .then(([BMapGLAny, mapvAny]) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const BMapGL = BMapGLAny as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapv = mapvAny as any;

        const map = new BMapGL.Map(ref.current);
        mapRef = map;
        map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
        map.enableScrollWheelZoom();
        map.setHeading(0);
        map.setTilt(35);

        // Dark style
        map.setMapStyleV2({ styleId: "midnight" });

        // Generate density points around several Beijing hotspots
        const hotspots: [number, number][] = [
          [116.404, 39.915],   // Tiananmen
          [116.327, 39.984],   // Zhongguancun
          [116.477, 39.937],   // CBD
          [116.351, 39.872],   // South Fourth Ring
          [116.291, 39.951],   // West
          [116.470, 39.992],   // North-east
        ];
        const data: { geometry: { type: "Point"; coordinates: [number, number] }; count: number }[] = [];
        hotspots.forEach(([clng, clat]) => {
          for (let i = 0; i < 900; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.pow(Math.random(), 0.6) * 0.06;
            data.push({
              geometry: {
                type: "Point",
                coordinates: [clng + Math.cos(a) * r, clat + Math.sin(a) * r * 0.7],
              },
              count: 1 + Math.random() * 10,
            });
          }
        });
        const dataSet = new mapv.DataSet(data);

        const opts = {
          fillStyle: "rgba(255, 126, 182, 0.85)",
          shadowColor: "rgba(255, 126, 182, 0.5)",
          shadowBlur: 20,
          size: 7,
          globalAlpha: 0.7,
          gradient: {
            0.15: "#3742fa",
            0.35: "#79ffe1",
            0.6: "#f0c83c",
            0.85: "#ff7eb6",
            1.0: "#ff5a50",
          },
          max: 60,
          draw: "heatmap",
        };

        new mapv.baiduMapLayer(map, dataSet, opts);

        // HUD
        const hud = document.createElement("div");
        hud.style.cssText = `
          position:absolute;top:12px;left:12px;z-index:10;
          color:rgba(255,255,255,0.85);font:11px ui-monospace,monospace;
          background:rgba(10,10,16,0.75);padding:8px 12px;border-radius:6px;
          border:1px solid rgba(255,126,182,0.3);pointer-events:none;
        `;
        hud.innerHTML = `
          <div style="color:#ff7eb6;margin-bottom:4px">mapv · BAIDU MAP · HEATMAP</div>
          <div>5,400 points · 6 hotspots · radius 7px gaussian</div>
        `;
        ref.current.appendChild(hud);
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = errorBox();
      });

    return () => {
      alive = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = mapRef as any;
      if (m && typeof m.destroy === "function") {
        try { m.destroy(); } catch { /* noop */ }
      }
    };
  }, []);

  return (
    <div style={{ height: 440, position: "relative" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">mapv/BMap failed to load</div>`;
}
