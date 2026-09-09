import { mulberry32 } from "./rng";

// Synthetic fleet drive log: N vehicles × signals at 10 Hz, with injected ground-truth events.
export type Event = { t: number; vehicle: number; kind: "hard_brake" | "disengagement" | "sensor_dropout" | "cut_in" | "swerve"; lat: number; lon: number; severity: number; cause: "perception" | "planning" | "localization" | "control" | "other"; version: "v2.3" | "v2.4" };
export type Drive = { vehicle: number; t: number[]; speed: number[]; brake: number[]; steer: number[]; lidarHz: number[]; auto: number[]; lat: number[]; lon: number[]; events: Event[] };

const CAUSES: Event["cause"][] = ["perception", "planning", "localization", "control", "other"];
export function makeFleet(vehicles = 6, seconds = 600, seed = 5): Drive[] {
  const rng = mulberry32(seed);
  const drives: Drive[] = [];
  for (let v = 0; v < vehicles; v++) {
    const d: Drive = { vehicle: v + 1, t: [], speed: [], brake: [], steer: [], lidarHz: [], auto: [], lat: [], lon: [], events: [] };
    let speed = 10, lat = 37.76 + rng() * 0.05, lon = -122.44 + rng() * 0.06, hdg = rng() * Math.PI * 2, auto = 1;
    const version: Event["version"] = v % 2 ? "v2.4" : "v2.3";
    const planned: { t: number; kind: Event["kind"] }[] = [];
    for (let i = 0; i < 6 + rng() * 6; i++) planned.push({ t: 20 + rng() * (seconds - 40), kind: (["hard_brake", "disengagement", "sensor_dropout", "cut_in", "swerve"] as const)[Math.floor(rng() * 5)] });
    planned.sort((a, b) => a.t - b.t);
    let active: { t: number; kind: Event["kind"] } | null = null;
    for (let i = 0; i <= seconds * 10; i++) {
      const t = i / 10;
      const ev = planned.find((e) => Math.abs(e.t - t) < 0.05);
      if (ev) { active = ev; const sev = ev.kind === "disengagement" ? 3 : ev.kind === "hard_brake" ? 2 : 1; d.events.push({ t, vehicle: v + 1, kind: ev.kind, lat, lon, severity: Math.min(3, sev + (rng() < 0.3 ? 1 : 0)), cause: CAUSES[Math.floor(rng() * (ev.kind === "disengagement" ? 4 : 5))], version }); }
      let brake = rng() < 0.05 ? 0.15 : 0, steer = Math.sin(t * 0.3) * 0.02 + (rng() - 0.5) * 0.01, hz = 10 + (rng() - 0.5) * 0.4, target = 9 + Math.sin(t * 0.05) * 4;
      if (active) {
        const dtE = t - active.t;
        if (dtE > 4) active = null;
        else if (active.kind === "hard_brake") { brake = 0.7 + rng() * 0.2; target = 0; }
        else if (active.kind === "disengagement") { if (dtE < 0.3) auto = 0; brake = 0.4; target = 2; if (dtE > 3) auto = 1; }
        else if (active.kind === "sensor_dropout") hz = dtE < 1.5 ? 0 : 10;
        else if (active.kind === "cut_in") { brake = dtE < 1 ? 0.5 : 0.1; target = 5; }
        else if (active.kind === "swerve") steer = Math.sin(dtE * 4) * 0.12;
      }
      speed += (target - speed) * 0.05 - brake * 0.6;
      speed = Math.max(0, speed);
      hdg += steer * speed * 0.1; lat += (Math.cos(hdg) * speed * 0.1) / 111000; lon += (Math.sin(hdg) * speed * 0.1) / 88000;
      d.t.push(t); d.speed.push(speed); d.brake.push(brake); d.steer.push(steer); d.lidarHz.push(hz); d.auto.push(auto); d.lat.push(lat); d.lon.push(lon);
    }
    drives.push(d);
  }
  return drives;
}

export type Rule = { kind: Event["kind"]; test: (d: Drive, i: number) => boolean; cooldown: number };
export function rules(params: { brake: number; accel: number; dropHz: number; steerRate: number }): Rule[] {
  return [
    { kind: "hard_brake", cooldown: 4, test: (d, i) => d.brake[i] > params.brake || (i > 5 && (d.speed[i - 5] - d.speed[i]) / 0.5 > params.accel) },
    { kind: "disengagement", cooldown: 4, test: (d, i) => i > 0 && d.auto[i - 1] === 1 && d.auto[i] === 0 },
    { kind: "sensor_dropout", cooldown: 4, test: (d, i) => d.lidarHz[i] < params.dropHz },
    { kind: "swerve", cooldown: 4, test: (d, i) => i > 3 && Math.abs(d.steer[i] - d.steer[i - 3]) > params.steerRate },
  ];
}
export function mine(drives: Drive[], rs: Rule[]) {
  const hits: { t: number; vehicle: number; kind: Event["kind"]; lat: number; lon: number }[] = [];
  for (const d of drives) for (const r of rs) { let last = -1e9; for (let i = 0; i < d.t.length; i++) { if (d.t[i] - last < r.cooldown) continue; if (r.test(d, i)) { hits.push({ t: d.t[i], vehicle: d.vehicle, kind: r.kind, lat: d.lat[i], lon: d.lon[i] }); last = d.t[i]; } } }
  return hits.sort((a, b) => a.t - b.t);
}
export function score(hits: ReturnType<typeof mine>, drives: Drive[]) {
  const gt = drives.flatMap((d) => d.events).filter((e) => e.kind !== "cut_in");
  let tp = 0; const used = new Set<number>();
  for (const h of hits) { const j = gt.findIndex((g, k) => !used.has(k) && g.vehicle === h.vehicle && g.kind === h.kind && Math.abs(g.t - h.t) < 3); if (j >= 0) { used.add(j); tp++; } }
  return { tp, fp: hits.length - tp, fn: gt.length - tp, precision: hits.length ? tp / hits.length : 0, recall: gt.length ? tp / gt.length : 0 };
}
let cache: Drive[] | null = null;
export const fleet = () => (cache ??= makeFleet());
