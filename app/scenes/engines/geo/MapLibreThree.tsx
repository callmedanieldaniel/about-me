"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import * as THREE from "three";
import { createMap } from "../../kit/map";
import type { EngineProps } from "../../types";

// MapLibre custom layer rendering a Three.js scene (animated vehicles + a rotating beacon) in map coordinates — the bridge every "3D on a map" product uses.
export default function MapLibreThree({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLDivElement>(null);
  const p = useRef(params); p.current = params; const play = useRef(playing); play.current = playing;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const origin: [number, number] = [-122.42, 37.77];
    const map = createMap(el, { center: origin, zoom: 15.5, pitch: 60, bearing: -20 });
    const merc = maplibregl.MercatorCoordinate.fromLngLat(origin, 0); const scale = merc.meterInMercatorCoordinateUnits();
    const scene = new THREE.Scene(); const camera = new THREE.Camera(); let renderer: THREE.WebGLRenderer | null = null;
    scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a1020, 1.2)); const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(1, 2, 1); scene.add(key);
    const cars: THREE.Mesh[] = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.6, 2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x5ee7ff : 0xffb454 })); scene.add(m); cars.push(m); }
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0, 12, 60, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0x7cf3a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); beacon.position.y = 30; scene.add(beacon);
    const ring = new THREE.Mesh(new THREE.RingGeometry(20, 24, 48), new THREE.MeshBasicMaterial({ color: 0x5ee7ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })); ring.rotation.x = -Math.PI / 2; scene.add(ring);
    let t = 0, last = performance.now(), frames = 0;
    const layer: maplibregl.CustomLayerInterface = {
      id: "three", type: "custom", renderingMode: "3d",
      onAdd: (_m, gl) => { renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true }); renderer.autoClear = false; },
      render: (_gl, args) => {
        const now = performance.now(); const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; if (play.current) t += dt;
        const r = Number(p.current.radius); cars.forEach((c, i) => { const a = t * Number(p.current.speed) * 0.1 + (i / cars.length) * Math.PI * 2; c.position.set(Math.cos(a) * r, 0.8, Math.sin(a) * r); c.rotation.y = -a; }); beacon.rotation.y = t; ring.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
        // model matrix: map mercator → meters at origin, z-up → three y-up
        const m = new THREE.Matrix4().fromArray((args as { defaultProjectionData: { mainMatrix: number[] } }).defaultProjectionData?.mainMatrix ?? (args as unknown as number[]));
        const l = new THREE.Matrix4().makeTranslation(merc.x, merc.y, merc.z).scale(new THREE.Vector3(scale, -scale, scale)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        camera.projectionMatrix = m.multiply(l); renderer!.resetState(); renderer!.render(scene, camera); map.triggerRepaint();
        if ((frames++ & 15) === 0) onTelemetry({ Vehicles: cars.length, "Orbit radius (m)": r, "t (s)": t, Layer: "custom · renderingMode 3d" });
      },
    };
    map.on("load", () => map.addLayer(layer));
    return () => { map.remove(); };
  }, [resetKey, onTelemetry]);
  return <div ref={host} className="engine-host map-host" />;
}
