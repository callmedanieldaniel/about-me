"use client";

import { useEffect, useRef } from "react";
import { loadAMap } from "../lib/sdk";

// Real AMap with live traffic tile layer
export default function JiaotongDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let map: { destroy?: () => void } | null = null;

    loadAMap([])
      .then((AMapAny) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = AMapAny as any;

        map = new AMap.Map(ref.current, {
          viewMode: "2D",
          mapStyle: "amap://styles/dark",
          center: [116.397428, 39.90923], // Beijing center
          zoom: 12,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;

        // Live traffic layer
        const traffic = new AMap.TileLayer.Traffic({
          zIndex: 10,
          autoRefresh: true,
          interval: 60,
        });
        _map.add(traffic);

        // HUD overlay
        const hud = document.createElement("div");
        hud.style.cssText = `
          position:absolute;top:12px;left:12px;z-index:10;
          color:rgba(255,255,255,0.8);
          font:11px ui-monospace,monospace;
          background:rgba(10,10,16,0.7);padding:8px 12px;
          border-radius:6px;border:1px solid rgba(255,126,182,0.3);
          pointer-events:none;
        `;
        hud.innerHTML = `
          <div style="color:#ff7eb6;margin-bottom:4px">REAL-TIME · BEIJING ROAD SPEED</div>
          <div style="display:flex;gap:14px">
            <span><span style="display:inline-block;width:8px;height:8px;background:#79ffe1;margin-right:4px;vertical-align:middle"></span>free</span>
            <span><span style="display:inline-block;width:8px;height:8px;background:#f0c83c;margin-right:4px;vertical-align:middle"></span>slow</span>
            <span><span style="display:inline-block;width:8px;height:8px;background:#ff5a50;margin-right:4px;vertical-align:middle"></span>jam</span>
          </div>
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
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">AMap traffic failed to load</div>`;
}
