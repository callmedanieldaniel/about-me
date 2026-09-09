"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TRUE_EXT, drawImage, edgeDistance, extMatrix, project, scenePoints, type Extrinsics } from "../../kit/calib";
import { colors, heat, linePlot } from "../../kit/plot";
import type { EngineProps } from "../../types";

// Residual heatmap: distance from projected LiDAR edge points to image edges, aggregated on a grid; plus a coordinate-descent auto-refine.
export default function CalibResidual({ params, playing, resetKey, command, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  const est = useRef<Extrinsics>({ ...TRUE_EXT, yaw: TRUE_EXT.yaw + 2.5, pitch: TRUE_EXT.pitch - 1.2, tx: TRUE_EXT.tx + 0.15 });
  const hist = useRef<number[]>([]);
  const lastCmd = useRef(0);

  useEffect(() => { est.current = { ...TRUE_EXT, yaw: TRUE_EXT.yaw + 2.5, pitch: TRUE_EXT.pitch - 1.2, tx: TRUE_EXT.tx + 0.15 }; hist.current = []; }, [resetKey]);

  useEffect(() => {
    const c = cv.current; if (!c) return;
    const pts = scenePoints().filter((x) => x.edge);
    const IW = 640, IH = 400, fx = 520;
    const cost = (e: Extrinsics) => { const T = extMatrix(e).invert(); const v = new THREE.Vector3(); let s = 0, n = 0; for (let i = 0; i < pts.length; i += 2) { v.copy(pts[i].p).applyMatrix4(T); const pr = project(v, fx, IW, IH); if (!pr) continue; s += Math.min(25, edgeDistance(pr.u, pr.v, IW, IH, fx)); n++; } return n ? s / n : 99; };
    let raf = 0, frames = 0, iter = 0;
    const draw = () => {
      const q = p.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight);
      if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
      const ctx = c.getContext("2d")!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // auto-refine: one coordinate-descent step per frame while playing
      if (command && command.seq !== lastCmd.current && command.name === "refine") { lastCmd.current = command.seq; iter = 0; }
      const e = est.current;
      const c0 = cost(e);
      if (play.current && Boolean(q.auto) && iter < 400) {
        const keys: (keyof Extrinsics)[] = ["yaw", "pitch", "roll", "tx", "ty", "tz"];
        const k = keys[iter % keys.length]; const step = k.startsWith("t") ? 0.02 : 0.15;
        for (const d of [step, -step]) { const trial = { ...e, [k]: e[k] + d }; if (cost(trial) < c0 - 1e-4) { est.current = trial; break; } }
        iter++;
      }
      hist.current.push(c0); if (hist.current.length > 300) hist.current.shift();
      // left: image + edge points; right: residual grid
      const iw = Math.min(W * 0.58, (H - 120) * 1.6), ih = iw / 1.6;
      ctx.save(); ctx.translate(12, 12);
      drawImage(ctx, iw, ih, fx * (iw / IW));
      const T = extMatrix(est.current).invert(); const v = new THREE.Vector3();
      const G = Number(q.gridCells); const grid = new Float32Array(G * G), cnt = new Float32Array(G * G);
      for (const pt of pts) { v.copy(pt.p).applyMatrix4(T); const pr = project(v, fx, IW, IH); if (!pr) continue; const r = Math.min(25, edgeDistance(pr.u, pr.v, IW, IH, fx)); const gi = Math.min(G - 1, Math.floor((pr.u / IW) * G)) + Math.min(G - 1, Math.floor((pr.v / IH) * G)) * G; grid[gi] += r; cnt[gi]++; ctx.fillStyle = heat(r / 12); ctx.fillRect((pr.u / IW) * iw - 1, (pr.v / IH) * ih - 1, 2, 2); }
      ctx.restore();
      const rx = 24 + iw, rw = W - rx - 12, rh = ih;
      ctx.save(); ctx.translate(rx, 12);
      ctx.fillStyle = colors.muted; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText("mean residual per cell (px)", 0, -2);
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { const i = gx + gy * G; const m = cnt[i] ? grid[i] / cnt[i] : NaN; ctx.fillStyle = Number.isNaN(m) ? "#0d1420" : heat(m / 12); ctx.fillRect((gx / G) * rw, (gy / G) * rh, rw / G - 1, rh / G - 1); }
      ctx.restore();
      linePlot(ctx, { x: 12, y: ih + 30, w: W - 24, h: H - ih - 42 }, [{ data: hist.current, color: colors.live, label: "mean residual (px)" }], { title: "residual over refinement steps", min: 0 });
      if ((frames++ & 7) === 0) onTelemetry({ "Mean residual (px)": c0, "Refine steps": iter, "Est yaw (°)": est.current.yaw, "True yaw (°)": TRUE_EXT.yaw, "Est pitch (°)": est.current.pitch, "Est tx (m)": est.current.tx });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry, command]);
  return <canvas ref={cv} className="engine-host" />;
}
