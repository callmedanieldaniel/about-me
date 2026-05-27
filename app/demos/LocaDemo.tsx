"use client";

import { useEffect, useRef } from "react";
import { loadLoca } from "../lib/sdk";

// AMap Loca v2 — pulse-line + scatter scan over a dark city
export default function LocaDemo() {
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

        map = new AMap.Map(ref.current, {
          mapStyle: "amap://styles/grey",
          viewMode: "3D",
          pitch: 60,
          rotation: 30,
          zoom: 15.5,
          center: [121.4974, 31.2335],
          showBuildingBlock: false,
          features: ["bg", "road"],
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;
        const loca = new Loca.Container({ map: _map });

        // Building layer (the signature Loca look)
        const buildingLayer = new Loca.HeatmapLayer({
          zIndex: 10,
        });

        // Use Loca.PolygonLayer with extruded buildings via AMap.Buildings
        const buildings = new AMap.Buildings({
          zooms: [14, 22],
          zIndex: 10,
          heightFactor: 2,
        });
        const buildingStyle = {
          hideWithoutStyle: false,
          areas: [
            {
              rejectTexture: true,
              color1: "#ff7eb6",
              color2: "#79ffe1",
              path: [
                [121.46, 31.22],
                [121.54, 31.22],
                [121.54, 31.26],
                [121.46, 31.26],
              ],
            },
          ],
        };
        buildings.setStyle(buildingStyle);
        _map.add(buildings);

        // Pulse line — animated stroked line layer
        const lineGeo = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [121.470, 31.225],
                  [121.482, 31.230],
                  [121.490, 31.238],
                  [121.500, 31.234],
                  [121.510, 31.240],
                  [121.520, 31.235],
                ],
              },
            },
          ],
        };
        const lineSource = new Loca.GeoJSONSource({ data: lineGeo });
        const pulseLine = new Loca.PulseLineLayer({
          loca,
          zIndex: 20,
          opacity: 1,
          visible: true,
        });
        pulseLine.setSource(lineSource);
        pulseLine.setStyle({
          altitude: 4,
          lineWidth: 4,
          headColor: "#ff7eb6",
          trailColor: "rgba(121,255,225,0.2)",
          interval: 0.4,
          duration: 2500,
        });
        loca.add(pulseLine);

        // Scatter pulse points
        const scatterGeo = {
          type: "FeatureCollection",
          features: [
            [121.475, 31.228],
            [121.488, 31.236],
            [121.500, 31.232],
            [121.512, 31.241],
            [121.495, 31.250],
            [121.480, 31.245],
          ].map((c) => ({
            type: "Feature",
            properties: { v: 1 },
            geometry: { type: "Point", coordinates: c },
          })),
        };
        const scatterSource = new Loca.GeoJSONSource({ data: scatterGeo });
        const scatter = new Loca.ScatterLayer({
          loca,
          zIndex: 30,
        });
        scatter.setSource(scatterSource);
        scatter.setStyle({
          unit: "px",
          size: [40, 40],
          borderWidth: 0,
          texture:
            "https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png",
          duration: 2000,
          animate: true,
        });
        loca.add(scatter);

        loca.animate.start();

        // unused — silence TS
        void buildingLayer;
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
    <div style={{ height: 460 }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">Loca failed to load</div>`;
}
