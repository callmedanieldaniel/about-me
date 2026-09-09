"use client";
import { useEffect, useRef } from "react";
import { SAMPLE_XODR, parseOpenDrive, shortestPath } from "../../kit/opendrive";
import { colors, fitCanvas } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Lane-level routing: Dijkstra over the lane graph (lane changes cost 0.4× length), animated along the route.
export default function LaneRoute({ params, playing, resetKey, asset, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    let net; try { net = parseOpenDrive(asset ? new TextDecoder().decode(asset) : SAMPLE_XODR); } catch { net = parseOpenDrive(SAMPLE_XODR); }
    const N = net; const L = new Map(N.lanes.map((l) => [l.key, l]));
    let raf = 0, t = 0, last = performance.now(), frames = 0, lastKey = "";
    let route: string[] = [], routePts: [number, number][] = [], routeLen = 0;
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const from = String(q.from), to = String(q.to);
      if (from + to !== lastKey) { lastKey = from + to; route = L.has(from) && L.has(to) ? shortestPath(N, from, to) : []; routePts = route.flatMap((k) => { const l = L.get(k)!; return l.id > 0 ? [...l.center].reverse() : l.center; }); routeLen = 0; for (let i = 1; i < routePts.length; i++) routeLen += Math.hypot(routePts[i][0] - routePts[i - 1][0], routePts[i][1] - routePts[i - 1][1]); t = 0; }
      if (play.current) t += dt * Number(q.speed);
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const [minx, miny, maxx, maxy] = N.bbox; const s = Math.min((w - 60) / (maxx - minx), (h - 60) / (maxy - miny)); const T = (x: number, y: number): [number, number] => [30 + (x - minx) * s, h - 30 - (y - miny) * s];
      for (const l of N.lanes) { ctx.beginPath(); l.inner.forEach(([x, y], i) => { const [px, py] = T(x, y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); [...l.outer].reverse().forEach(([x, y]) => { const [px, py] = T(x, y); ctx.lineTo(px, py); }); ctx.closePath(); ctx.fillStyle = route.includes(l.key) ? "rgba(124,243,160,0.35)" : l.type === "driving" ? "#13202f" : "#1b2533"; ctx.fill(); ctx.strokeStyle = "#2a3b52"; ctx.stroke(); }
      if (routePts.length > 1) {
        ctx.strokeStyle = colors.ok; ctx.lineWidth = 2.5; ctx.beginPath(); routePts.forEach(([x, y], i) => { const [px, py] = T(x, y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }); ctx.stroke();
        // vehicle
        let d = (t % routeLen), i = 1; while (i < routePts.length && d > Math.hypot(routePts[i][0] - routePts[i - 1][0], routePts[i][1] - routePts[i - 1][1])) { d -= Math.hypot(routePts[i][0] - routePts[i - 1][0], routePts[i][1] - routePts[i - 1][1]); i++; }
        if (i < routePts.length) { const a = routePts[i - 1], b = routePts[i]; const seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; const k = d / seg; const [vx, vy] = T(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); ctx.fillStyle = colors.ref; ctx.beginPath(); ctx.arc(vx, vy, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(255,180,84,0.4)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(vx, vy, 10 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke(); }
        const [sx, sy] = T(routePts[0][0], routePts[0][1]), [ex, ey] = T(routePts[routePts.length - 1][0], routePts[routePts.length - 1][1]);
        ctx.fillStyle = colors.live; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = colors.bad; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(route.length ? `route: ${route.join(" → ")}` : "No route between the selected lanes", 12, 18);
      if ((frames++ & 15) === 0) onTelemetry({ From: from, To: to, "Lanes in route": route.length, "Route length (m)": routeLen, "Lane changes": route.filter((k, i) => i && L.get(k)!.road === L.get(route[i - 1])!.road).length, "Graph nodes": N.lanes.filter((l) => l.type === "driving").length });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, asset, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
