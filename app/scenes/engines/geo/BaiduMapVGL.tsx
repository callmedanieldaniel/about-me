"use client";
import { useEffect, useRef, useState } from "react";
import { loadBMap, loadScript } from "../../../lib/sdk";
import { CITIES } from "../../kit/geodata";
import type { EngineProps } from "../../types";

// Baidu Maps GL + MapVGL: PointLayer, HeatmapLayer / HexagonLayer and FlyLineLayer — requires NEXT_PUBLIC_BAIDU_KEY (browser AK).
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BaiduMapVGL({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const el = host.current; if (!el) return; let alive = true; let view: any = null;
    (async () => {
      try {
        const BMapGL: any = await loadBMap(); await loadScript("https://unpkg.com/mapvgl@1.0.0-beta.194/dist/mapvgl.min.js"); if (!alive) return;
        const mapvgl = (window as any).mapvgl; const map = new BMapGL.Map(el, { enableMapClick: false }); map.centerAndZoom(new BMapGL.Point(108, 34), 5); map.enableScrollWheelZoom(); map.setTilt(Number(params.tilt)); map.setMapStyleV2({ styleId: "dark" } as any);
        view = new mapvgl.View({ map }); const mode = String(params.layer);
        const data = CITIES.map(([name, lng, lat, v]) => ({ geometry: { type: "Point", coordinates: [lng, lat] }, properties: { name, count: v } }));
        if (mode === "points") view.addLayer(new mapvgl.PointLayer({ blend: "lighter", size: 24, color: "rgba(94,231,255,0.8)", enablePicked: true, data }));
        if (mode === "heatmap") view.addLayer(new mapvgl.HeatmapLayer({ size: 400000, height: 200000, unit: "m", max: 100, gradient: { 0.2: "#0c1628", 0.5: "#5ee7ff", 0.8: "#ffb454", 1: "#ff5d73" }, data }));
        if (mode === "flyline") { const hub = CITIES[0]; view.addLayer(new mapvgl.FlyLineLayer({ style: "chaos", step: 0.3, color: "rgba(94,231,255,0.5)", textureColor: "#ffb454", textureWidth: 20, textureLength: 15, data: CITIES.slice(1).map(([, lng, lat]) => ({ geometry: { type: "LineString", coordinates: [[hub[1], hub[2]], [lng, lat]] } })) })); view.addLayer(new mapvgl.PointLayer({ size: 12, color: "#ffb454", data })); }
        onTelemetry({ Engine: "Baidu Maps GL + MapVGL", Layer: mode, Cities: CITIES.length, Tilt: Number(params.tilt) });
      } catch (e: any) { setErr(String(e?.message ?? e)); }
    })();
    return () => { alive = false; try { view?.destroy?.(); } catch { /* */ } };
  }, [params.layer, params.tilt, resetKey, onTelemetry]);
  return (<div className="engine-host"><div ref={host} className="engine-fill" />{err && <div className="engine-note">{err}</div>}</div>);
}
