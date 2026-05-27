"use client";

import { useEffect, useRef } from "react";
import { loadBMap } from "../lib/sdk";

// Baidu BMapGL — 3D tilt + custom markers + heading sweep
export default function BaiduSdkDemo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    loadBMap()
      .then((BMapGLAny) => {
        if (!alive || !ref.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const BMapGL = BMapGLAny as any;

        map = new BMapGL.Map(ref.current, {
          enableMapClick: false,
        });
        map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 16);
        map.enableScrollWheelZoom();
        map.setHeading(40);
        map.setTilt(60);
        map.setMapStyleV2({ styleId: "midnight" });

        // Markers
        const places: [string, number, number][] = [
          ["Tiananmen", 116.397, 39.908],
          ["Forbidden City", 116.397, 39.917],
          ["Wangfujing", 116.413, 39.913],
          ["Beihai", 116.388, 39.928],
        ];
        places.forEach(([label, lng, lat]) => {
          const el = document.createElement("div");
          el.style.cssText = `
            display:flex;align-items:center;gap:6px;
            color:#fff;font:11px ui-monospace,monospace;
            background:rgba(255,126,182,0.9);
            padding:3px 8px;border-radius:999px;
            white-space:nowrap;
            transform:translate(-50%,-100%);
            box-shadow:0 2px 8px rgba(255,126,182,0.4);
          `;
          el.innerHTML = `<span style="width:6px;height:6px;background:#fff;border-radius:50%"></span>${label}`;
          map.addOverlay(
            new BMapGL.Marker(new BMapGL.Point(lng, lat), {
              icon: new BMapGL.Icon(
                "data:image/svg+xml;base64," +
                  btoa(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
                  ),
                new BMapGL.Size(1, 1)
              ),
            })
          );
          const label2 = new BMapGL.Label(label, {
            position: new BMapGL.Point(lng, lat),
            offset: new BMapGL.Size(-20, -28),
          });
          label2.setStyle({
            color: "#fff",
            background: "rgba(255,126,182,0.9)",
            border: "none",
            padding: "3px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontFamily: "ui-monospace, monospace",
          });
          map.addOverlay(label2);
        });

        // Heading sweep animation
        let h = 40;
        const tick = () => {
          if (!alive || !map) return;
          h += 0.15;
          map.setHeading(h);
          requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = errorBox();
      });

    return () => {
      alive = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = map as any;
      if (m && typeof m.destroy === "function") {
        try { m.destroy(); } catch { /* noop */ }
      }
    };
  }, []);

  return (
    <div style={{ height: 420 }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">BMapGL failed to load</div>`;
}
