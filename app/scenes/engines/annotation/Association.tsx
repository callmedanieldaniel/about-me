"use client";
import { useEffect, useRef } from "react";
import { makeObjects, objectsAt } from "../../kit/pointcloud";
import { colors, fitCanvas } from "../../kit/plot";
import { mulberry32 } from "../../kit/rng";
import type { EngineProps } from "../../types";

// ID association across frames (BEV): per-frame detections are matched to tracks by nearest predicted position (Hungarian-lite greedy) with a gating radius; ID switches are counted against GT.
export default function Association({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const cv = useRef<HTMLCanvasElement>(null);
  const p = useRef(params); p.current = params;
  const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const rng = mulberry32(21);
    const base = makeObjects(15, 10).map((o) => ({ ...o, static: false, vx: o.vx || (rng() - 0.5) * 6, vz: o.vz || (rng() - 0.5) * 4 }));
    type Track = { id: number; x: number; z: number; vx: number; vz: number; age: number; gtId: number; missed: number };
    let tracks: Track[] = []; let nextId = 1, t = 0, last = performance.now(), raf = 0, frames = 0, switches = 0, fragments = 0;
    const trails = new Map<number, [number, number][]>();
    const draw = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const q = p.current; const gate = Number(q.gate), noise = Number(q.noise), drop = Number(q.drop);
      if (play.current) t += dt;
      const gt = objectsAt(base, t % 12);
      // detections with noise and dropouts
      const dets = gt.filter(() => rng() > drop).map((o) => ({ x: o.x + (rng() - 0.5) * noise, z: o.z + (rng() - 0.5) * noise, gtId: o.id }));
      if (play.current) {
        // predict
        for (const tr of tracks) { tr.x += tr.vx * dt; tr.z += tr.vz * dt; tr.age += dt; }
        // greedy matching by distance
        const pairs: [number, number, number][] = [];
        tracks.forEach((tr, i) => dets.forEach((d, j) => { const dist = Math.hypot(tr.x - d.x, tr.z - d.z); if (dist < gate) pairs.push([dist, i, j]); }));
        pairs.sort((a, b) => a[0] - b[0]);
        const usedT = new Set<number>(), usedD = new Set<number>();
        for (const [, i, j] of pairs) { if (usedT.has(i) || usedD.has(j)) continue; usedT.add(i); usedD.add(j); const tr = tracks[i], d = dets[j]; const a = Number(q.alpha); tr.vx = tr.vx * (1 - a) + ((d.x - tr.x) / Math.max(dt, 0.016)) * a; tr.vz = tr.vz * (1 - a) + ((d.z - tr.z) / Math.max(dt, 0.016)) * a; tr.x = d.x; tr.z = d.z; tr.missed = 0; if (tr.gtId !== d.gtId) { switches++; tr.gtId = d.gtId; } }
        tracks.forEach((tr, i) => { if (!usedT.has(i)) tr.missed += dt; });
        dets.forEach((d, j) => { if (!usedD.has(j)) { tracks.push({ id: nextId++, x: d.x, z: d.z, vx: 0, vz: 0, age: 0, gtId: d.gtId, missed: 0 }); fragments++; } });
        tracks = tracks.filter((tr) => tr.missed < Number(q.maxMiss));
        for (const tr of tracks) { const tl = trails.get(tr.id) ?? []; tl.push([tr.x, tr.z]); if (tl.length > 80) tl.shift(); trails.set(tr.id, tl); }
      }
      const { ctx, w, h } = fitCanvas(c); ctx.clearRect(0, 0, w, h);
      const S = Math.min(w, h) / 70; const X = (x: number) => w / 2 + x * S, Y = (z: number) => h / 2 + z * S;
      ctx.strokeStyle = colors.line; for (let r = 10; r <= 30; r += 10) { ctx.beginPath(); ctx.arc(w / 2, h / 2, r * S, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = colors.ref; ctx.fillRect(w / 2 - 4, h / 2 - 8, 8, 16);
      for (const o of gt) { ctx.strokeStyle = "rgba(126,144,168,0.5)"; ctx.strokeRect(X(o.x) - (o.l * S) / 2, Y(o.z) - (o.w * S) / 2, o.l * S, o.w * S); }
      for (const d of dets) { ctx.fillStyle = colors.live; ctx.beginPath(); ctx.arc(X(d.x), Y(d.z), 3, 0, Math.PI * 2); ctx.fill(); }
      for (const tr of tracks) { const hue = (tr.id * 47) % 360; ctx.strokeStyle = `hsl(${hue} 80% 65%)`; const tl = trails.get(tr.id) ?? []; ctx.beginPath(); tl.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z)))); ctx.stroke(); ctx.beginPath(); ctx.arc(X(tr.x), Y(tr.z), gate * S, 0, Math.PI * 2); ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `hsl(${hue} 80% 65%)`; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`T${tr.id}→gt${tr.gtId}`, X(tr.x) + 6, Y(tr.z) - 6); ctx.beginPath(); ctx.moveTo(X(tr.x), Y(tr.z)); ctx.lineTo(X(tr.x + tr.vx), Y(tr.z + tr.vz)); ctx.stroke(); }
      if ((frames++ & 7) === 0) onTelemetry({ Tracks: tracks.length, "GT objects": gt.length, Detections: dets.length, "ID switches": switches, "Track fragments": fragments, "t (s)": t });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);
  return <canvas ref={cv} className="engine-host" />;
}
