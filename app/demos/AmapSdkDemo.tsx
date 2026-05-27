"use client";

import { useEffect, useRef } from "react";
import { loadAMap } from "../lib/sdk";

// AMap JS API v2 — dark style + 3D tilt + custom markers
export default function AmapSdkDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: { destroy?: () => void } | null = null;
    let alive = true;

    loadAMap([])
      .then((AMapAny) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = AMapAny as any;
        map = new AMap.Map(ref.current, {
          viewMode: "3D",
          mapStyle: "amap://styles/dark",
          center: [121.473667, 31.230525], // Shanghai
          zoom: 14,
          pitch: 50,
          rotation: -15,
          features: ["bg", "road", "building", "point"],
        });

        // Animated marker labels for landmarks
        const points: [number, number, string][] = [
          [121.500372, 31.236302, "Lujiazui"],
          [121.473667, 31.230525, "People's Sq."],
          [121.481667, 31.245833, "Bund"],
          [121.456111, 31.214722, "Xintiandi"],
          [121.520833, 31.197222, "Expo Park"],
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;
        points.forEach(([lng, lat, label]) => {
          const dom = document.createElement("div");
          dom.style.cssText = `
            display:flex;align-items:center;gap:6px;
            color:#fff;font:11px ui-monospace,monospace;
            background:rgba(255,126,182,0.85);
            padding:3px 8px;border-radius:999px;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(255,126,182,0.4);
            transform:translate(-50%,-100%);
          `;
          dom.innerHTML = `<span style="width:6px;height:6px;background:#fff;border-radius:50%;"></span>${label}`;
          new AMap.Marker({
            position: [lng, lat],
            content: dom,
            anchor: "bottom-center",
            map: _map,
          });
        });

        // Building layer toggle (already on via features)
        _map.on("complete", () => {
          // gentle rotation
          let angle = -15;
          const rot = () => {
            angle += 0.1;
            _map?.setRotation(angle);
            if (alive) requestAnimationFrame(rot);
          };
          rot();
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
    <div style={{ height: 420 }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">map SDK failed to load (check key / network)</div>`;
}
