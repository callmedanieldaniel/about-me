"use client";

import { useEffect, useRef } from "react";
import { loadAMap } from "../lib/sdk";

// Real AMap with driving route + truck-restricted polygon overlays
export default function TruckDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let map: { destroy?: () => void } | null = null;

    loadAMap(["AMap.Driving"])
      .then((AMapAny) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = AMapAny as any;

        map = new AMap.Map(ref.current, {
          viewMode: "2D",
          mapStyle: "amap://styles/dark",
          center: [121.5, 31.23],
          zoom: 11.5,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;

        // Truck-restricted polygons (around inner ring / hazmat zones)
        const restrictedPaths: [number, number][][] = [
          [
            [121.460, 31.225],
            [121.485, 31.225],
            [121.485, 31.245],
            [121.460, 31.245],
          ],
          [
            [121.530, 31.205],
            [121.555, 31.205],
            [121.555, 31.220],
            [121.530, 31.220],
          ],
        ];
        restrictedPaths.forEach((path) => {
          const poly = new AMap.Polygon({
            path,
            strokeColor: "#ff5a50",
            strokeWeight: 2,
            strokeOpacity: 0.9,
            strokeStyle: "dashed",
            fillColor: "#ff5a50",
            fillOpacity: 0.18,
          });
          _map.add(poly);
        });

        // Driving route — start in Pudong port, end near a logistic hub west
        const start: [number, number] = [121.610, 31.190];
        const end: [number, number] = [121.380, 31.275];
        const waypoints = [
          [121.560, 31.215] as [number, number],
          [121.500, 31.260] as [number, number],
        ];

        const driving = new AMap.Driving({
          map: _map,
          policy: AMap.DrivingPolicy ? AMap.DrivingPolicy.LEAST_TIME : 0,
          hideMarkers: true,
          autoFitView: false,
        });

        driving.search(
          start,
          end,
          { waypoints },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (status: string, result: any) => {
            if (status !== "complete") {
              // Fallback to manual polyline if routing fails (e.g. quota)
              const fallback = new AMap.Polyline({
                path: [start, ...waypoints, end],
                strokeColor: "#79ffe1",
                strokeWeight: 6,
                strokeOpacity: 0.9,
                lineJoin: "round",
                lineCap: "round",
              });
              _map.add(fallback);
            }
            void result;
          }
        );

        // Start / waypoint / end markers
        const dot = (lng: number, lat: number, color: string, label: string) => {
          const el = document.createElement("div");
          el.style.cssText = `
            display:flex;align-items:center;gap:6px;
            color:#fff;font:10px ui-monospace,monospace;
            background:${color};
            padding:3px 8px;border-radius:999px;
            white-space:nowrap;
            box-shadow:0 2px 8px ${color}66;
            transform:translate(-50%,-50%);
          `;
          el.textContent = label;
          new AMap.Marker({
            position: [lng, lat],
            content: el,
            anchor: "center",
            map: _map,
          });
        };
        dot(start[0], start[1], "#ff7eb6", "WAREHOUSE");
        dot(end[0], end[1], "#ff7eb6", "DROP-OFF");
        waypoints.forEach(([lng, lat], i) =>
          dot(lng, lat, "rgba(121,255,225,0.85)", `STOP ${i + 1}`)
        );

        // restricted labels
        restrictedPaths.forEach((path) => {
          const cx = (path[0][0] + path[2][0]) / 2;
          const cy = (path[0][1] + path[2][1]) / 2;
          const el = document.createElement("div");
          el.style.cssText = `
            color:#ff5a50;font:10px ui-monospace,monospace;
            background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:4px;
            transform:translate(-50%,-50%);
          `;
          el.textContent = "TRUCK RESTRICTED";
          new AMap.Marker({
            position: [cx, cy],
            content: el,
            anchor: "center",
            map: _map,
          });
        });
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
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">AMap failed to load</div>`;
}
