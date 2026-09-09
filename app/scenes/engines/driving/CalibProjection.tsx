"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { TRUE_EXT, drawImage, extMatrix, project, scenePoints, type Extrinsics } from "../../kit/calib";
import { colors, heat } from "../../kit/plot";
import type { EngineProps } from "../../types";

// LiDAR → camera projection with editable extrinsics. Points colored by depth; misalignment is visible against the image.
export default function CalibProjection({ params, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const pts = scenePoints();
    let raf = 0, frames = 0;
    const draw = () => {
      const q = p.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight);
      if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
      const ctx = c.getContext("2d")!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const iw = Math.min(W - 24, (H - 24) * 1.6), ih = iw / 1.6, ox = (W - iw) / 2, oy = (H - ih) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.save(); ctx.translate(ox, oy);
      const fx = Number(q.focal) * (iw / 1280);
      drawImage(ctx, iw, ih, fx);
      const ext: Extrinsics = { tx: TRUE_EXT.tx + Number(q.dx), ty: TRUE_EXT.ty + Number(q.dy), tz: TRUE_EXT.tz + Number(q.dz), roll: TRUE_EXT.roll + Number(q.droll), pitch: TRUE_EXT.pitch + Number(q.dpitch), yaw: TRUE_EXT.yaw + Number(q.dyaw) };
      const T = extMatrix(ext).invert();
      const v = new THREE.Vector3();
      let inView = 0;
      const size = Number(q.pointSize);
      for (const pt of pts) {
        v.copy(pt.p).applyMatrix4(T);
        const pr = project(v, fx, iw, ih); if (!pr) continue;
        inView++;
        const dcol = q.colorBy === "height" ? heat((pt.p.y + 1.6) / 4.5) : heat(1 - Math.min(1, pr.d / 20));
        ctx.fillStyle = dcol; ctx.globalAlpha = 0.9;
        ctx.fillRect(pr.u - size / 2, pr.v - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.line; ctx.strokeRect(0.5, 0.5, iw - 1, ih - 1);
      ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`CAM_FRONT · ${Math.round(iw)}×${Math.round(ih)} · fx=${fx.toFixed(0)}`, 8, 16);
      ctx.restore();
      const err = Math.hypot(Number(q.dx), Number(q.dy), Number(q.dz));
      const rot = Math.hypot(Number(q.droll), Number(q.dpitch), Number(q.dyaw));
      if ((frames++ & 7) === 0) onTelemetry({ "Points in view": inView, "Translation error (m)": err, "Rotation error (°)": rot, "Pixel shift @12 m (px)": (fx * err) / 12 + (fx * Math.tan(THREE.MathUtils.degToRad(rot))), "True yaw (°)": TRUE_EXT.yaw, "True pitch (°)": TRUE_EXT.pitch });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
