"use client";
import { useEffect, useRef, useState } from "react";
import { loadLoca } from "../../../lib/sdk";
import { CITIES } from "../../kit/geodata";
import type { EngineProps } from "../../types";

// AMap Loca: national-scale LinkLayer flights from hubs plus breathing ScatterLayer sized by value — requires NEXT_PUBLIC_AMAP_KEY.
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LocaFlights({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const el = host.current; if (!el) return; let map: any = null, alive = true;
    loadLoca().then(() => {
      if (!alive) return; const AMap = (window as any).AMap, Loca = (window as any).Loca;
      map = new AMap.Map(el, { mapStyle: "amap://styles/dark", viewMode: "3D", pitch: 45, rotation: -10, zoom: 4.5, center: [108, 33.5], features: ["bg", "road"] });
      const loca = new Loca.Container({ map });
      const sc = new Loca.ScatterLayer({ loca, zIndex: 30 }); sc.setSource(new Loca.GeoJSONSource({ data: { type: "FeatureCollection", features: CITIES.map(([, lng, lat, v]) => ({ type: "Feature", properties: { value: v }, geometry: { type: "Point", coordinates: [lng, lat] } })) } })); sc.setStyle({ unit: "px", size: (_i: number, f: any) => [f.properties.value * 0.6, f.properties.value * 0.6], texture: "https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png", animate: true, duration: 2400 }); loca.add(sc);
      const hubs = CITIES.slice(0, Number(params.hubs)); const features = hubs.flatMap((h) => CITIES.filter((c) => c[0] !== h[0]).map((c) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[h[1], h[2]], [c[1], c[2]]] } })));
      const link = new Loca.LinkLayer({ loca, zIndex: 20 }); link.setSource(new Loca.GeoJSONSource({ data: { type: "FeatureCollection", features } })); link.setStyle({ lineColors: ["#5ee7ff", "#b99cff", "#ffb454"], height: Number(params.height), smoothSteps: 60 }); loca.add(link);
      loca.animate.start();
      onTelemetry({ Engine: "AMap Loca 2.0", Hubs: hubs.length, Links: features.length, "Arc height": Number(params.height) });
    }).catch((e) => setErr(String(e?.message ?? e)));
    return () => { alive = false; try { map?.destroy?.(); } catch { /* */ } };
  }, [params.hubs, params.height, resetKey, onTelemetry]);
  return (<div className="engine-host"><div ref={host} className="engine-fill" />{err && <div className="engine-note">{err}</div>}</div>);
}
