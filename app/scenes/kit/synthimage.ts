// Draws a synthetic street image (road, lane lines, cars, pedestrians, sky) onto a canvas so image-annotation demos have something to label.
import { mulberry32 } from "./rng";
export type ImgObj = { cls: string; x: number; y: number; w: number; h: number };
export function drawStreet(ctx: CanvasRenderingContext2D, w: number, h: number, seed = 3): { objects: ImgObj[]; lanes: [number, number][][] } {
  const rng = mulberry32(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, "#0b1424"); sky.addColorStop(1, "#1a2740"); ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#151c28"; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  // buildings
  for (let x = 0; x < w; x += 40 + rng() * 60) { const bh = h * (0.15 + rng() * 0.3); ctx.fillStyle = `hsl(215 25% ${12 + rng() * 10}%)`; ctx.fillRect(x, h * 0.55 - bh, 30 + rng() * 60, bh); }
  // road trapezoid
  ctx.fillStyle = "#0e141e"; ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.55); ctx.lineTo(w * 0.58, h * 0.55); ctx.lineTo(w * 1.05, h); ctx.lineTo(-w * 0.05, h); ctx.closePath(); ctx.fill();
  const lanes: [number, number][][] = [];
  for (const k of [0.46, 0.5, 0.54]) { const pts: [number, number][] = []; for (let i = 0; i <= 8; i++) { const t = i / 8; const y = h * 0.55 + t * h * 0.45; const x = w * k + (t * t) * (k - 0.5) * w * 1.6 + Math.sin(t * 3) * 6; pts.push([x, y]); } lanes.push(pts); ctx.strokeStyle = k === 0.5 ? "#e8c86a" : "#c8d2df"; ctx.lineWidth = 2; ctx.setLineDash(k === 0.5 ? [] : [12, 10]); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); }
  const objects: ImgObj[] = [];
  const car = (x: number, y: number, s: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(x - 40 * s, y - 30 * s, 80 * s, 30 * s); ctx.fillStyle = "#0c1220"; ctx.fillRect(x - 25 * s, y - 45 * s, 50 * s, 16 * s); ctx.fillStyle = "#ff5d73"; ctx.fillRect(x - 36 * s, y - 20 * s, 8 * s, 6 * s); ctx.fillRect(x + 28 * s, y - 20 * s, 8 * s, 6 * s); objects.push({ cls: "car", x: x - 40 * s, y: y - 45 * s, w: 80 * s, h: 45 * s }); };
  const ped = (x: number, y: number, s: number) => { ctx.fillStyle = "#d9a066"; ctx.beginPath(); ctx.arc(x, y - 48 * s, 6 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#5e7fb3"; ctx.fillRect(x - 7 * s, y - 42 * s, 14 * s, 24 * s); ctx.fillStyle = "#2b3547"; ctx.fillRect(x - 6 * s, y - 18 * s, 5 * s, 18 * s); ctx.fillRect(x + 1 * s, y - 18 * s, 5 * s, 18 * s); objects.push({ cls: "pedestrian", x: x - 8 * s, y: y - 55 * s, w: 16 * s, h: 55 * s }); };
  car(w * 0.5, h * 0.66, 0.6, "#3d5a80"); car(w * 0.32, h * 0.84, 1.1, "#7a3e4e"); car(w * 0.7, h * 0.78, 0.9, "#4a6b5a");
  ped(w * 0.2, h * 0.7, 0.9); ped(w * 0.85, h * 0.68, 0.8);
  return { objects, lanes };
}
export function iou2d(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) { const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); const i = ix * iy; return i / (a.w * a.h + b.w * b.h - i || 1); }
