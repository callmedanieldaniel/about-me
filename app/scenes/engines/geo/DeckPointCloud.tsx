"use client";
import { useEffect, useRef } from "react";
import { Deck, OrbitView, COORDINATE_SYSTEM } from "@deck.gl/core";
import { PointCloudLayer } from "@deck.gl/layers";
import { pointCloud } from "../../kit/geodata";
import type { EngineProps } from "../../types";

// deck.gl PointCloudLayer in an OrbitView (no basemap): 60k synthetic LiDAR-like points with binary attributes — the GPU path used by large-cloud viewers.
export default function DeckPointCloud({ params, resetKey, onTelemetry }: EngineProps) {
  const host = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = host.current; if (!cv) return;
    const { pos, col, n } = pointCloud(Number(params.count));
    const deck = new Deck({ canvas: cv, views: new OrbitView({ orbitAxis: "Z", fovy: 45 }), initialViewState: { target: [0, 0, 5], rotationX: 40, rotationOrbit: -30, zoom: 2.5 }, controller: true, parameters: { clearColor: [0, 0, 0, 0] } as never, layers: [new PointCloudLayer<{ length: number }>({ id: "pc", data: { length: n, attributes: { getPosition: { value: pos, size: 3 }, getColor: { value: col, size: 3 } } } as never, pointSize: Number(params.size), coordinateSystem: COORDINATE_SYSTEM.CARTESIAN })] });
    onTelemetry({ Points: n, "Point size (px)": Number(params.size), View: "OrbitView", Attributes: "binary Float32/Uint8" });
    return () => deck.finalize();
  }, [params.count, params.size, resetKey, onTelemetry]);
  return <canvas ref={host} className="engine-host" />;
}
