"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LabId } from "./catalog";
import {
  brakeFrame,
  collisionSpeed,
  forwardKinematics,
  inverseKinematics,
  isSupportedGlb,
  stoppingDistance,
} from "./math";
import type { LabAsset, LabConfig, LabReport } from "./LabEngine";
const Engine = dynamic(() => import("./LabEngine"), {
  ssr: false,
  loading: () => (
    <div className="engine-loading" role="status">
      正在加载 3D 引擎…
    </div>
  ),
});
const defaults: LabConfig = {
  speed: 60,
  distance: 40,
  delay: 0.5,
  friction: 0.7,
  shoulder: 35,
  elbow: 70,
  targetX: 2.4,
  targetY: 2.2,
  gravity: 9.81,
  restitution: 0.65,
  height: 4,
  wireframe: false,
};
export default function LabWorkbench({ kind }: { kind: LabId }) {
  const [config, setConfig] = useState<LabConfig>(defaults),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [reset, setReset] = useState(0);
  const [asset, setAsset] = useState<LabAsset | null>(null),
    [error, setError] = useState(""),
    [report, setReport] = useState<LabReport>({}),
    [fileName, setFileName] = useState("");
  const fileRequest = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0,
      last = performance.now(),
      previous = last;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) {
        last = now;
        previous = now;
        return;
      }
      if (now - previous < 30) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      previous = now;
      setTime((t) => Math.min(t + dt, kind === "model" ? 120 : 12));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, kind]);
  useEffect(() => {
    if (time >= (kind === "model" ? 120 : 12)) setPlaying(false);
  }, [time, kind]);
  const update = (key: keyof LabConfig, value: number | boolean) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setTime(0);
    setReset((n) => n + 1);
    setPlaying(false);
  };
  const reference = useMemo(
    () => ({ ...config, delay: config.delay + 0.8 }),
    [config],
  );
  const current = brakeFrame(config, time),
    baseline = brakeFrame(reference, time);
  const arm = forwardKinematics(config.shoulder, config.elbow),
    solution = inverseKinematics(config.targetX, config.targetY);
  const reachError = Math.hypot(
    arm.tip.x - config.targetX,
    arm.tip.y - config.targetY,
  );
  const slider = (
    label: string,
    key: keyof LabConfig,
    min: number,
    max: number,
    step: number,
    unit: string,
  ) => (
    <label className="lab-control">
      <span>
        {label}
        <output>
          {Number(config[key]).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}{" "}
          {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(config[key])}
        onChange={(e) => update(key, Number(e.target.value))}
      />
    </label>
  );
  const restart = () => {
    setPlaying(false);
    setTime(0);
    setReset((n) => n + 1);
  };
  async function openFile(file: File | undefined) {
    if (!file) return;
    const request = ++fileRequest.current;
    setError("");
    if (
      !file.name.toLowerCase().endsWith(".glb") ||
      file.size > 30 * 1024 * 1024
    ) {
      setError("请选择不超过 30 MB 的自包含 .glb 文件。");
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      if (request !== fileRequest.current) return;
      if (!isSupportedGlb(buffer))
        throw new Error("文件不是有效的 glTF 2.0 GLB。");
      setAsset({ buffer, id: request });
      setFileName(file.name);
      setReport({});
      restart();
    } catch (e) {
      if (request === fileRequest.current)
        setError(e instanceof Error ? e.message : "无法读取文件。");
    }
  }
  function download() {
    const data = {
      schema: "fieldwork.experiment/v1",
      kind,
      dataKind: kind === "model" && asset ? "user-local-asset" : "synthetic",
      config,
      time,
      assumptions:
        kind === "braking"
          ? "1D level road, constant deceleration mu*g, no sensing or control model"
          : kind === "robot"
            ? "Planar 2-link kinematics, no collisions or dynamics"
            : kind === "physics"
              ? "Rapier rigid-body solver, fixed 1/60 s timestep"
              : "GLB authored units interpreted as meters; display normalized",
      result:
        kind === "braking"
          ? {
              stoppingDistance: stoppingDistance(config),
              baselineStoppingDistance: stoppingDistance(reference),
              baselineConfig: reference,
              impactSpeedKph: collisionSpeed(config),
              current,
              baseline,
            }
          : kind === "robot"
            ? { ...arm, reachable: Boolean(solution), targetError: reachError }
            : report,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `fieldwork-${kind}-experiment.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="lab-workspace">
      <aside className="lab-controls">
        <h2>实验参数</h2>
        {kind === "braking" && (
          <>
            {slider("初始车速", "speed", 10, 120, 1, "km/h")}
            {slider("障碍物距离", "distance", 10, 120, 1, "m")}
            {slider("制动延迟", "delay", 0, 2, 0.05, "s")}
            {slider("附着系数 μ", "friction", 0.2, 1, 0.05, "")}
            <p className="lab-help">
              绿色：当前方案。橙色：其他条件相同，晚 0.8
              秒制动。两辆车分别位于平行试验车道。
            </p>
          </>
        )}
        {kind === "robot" && (
          <>
            {slider("肩关节", "shoulder", -180, 180, 0.1, "°")}
            {slider("肘关节", "elbow", 0, 180, 0.1, "°")}
            {slider("目标 X", "targetX", -4.5, 4.5, 0.1, "m")}
            {slider("目标 Y", "targetY", -4.5, 4.5, 0.1, "m")}
            <button
              className="lab-button primary"
              type="button"
              disabled={!solution}
              onClick={() => {
                if (solution) {
                  setConfig((c) => ({ ...c, ...solution }));
                  setReset((n) => n + 1);
                }
              }}
            >
              求解目标关节角
            </button>
            <p className="lab-help">
              连杆长度为 2.4 m 与 1.8 m。显示一个肘部解分支；可达区域为半径
              0.6–4.2 m 的圆环。无动力学、无环境碰撞。
            </p>
          </>
        )}
        {kind === "physics" && (
          <>
            {slider("重力", "gravity", 1, 20, 0.1, "m/s²")}
            {slider("恢复系数", "restitution", 0, 1, 0.05, "")}
            {slider("初始球心高度", "height", 1, 7, 0.1, "m")}
            <p className="lab-help">
              真实 Rapier WASM 刚体求解。固定步长 1/60 秒；地面顶部为 0
              m，球半径 0.35 m。改变参数会重置实验。
            </p>
          </>
        )}
        {kind === "model" && (
          <>
            <label className="file-picker">
              <span>选择本地 GLB</span>
              <input
                type="file"
                accept=".glb"
                onChange={(e) => {
                  void openFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="lab-help">
              自包含 glTF 2.0，最大 30
              MB；不上传文件。外部纹理/缓冲区和需要独立解码器的压缩模型不支持。
            </p>
            <label className="check-control">
              <input
                type="checkbox"
                checked={config.wireframe}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, wireframe: e.target.checked }))
                }
              />{" "}
              显示网格线
            </label>
            <button
              className="lab-button"
              onClick={() => {
                ++fileRequest.current;
                setAsset(null);
                setFileName("");
                setError("");
                setReport({});
                restart();
              }}
            >
              恢复内置几何
            </button>
            <p className="lab-help">
              {fileName || "当前为内置几何，不是真实汽车或机器人资产。"}
            </p>
          </>
        )}
        <button className="lab-button" onClick={download}>
          导出实验 JSON
        </button>
        {error && (
          <p className="lab-error" role="alert">
            {error}
          </p>
        )}
      </aside>
      <section className="lab-main" aria-label="3D 实验视图">
        <div className="lab-stage">
          <Engine
            kind={kind}
            config={config}
            time={time}
            reset={reset}
            asset={asset}
            onReport={setReport}
          />
          <span className="lab-stage-badge">
            {kind === "model"
              ? asset
                ? "本地 GLB"
                : "内置几何"
              : kind === "physics"
                ? "RAPIER · PHYSICS"
                : "SYNTHETIC · COMPUTED"}
          </span>
        </div>
        <div className="lab-transport">
          {kind !== "robot" && (
            <button
              className="lab-button"
              onClick={() => {
                if (time >= (kind === "model" ? 120 : 12)) setTime(0);
                setPlaying((p) => !p);
              }}
              aria-pressed={playing}
            >
              {playing ? "暂停" : "播放"}
            </button>
          )}
          <button className="lab-button" onClick={restart}>
            重置实验与视角
          </button>
          <span>
            {kind === "robot" ? "拖动旋转 · 滚轮缩放" : `${time.toFixed(2)} s`}
          </span>
          {kind === "braking" && (
            <label className="lab-timeline">
              <span className="sr-only">回放时间</span>
              <input
                type="range"
                min={0}
                max={12}
                step={0.02}
                value={time}
                onChange={(e) => {
                  setPlaying(false);
                  setTime(Number(e.target.value));
                }}
              />
            </label>
          )}
        </div>
        <div className="lab-readouts" aria-live="polite">
          {kind === "braking" ? (
            <>
              <Metric
                label="当前理论停止距离"
                value={`${stoppingDistance(config).toFixed(2)} m`}
              />
              <Metric
                label="延迟方案停止距离"
                value={`${stoppingDistance(reference).toFixed(2)} m`}
              />
              <Metric
                label="当前碰撞速度"
                value={`${collisionSpeed(config).toFixed(1)} km/h`}
              />
              <Metric
                label="回放状态"
                value={
                  current.collision
                    ? "当前方案碰撞"
                    : current.stopped
                      ? "当前方案停止"
                      : "回放中"
                }
              />
            </>
          ) : kind === "robot" ? (
            <>
              <Metric
                label="末端 X / Y"
                value={`${arm.tip.x.toFixed(2)} / ${arm.tip.y.toFixed(2)} m`}
              />
              <Metric label="目标误差" value={`${reachError.toFixed(4)} m`} />
              <Metric
                label="目标可达性"
                value={solution ? "可达" : "超出可达区域"}
              />
            </>
          ) : kind === "physics" ? (
            <>
              <Metric
                label="球心高度"
                value={`${(report.height ?? config.height).toFixed(3)} m`}
              />
              <Metric
                label="垂直速度"
                value={`${(report.velocity ?? 0).toFixed(3)} m/s`}
              />
              <Metric
                label="实际求解时间"
                value={`${(report.simTime ?? 0).toFixed(2)} s`}
              />
            </>
          ) : (
            <>
              <Metric label="网格数量" value={String(report.meshes ?? 0)} />
              <Metric label="动画片段" value={String(report.animations ?? 0)} />
              <Metric label="资产包围盒 (m)" value={report.dimensions ?? "—"} />
            </>
          )}
        </div>
        {kind === "model" && report.names && (
          <details className="model-tree">
            <summary>模型节点（最多展示 80 项）</summary>
            <ul>
              {report.names.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </details>
        )}
        <p className="lab-assumption">
          {kind === "braking"
            ? "解析模型：停止距离 = v × 延迟 + v² / (2μg)。不模拟坡度、轮胎温度、传感器误差或完整 AEB 决策，不用于真实行车判断。"
            : kind === "robot"
              ? "绿色为计算得到的连杆位置，橙色为目标位置；这是运动学工作台，不控制任何真实机器人。"
              : kind === "physics"
                ? "碰撞与反弹由刚体引擎计算；结果是给定简化场景的模拟，不等于真实材料的校准数据。"
                : "GLB 原始尺寸按米解释，画面仅做显示归一化；播放使用第一个动画片段，无动画时旋转查看。"}
        </p>
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
