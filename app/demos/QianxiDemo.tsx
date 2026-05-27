"use client";

import { useEffect, useRef } from "react";
import { loadBMap, loadMapv } from "../lib/sdk";

// Real mapv migration layer on Baidu BMapGL — animated arcs across China
export default function QianxiDemo() {
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
        map.centerAndZoom(new BMapGL.Point(108, 33.5), 4.6);
        map.enableScrollWheelZoom();
        map.setMapStyleV2({ styleId: "midnight" });

        // Major Chinese cities
        const cities: [string, number, number][] = [
          ["Beijing",   116.405, 39.917],
          ["Shanghai",  121.473, 31.230],
          ["Guangzhou", 113.264, 23.129],
          ["Shenzhen",  114.058, 22.543],
          ["Chengdu",   104.066, 30.572],
          ["Chongqing", 106.551, 29.563],
          ["Wuhan",     114.305, 30.593],
          ["Xi'an",     108.940, 34.341],
          ["Hangzhou",  120.155, 30.274],
          ["Nanjing",   118.767, 32.041],
          ["Tianjin",   117.190, 39.125],
          ["Qingdao",   120.382, 36.067],
          ["Kunming",   102.832, 24.880],
          ["Harbin",    126.535, 45.802],
          ["Urumqi",     87.617, 43.825],
        ];

        // OD pairs — origin/dest pulls everyone toward big cities
        const data: { geometry: { type: "LineString"; coordinates: [number, number][] }; count: number }[] = [];
        const heavy = [0, 1, 2, 3]; // Beijing/Shanghai/Guangzhou/Shenzhen draw heavily
        for (let i = 0; i < cities.length; i++) {
          for (const j of heavy) {
            if (i === j) continue;
            data.push({
              geometry: {
                type: "LineString",
                coordinates: [
                  [cities[i][1], cities[i][2]],
                  [cities[j][1], cities[j][2]],
                ],
              },
              count: 4 + Math.random() * 10,
            });
          }
        }

        const dataSet = new mapv.DataSet(data);
        new mapv.baiduMapLayer(map, dataSet, {
          strokeStyle: "rgba(121, 255, 225, 0.7)",
          shadowColor: "rgba(121, 255, 225, 0.6)",
          shadowBlur: 12,
          lineWidth: 1.2,
          globalAlpha: 0.85,
          methods: { click: () => {} },
          animation: {
            stepsRange: { start: 0, end: 100 },
            trailLength: 12,
            duration: 18,
            type: "default",
          },
          draw: "simple",
        });

        // City dot markers via second mapv layer
        const cityData = cities.map(([, lng, lat]) => ({
          geometry: { type: "Point", coordinates: [lng, lat] },
          count: 1,
        }));
        new mapv.baiduMapLayer(map, new mapv.DataSet(cityData), {
          fillStyle: "rgba(255, 126, 182, 1)",
          shadowColor: "#ff7eb6",
          shadowBlur: 16,
          size: 5,
          draw: "simple",
        });

        // HUD
        const hud = document.createElement("div");
        hud.style.cssText = `
          position:absolute;top:12px;left:12px;z-index:10;
          color:rgba(255,255,255,0.85);font:11px ui-monospace,monospace;
          background:rgba(10,10,16,0.75);padding:8px 12px;border-radius:6px;
          border:1px solid rgba(121,255,225,0.3);pointer-events:none;
        `;
        hud.innerHTML = `
          <div style="color:#79ffe1;margin-bottom:4px">mapv · MIGRATION FLOW</div>
          <div>15 cities · 56 OD pairs · animated polyline trails</div>
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
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">mapv migration failed to load</div>`;
}
