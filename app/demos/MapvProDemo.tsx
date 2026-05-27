"use client";

import { useEffect, useRef } from "react";
import { loadLoca } from "../lib/sdk";

// "Big screen" mock — real AMap + Loca with pulse-line + scatter +
// side panels (KPI / sparkline / Top-N) drawn as HTML overlays.
export default function MapvProDemo() {
  const mapRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    let map: { destroy?: () => void } | null = null;

    loadLoca()
      .then(() => {
        if (!alive || !mapRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Loca = (window as any).Loca;

        map = new AMap.Map(mapRef.current, {
          mapStyle: "amap://styles/dark",
          viewMode: "3D",
          pitch: 45,
          rotation: -10,
          zoom: 4.5,
          center: [108, 33.5],
          features: ["bg", "road"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const _map = map as any;

        const loca = new Loca.Container({ map: _map });

        // Province-level data points
        const cityData: [string, number, number, number][] = [
          ["Beijing", 116.4, 39.9, 100],
          ["Shanghai", 121.5, 31.2, 95],
          ["Guangzhou", 113.3, 23.1, 80],
          ["Shenzhen", 114.1, 22.5, 85],
          ["Chengdu", 104.1, 30.6, 75],
          ["Wuhan", 114.3, 30.6, 70],
          ["Xi'an", 108.9, 34.3, 65],
          ["Chongqing", 106.5, 29.6, 70],
          ["Hangzhou", 120.2, 30.3, 72],
          ["Nanjing", 118.8, 32.0, 65],
          ["Tianjin", 117.2, 39.1, 60],
          ["Qingdao", 120.4, 36.1, 55],
          ["Kunming", 102.8, 24.9, 50],
        ];

        const scatterGeo = {
          type: "FeatureCollection",
          features: cityData.map(([, lng, lat, v]) => ({
            type: "Feature",
            properties: { value: v },
            geometry: { type: "Point", coordinates: [lng, lat] },
          })),
        };
        const scatterSource = new Loca.GeoJSONSource({ data: scatterGeo });
        const scatter = new Loca.ScatterLayer({ loca, zIndex: 30 });
        scatter.setSource(scatterSource);
        scatter.setStyle({
          unit: "px",
          size: (_i: number, f: { properties: { value: number } }) => {
            const v = f.properties.value;
            return [v * 0.6, v * 0.6];
          },
          texture:
            "https://a.amap.com/Loca/static/loca-v2/demos/images/breath_red.png",
          animate: true,
          duration: 2400,
        });
        loca.add(scatter);

        // OD lines from Beijing/Shanghai to all
        const lineFeatures: { type: string; geometry: { type: string; coordinates: [number, number][] }; properties: Record<string, never> }[] = [];
        const hubs = cityData.slice(0, 2);
        for (const hub of hubs) {
          for (const c of cityData) {
            if (c[0] === hub[0]) continue;
            lineFeatures.push({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [hub[1], hub[2]],
                  [c[1], c[2]],
                ],
              },
            });
          }
        }
        const lineSource = new Loca.GeoJSONSource({
          data: { type: "FeatureCollection", features: lineFeatures },
        });
        const pulse = new Loca.PulseLineLayer({ loca, zIndex: 20 });
        pulse.setSource(lineSource);
        pulse.setStyle({
          altitude: 0,
          lineWidth: 1.4,
          headColor: "#ff7eb6",
          trailColor: "rgba(121,255,225,0.2)",
          interval: 0.3,
          duration: 3000,
        });
        loca.add(pulse);
        loca.animate.start();
      })
      .catch(() => {
        if (mapRef.current) mapRef.current.innerHTML = errorBox();
      });

    // Side-panel sparkline
    const sc = sparkRef.current;
    const bc = barRef.current;
    let series = Array.from({ length: 60 }, () => 0.4 + Math.random() * 0.3);
    let bars = Array.from({ length: 8 }, () => 0.3 + Math.random() * 0.7);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fit = (c: HTMLCanvasElement) => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr;
      c.height = r.height * dpr;
    };
    if (sc) fit(sc);
    if (bc) fit(bc);

    let raf = 0;
    const draw = () => {
      // sparkline
      if (sc) {
        const ctx = sc.getContext("2d")!;
        const w = sc.width, h = sc.height;
        ctx.clearRect(0, 0, w, h);
        series.shift();
        series.push(Math.max(0.1, Math.min(0.95, series[series.length - 1] + (Math.random() - 0.5) * 0.06)));
        ctx.beginPath();
        series.forEach((v, i) => {
          const px = (i / (series.length - 1)) * w;
          const py = (1 - v) * h;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(121,255,225,0.5)");
        g.addColorStop(1, "rgba(121,255,225,0)");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        series.forEach((v, i) => {
          const px = (i / (series.length - 1)) * w;
          const py = (1 - v) * h;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = "#79ffe1";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }
      // bars
      if (bc) {
        const ctx = bc.getContext("2d")!;
        const w = bc.width, h = bc.height;
        ctx.clearRect(0, 0, w, h);
        bars = bars.map((b) => Math.max(0.15, Math.min(1, b + (Math.random() - 0.5) * 0.04)));
        const bw = w / bars.length - 4 * dpr;
        bars.forEach((b, i) => {
          ctx.fillStyle = "rgba(255,126,182,0.75)";
          ctx.fillRect(i * (bw + 4 * dpr), (1 - b) * h, bw, b * h);
        });
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (map && typeof map.destroy === "function") map.destroy();
    };
  }, []);

  return (
    <div
      style={{
        height: 460,
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: 8,
        padding: 8,
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid rgba(255,126,182,0.3)",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateRows: "56px 1fr 1fr",
          gap: 8,
        }}
      >
        <KPIRow />
        <Panel title="THROUGHPUT · 60s">
          <canvas ref={sparkRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </Panel>
        <Panel title="TOP CITY · last min">
          <canvas ref={barRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </Panel>
      </div>
    </div>
  );
}

function KPIRow() {
  const data: [string, string, string][] = [
    ["DEVICES", "12.4k", "+3.2%"],
    ["EVENTS/s", "2,891", "+7.8%"],
    ["LATENCY", "84ms", "-1.4%"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {data.map(([k, v, d]) => (
        <div
          key={k}
          style={{
            padding: 8,
            border: "1px solid rgba(255,126,182,0.3)",
            borderRadius: 6,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              color: "#ff7eb6",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              letterSpacing: "0.06em",
            }}
          >
            {k}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 18,
              color: "#fff",
              marginTop: 2,
            }}
          >
            {v}
          </div>
          <div
            style={{
              color: d.startsWith("+") ? "#79ffe1" : "#ff7eb6",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
            }}
          >
            {d}
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,126,182,0.3)",
        borderRadius: 6,
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: "#ff7eb6",
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          padding: "6px 10px",
          borderBottom: "1px solid rgba(255,126,182,0.2)",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, padding: 8 }}>{children}</div>
    </div>
  );
}

function errorBox() {
  return `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#8b8a96;font-family:ui-monospace,monospace;font-size:12px;">Loca failed</div>`;
}
