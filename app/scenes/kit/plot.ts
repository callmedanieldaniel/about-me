// Minimal canvas plotting helpers shared by engines (dark theme, HiDPI aware).
export const colors = { live: "#5ee7ff", ref: "#ffb454", ok: "#7cf3a0", bad: "#ff5d73", muted: "#7e90a8", violet: "#b99cff", fg: "#e6eef8", line: "#1c2a3d", panel: "#0d1420" };

export function fitCanvas(cv: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export type Series = { data: number[]; color: string; label?: string; width?: number; dash?: number[] };

export function linePlot(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }, series: Series[], opts: { min?: number; max?: number; title?: string; grid?: number; cursor?: number; xLabel?: string } = {}) {
  const { x, y, w, h } = box;
  ctx.save();
  ctx.fillStyle = "rgba(13,20,32,0.85)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = colors.line;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const all = series.flatMap((s) => s.data).filter(Number.isFinite);
  let min = opts.min ?? Math.min(...all), max = opts.max ?? Math.max(...all);
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  if (max - min < 1e-9) { max = min + 1; }
  const pad = 8, top = opts.title ? 20 : 8;
  const n = Math.max(...series.map((s) => s.data.length), 2);
  const gx = (i: number) => x + pad + (i / (n - 1)) * (w - pad * 2);
  const gy = (v: number) => y + top + (1 - (v - min) / (max - min)) * (h - top - pad);
  const grid = opts.grid ?? 3;
  ctx.strokeStyle = "rgba(28,42,61,0.9)";
  ctx.setLineDash([2, 4]);
  for (let i = 0; i <= grid; i++) {
    const v = min + ((max - min) * i) / grid;
    ctx.beginPath(); ctx.moveTo(x + pad, gy(v)); ctx.lineTo(x + w - pad, gy(v)); ctx.stroke();
    ctx.fillStyle = colors.muted; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "right";
    ctx.fillText(fmt(v), x + w - pad - 2, gy(v) - 2);
  }
  ctx.setLineDash([]);
  for (const s of series) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width ?? 1.5;
    if (s.dash) ctx.setLineDash(s.dash);
    ctx.beginPath();
    s.data.forEach((v, i) => { if (!Number.isFinite(v)) return; const px = gx(i), py = gy(v); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (opts.cursor !== undefined) {
    const cx = gx(opts.cursor);
    ctx.strokeStyle = colors.fg; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(cx, y + top); ctx.lineTo(cx, y + h - pad); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (opts.title) { ctx.fillStyle = colors.fg; ctx.font = "11px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillText(opts.title, x + pad, y + 13); }
  let lx = x + pad;
  series.forEach((s) => { if (!s.label) return; ctx.fillStyle = s.color; ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillText(s.label, lx, y + h - 3); lx += ctx.measureText(s.label).width + 10; });
  ctx.restore();
}

export function fmt(v: number) {
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function heat(t: number) {
  // 0..1 → dark blue → cyan → amber → red
  const stops: [number, number, number, number][] = [[0, 12, 22, 40], [0.35, 94, 231, 255], [0.7, 255, 180, 84], [1, 255, 93, 115]];
  const c = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++) {
    if (c <= stops[i][0]) {
      const [a, b] = [stops[i - 1], stops[i]];
      const k = (c - a[0]) / (b[0] - a[0]);
      return `rgb(${(a[1] + (b[1] - a[1]) * k) | 0},${(a[2] + (b[2] - a[2]) * k) | 0},${(a[3] + (b[3] - a[3]) * k) | 0})`;
    }
  }
  return "rgb(255,93,115)";
}
