"use client";
import { useEffect, useRef } from "react";
import { TripsLayer } from "@deck.gl/geo-layers";
import { PathLayer } from "@deck.gl/layers";
import { createMap, deckOverlay } from "../../kit/map";
import { trips } from "../../kit/geodata";
import type { EngineProps } from "../../types";

// deck.gl TripsLayer: 40 synthetic vehicle trajectories with timestamps, animated with a trailing length; the classic fleet-replay look.
export default function DeckTrips({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const data = trips(); const map = createMap(el, { zoom: 12.5, pitch: 55 });
    const mk = (time: number) => new TripsLayer({ id: "trips", data, getPath: (d: { path: number[][] }) => d.path.map((q) => [q[0], q[1]] as [number, number]), getTimestamps: (d: { path: number[][] }) => d.path.map((q) => q[2]), getColor: (d: { id: number }) => (d.id % 3 === 0 ? [94, 231, 255] : d.id % 3 === 1 ? [255, 180, 84] : [124, 243, 160]), opacity: 0.9, widthMinPixels: Number(p.current.width), fadeTrail: true, trailLength: Number(p.current.trail), currentTime: time });
    const base = new PathLayer({ id: "paths", data, getPath: (d: { path: number[][] }) => d.path.map((q) => [q[0], q[1]] as [number, number]), getColor: [94, 231, 255, 40], widthMinPixels: 1 });
    const overlay = deckOverlay(map, [base, mk(0)]);
    let t = 0, raf = 0, last = performance.now(), frames = 0;
    const loop = (now: number) => { const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t = (t + dt * Number(p.current.speed)) % 260; overlay.setProps({ layers: [base, mk(t)] }); if ((frames++ & 15) === 0) onTelemetry({ "Sim time (s)": t, Trips: data.length, "Trail length (s)": Number(p.current.trail), Speed: `${Number(p.current.speed)}×` }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); overlay.finalize(); map.remove(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
