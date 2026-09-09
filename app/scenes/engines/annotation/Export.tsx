"use client";
import { useEffect, useMemo, useRef } from "react";
import { makeObjects } from "../../kit/pointcloud";
import type { EngineProps } from "../../types";

// Export preview: the same labels serialized as KITTI (txt), nuScenes-style sample_annotation JSON, and a flat CSV; download any of them.
export default function Export({ params, command, onTelemetry }: EngineProps) {
  const labels = useMemo(() => makeObjects(61, 8), []);
  const lastCmd = useRef(0);
  const fmt = String(params.format);
  const text = useMemo(() => {
    if (fmt === "kitti") return labels.map((o) => { const cls = o.cls === "car" ? "Car" : o.cls === "pedestrian" ? "Pedestrian" : "Cyclist"; return [cls, "0.00", "0", (-Math.atan2(o.z, o.x)).toFixed(2), "0 0 0 0", o.h.toFixed(2), o.w.toFixed(2), o.l.toFixed(2), (-o.z).toFixed(2), (o.h).toFixed(2), o.x.toFixed(2), (-o.yaw).toFixed(2)].join(" "); }).join("\n");
    if (fmt === "csv") return "id,class,x,y,z,l,w,h,yaw\n" + labels.map((o) => [o.id, o.cls, o.x.toFixed(3), o.z.toFixed(3), 0, o.l.toFixed(2), o.w.toFixed(2), o.h.toFixed(2), o.yaw.toFixed(3)].join(",")).join("\n");
    const q = (yaw: number) => [Math.cos(yaw / 2).toFixed(4), 0, 0, Math.sin(yaw / 2).toFixed(4)];
    return JSON.stringify(labels.map((o) => ({ token: `ann_${o.id.toString(16).padStart(8, "0")}`, sample_token: "sample_0001", instance_token: `inst_${o.id}`, category_name: o.cls === "car" ? "vehicle.car" : o.cls === "pedestrian" ? "human.pedestrian.adult" : "vehicle.bicycle", translation: [Number(o.x.toFixed(3)), Number((-o.z).toFixed(3)), Number((o.h / 2).toFixed(3))], size: [Number(o.w.toFixed(2)), Number(o.l.toFixed(2)), Number(o.h.toFixed(2))], rotation: q(o.yaw).map(Number), num_lidar_pts: 120, visibility_token: "4", attribute_tokens: [o.static ? "vehicle.parked" : "vehicle.moving"] })), null, 2);
  }, [fmt, labels]);
  useEffect(() => { onTelemetry({ Format: fmt, Labels: labels.length, "Bytes": new Blob([text]).size, Lines: text.split("\n").length }); }, [fmt, labels, text, onTelemetry]);
  useEffect(() => { if (!command || command.seq === lastCmd.current) return; lastCmd.current = command.seq; if (command.name === "download") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = fmt === "kitti" ? "000001.txt" : fmt === "csv" ? "labels.csv" : "sample_annotation.json"; a.click(); } }, [command, text, fmt]);
  return (
    <div className="engine-host qa-host">
      <div className="qa-summary"><div><b>{fmt === "kitti" ? "KITTI label file" : fmt === "csv" ? "Flat CSV" : "nuScenes sample_annotation"}</b><span>{fmt === "kitti" ? "type truncated occluded alpha bbox(4) h w l x y z rotation_y — camera frame, one line per object" : fmt === "csv" ? "one row per box, ego frame, radians" : "translation / size(w,l,h) / rotation quaternion, tokens link to sample & instance"}</span></div></div>
      <pre className="export-pre">{text}</pre>
    </div>
  );
}
