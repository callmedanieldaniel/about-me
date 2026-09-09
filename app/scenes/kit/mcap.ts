import { McapWriter, McapIndexedReader, TempBuffer } from "@mcap/core";
import { mulberry32 } from "./rng";

export type LogTopic = { topic: string; schema: string; times: number[]; msgs: Record<string, unknown>[] };
export type Log = { duration: number; topics: Map<string, LogTopic>; bytes: number; messages: number; source: string };

const STATES = ["LANE_FOLLOW", "LANE_FOLLOW", "PREPARE_LANE_CHANGE", "LANE_CHANGE", "LANE_FOLLOW", "YIELD", "STOP", "LANE_FOLLOW"];

// Writes a synthetic 30 s drive log as a real MCAP file (json encoding, jsonschema schemas) using @mcap/core.
export async function generateLog(seconds = 30, seed = 1): Promise<Uint8Array> {
  const buf = new TempBuffer();
  const w = new McapWriter({ writable: buf, useChunks: true, useStatistics: true, useChunkIndex: true, useMessageIndex: true });
  await w.start({ library: "xvis", profile: "" });
  const sch = async (name: string, props: Record<string, unknown>) => w.registerSchema({ name, encoding: "jsonschema", data: new TextEncoder().encode(JSON.stringify({ type: "object", properties: props })) });
  const ch = async (topic: string, schemaId: number) => w.registerChannel({ topic, messageEncoding: "json", schemaId, metadata: new Map() });
  const sPose = await sch("xvis.Pose", { x: { type: "number" }, y: { type: "number" }, yaw: { type: "number" } });
  const sScalar = await sch("xvis.Scalar", { value: { type: "number" } });
  const sState = await sch("xvis.State", { state: { type: "string" } });
  const sCloud = await sch("xvis.PointCloud", { points: { type: "array" } });
  const sImu = await sch("xvis.Imu", { ax: { type: "number" }, ay: { type: "number" }, gz: { type: "number" } });
  const cPose = await ch("/tf/ego", sPose), cSpeed = await ch("/vehicle/speed", sScalar), cSteer = await ch("/vehicle/steer", sScalar), cState = await ch("/planner/state", sState), cCloud = await ch("/lidar/points", sCloud), cImu = await ch("/imu", sImu), cBrake = await ch("/vehicle/brake", sScalar);
  const rng = mulberry32(seed);
  const enc = new TextEncoder();
  let seq = 0;
  const add = async (channelId: number, t: number, obj: unknown) => { const ns = BigInt(Math.round(t * 1e9)); await w.addMessage({ channelId, sequence: seq++, logTime: ns, publishTime: ns, data: enc.encode(JSON.stringify(obj)) }); };
  let x = 0, y = 0, yaw = 0, speed = 8;
  const obstacles = Array.from({ length: 40 }, () => ({ x: rng() * 400, y: (rng() - 0.5) * 30, r: 1 + rng() * 2, h: 1 + rng() * 6 }));
  for (let i = 0; i <= seconds * 50; i++) {
    const t = i / 50;
    const phase = Math.floor((t / seconds) * STATES.length);
    const state = STATES[Math.min(STATES.length - 1, phase)];
    const target = state === "STOP" ? 0 : state === "YIELD" ? 3 : state === "LANE_CHANGE" ? 9 : 12;
    speed += (target - speed) * 0.04 + (rng() - 0.5) * 0.05;
    const steer = state === "LANE_CHANGE" ? Math.sin(((t % (seconds / STATES.length)) / (seconds / STATES.length)) * Math.PI * 2) * 0.08 : Math.sin(t * 0.7) * 0.01 + (rng() - 0.5) * 0.004;
    yaw += steer * speed * 0.02; x += Math.cos(yaw) * speed * 0.02; y += Math.sin(yaw) * speed * 0.02;
    const brake = state === "STOP" || state === "YIELD" ? 0.4 + 0.3 * rng() : rng() < 0.02 ? 0.2 : 0;
    await add(cPose, t, { x, y, yaw });
    await add(cSpeed, t, { value: speed });
    await add(cSteer, t, { value: steer });
    await add(cBrake, t, { value: brake });
    await add(cImu, t, { ax: (target - speed) * 0.5 + (rng() - 0.5) * 0.3, ay: steer * speed * speed * 0.1 + (rng() - 0.5) * 0.2, gz: steer * speed * 0.2 });
    if (i % 25 === 0) await add(cState, t, { state });
    if (i % 5 === 0) {
      // 10 Hz point cloud in ego frame: ground ring + obstacle returns
      const pts: number[] = [];
      for (let b = 0; b < 240; b++) { const a = (b / 240) * Math.PI * 2, r = 4 + (b % 7) * 2.2; pts.push(Math.cos(a) * r, Math.sin(a) * r, -1.6 + rng() * 0.05); }
      for (const o of obstacles) { const dx = o.x - x, dy = o.y - y; const lx = Math.cos(-yaw) * dx - Math.sin(-yaw) * dy, ly = Math.sin(-yaw) * dx + Math.cos(-yaw) * dy; if (Math.hypot(lx, ly) < 45) for (let k = 0; k < 14; k++) { const a = rng() * Math.PI * 2; pts.push(lx + Math.cos(a) * o.r, ly + Math.sin(a) * o.r, -1.6 + rng() * o.h); } }
      await add(cCloud, t, { points: pts.map((v) => Math.round(v * 100) / 100) });
    }
  }
  await w.end();
  return buf.get();
}

export async function parseLog(bytes: Uint8Array, source = "synthetic"): Promise<Log> {
  const readable = new TempBuffer(bytes);
  const reader = await McapIndexedReader.Initialize({ readable });
  const topics = new Map<string, LogTopic>();
  let t0 = Infinity, t1 = 0, n = 0;
  const dec = new TextDecoder();
  for await (const m of reader.readMessages()) {
    const chn = reader.channelsById.get(m.channelId)!;
    if (chn.messageEncoding !== "json") continue;
    const schema = chn.schemaId ? reader.schemasById.get(chn.schemaId)?.name ?? "" : "";
    let tp = topics.get(chn.topic);
    if (!tp) { tp = { topic: chn.topic, schema, times: [], msgs: [] }; topics.set(chn.topic, tp); }
    const t = Number(m.logTime) / 1e9;
    t0 = Math.min(t0, t); t1 = Math.max(t1, t);
    let obj: Record<string, unknown> = {};
    try { obj = JSON.parse(dec.decode(m.data)); } catch { /* skip */ }
    tp.times.push(t); tp.msgs.push(obj); n++;
  }
  if (!Number.isFinite(t0)) t0 = 0;
  for (const tp of topics.values()) for (let i = 0; i < tp.times.length; i++) tp.times[i] -= t0;
  return { duration: Math.max(0.001, t1 - t0), topics, bytes: bytes.byteLength, messages: n, source };
}

export function at(tp: LogTopic | undefined, t: number): Record<string, unknown> | undefined {
  if (!tp || tp.times.length === 0) return undefined;
  let lo = 0, hi = tp.times.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tp.times[mid] <= t) lo = mid; else hi = mid - 1; }
  return tp.msgs[lo];
}

export function series(tp: LogTopic | undefined, key: string): number[] {
  if (!tp) return [];
  return tp.msgs.map((m) => Number(m[key]));
}

let cached: Promise<Log> | null = null;
export function defaultLog() {
  if (!cached) cached = generateLog(30).then((b) => parseLog(b, "synthetic drive (30 s, written with @mcap/core)"));
  return cached;
}
