"use client";
import { useEffect, useRef, useState } from "react";
import { loadLoca } from "../../../lib/sdk";
import type { EngineProps } from "../../types";

// AMap Loca v2: 3D buildings with gradient style, PulseLineLayer routes and breathing ScatterLayer over an AMap dark basemap — requires NEXT_PUBLIC_AMAP_KEY.
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LocaCity({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const el = host.current; if (!el) return; let map: any = null, alive = true;
    loadLoca().then(() => {
      if (!alive) return; const AMap = (window as any).AMap, Loca = (window as any).Loca;
      map = new AMap.Map(el, { mapStyle: "amap://styles/grey", viewMode: "3D", pitch: Number(params.pitch), rotation: 30, zoom: 15.5, center: [121.4974, 31.2335], showBuildingBlock: false, features: ["bg", "road"] });
      const loca = new Loca.Container({ map });
      const buildings = new AMap.Buildings({ zooms: [14, 22], zIndex: 10, heightFactor: Number(params.heightFactor) });
      buildings.setStyle({ hideWithoutStyle: false, areas: [{ rejectTexture: true, color1: "#5ee7ff", color2: "#0c1628", path: [[121.46, 31.22], [121.54, 31.22], [121.54, 31.26], [121.46, 31.26]] }] }); map.add(buildings);
      const line = new Loca.PulseLineLayer({ loca, zIndex: 20 }); line.setSource(new Loca.GeoJSONSource({ data: { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[121.47, 31.225], [121.482, 31.23], [121.49, 31.238], [121.5, 31.234], [121.51, 31.24], [121.52, 31.235]] } }] } })); line.setStyle({ altitude: 4, lineWidth: 4, headColor: "#ffb454", trailColor: "rgba(94,231,255,0.25)", interval: 0.4, duration: 2500 }); loca.add(line);
      const sc = new Loca.ScatterLayer({ loca, zIndex: 30 }); sc.setSource(new Loca.GeoJSONSource({ data: { type: "FeatureCollection", features: [[121.475, 31.228], [121.488, 31.236], [121.5, 31.232], [121.512, 31.241], [121.495, 31.25], [121.48, 31.245]].map((c) => ({ type: "Feature", properties: { v: 1 }, geometry: { type: "Point", coordinates: c } })) } })); sc.setStyle({ unit: "px", size: [40, 40], borderWidth: 0, texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png", duration: 2000, animate: true }); loca.add(sc);
      loca.animate.start();
      onTelemetry({ Engine: "AMap JSAPI 2.0 + Loca 2.0", Layers: "Buildings · PulseLine · Scatter", Pitch: Number(params.pitch), "Height factor": Number(params.heightFactor) });
    }).catch((e) => setErr(String(e?.message ?? e)));
    return () => { alive = false; try { map?.destroy?.(); } catch { /* */ } };
  }, [params.pitch, params.heightFactor, resetKey, onTelemetry]);
  return (<div className="engine-host"><div ref={host} className="engine-fill" />{err && <div className="engine-note">{err}</div>}</div>);
}
