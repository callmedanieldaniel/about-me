import { mulberry32 } from "./rng";
// Synthetic robot episodes (LeRobot-style): joint positions, gripper, actions, success flag, per-step reward, camera "frames" drawn procedurally.
export type Episode = { id: number; steps: number; q: number[][]; grip: number[]; reward: number[]; success: boolean; task: string; anomaly: number; language: string };
export function makeEpisodes(n = 24, seed = 9): Episode[] {
  const rng = mulberry32(seed); const tasks = ["pick cube", "stack blocks", "open drawer", "pour cup"];
  return Array.from({ length: n }, (_, i) => {
    const steps = 120 + Math.floor(rng() * 80); const success = rng() < 0.7; const jitter = rng() * 0.6; const task = tasks[i % tasks.length];
    const q: number[][] = [], grip: number[] = [], reward: number[] = [];
    for (let s = 0; s < steps; s++) { const f = s / steps; q.push([Math.sin(f * 3 + i) * 0.8 + (rng() - 0.5) * jitter * 0.3, 0.3 + Math.sin(f * 4) * 0.5 + (rng() - 0.5) * jitter * 0.2, 1.0 - f * 0.6 + Math.sin(f * 6) * 0.2 * jitter, Math.cos(f * 5) * 0.4, (f - 0.5) * 0.8, Math.sin(f * 2) * 0.3]); grip.push(f > 0.35 && f < 0.8 ? 1 : 0); reward.push(success ? f * f * 0.02 + (f > 0.8 ? 0.05 : 0) : Math.max(0, f * 0.01 - (f > 0.6 ? 0.02 : 0))); }
    return { id: i + 1, steps, q, grip, reward, success, task, anomaly: jitter + (success ? 0 : 0.5) + rng() * 0.2, language: `${task} · ${success ? "success" : "failure"}` };
  });
}
export function drawCam(ctx: CanvasRenderingContext2D, w: number, h: number, ep: Episode, step: number, view: "wrist" | "front") {
  const f = step / ep.steps; const qq = ep.q[Math.min(ep.steps - 1, step)];
  ctx.fillStyle = view === "front" ? "#0e1626" : "#111a2a"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1a2536"; ctx.fillRect(0, h * 0.6, w, h * 0.4);
  const cx = w * 0.5 + qq[0] * w * 0.25, cy = h * 0.55 - qq[2] * h * 0.25;
  if (view === "front") { ctx.strokeStyle = "#8fb3d9"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.62); ctx.lineTo(w * 0.3, h * 0.3 + qq[1] * 40); ctx.lineTo(cx, cy); ctx.stroke(); }
  const cube = view === "front" ? [w * 0.5 + (ep.grip[step] ? qq[0] * w * 0.25 : 0), ep.grip[step] ? cy + 12 : h * 0.62] : [w * 0.5, h * 0.55 + (ep.grip[step] ? 0 : (1 - f) * 40)];
  ctx.fillStyle = "#ffb454"; ctx.fillRect(cube[0] - 12, cube[1] - 12, 24, 24);
  ctx.strokeStyle = "#5ee7ff"; ctx.lineWidth = 3; const g = ep.grip[step] ? 8 : 22; const gx = view === "front" ? cx : w * 0.5, gy = view === "front" ? cy : h * 0.4; ctx.strokeRect(gx - g - 4, gy - 8, 4, 30); ctx.strokeRect(gx + g, gy - 8, 4, 30);
  ctx.fillStyle = "#e6eef8"; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.fillText(`${view === "front" ? "cam_front" : "cam_wrist"} · ep${ep.id} · step ${step}/${ep.steps}`, 6, 14);
}
