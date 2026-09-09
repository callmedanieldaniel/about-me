"use client";
import { useEffect, useRef } from "react";
import type { EngineProps } from "../types";

const TICK = 0.01;
const LEVELS = 60;

type Book = { bids: Map<number, number>; asks: Map<number, number> };
type Trade = { t: number; price: number; qty: number; side: "buy" | "sell" };

export default function OrderBook({ params, playing, resetKey, onTelemetry }: EngineProps) {
  const depth = useRef<HTMLCanvasElement>(null);
  const price = useRef<HTMLCanvasElement>(null);
  const p = useRef(params);
  p.current = params;
  const play = useRef(playing);
  play.current = playing;
  const sweepReq = useRef<"buy" | "sell" | null>(null);

  useEffect(() => {
    const dc = depth.current?.getContext("2d");
    const pc = price.current?.getContext("2d");
    if (!dc || !pc) return;
    const book: Book = { bids: new Map(), asks: new Map() };
    let ref = 100;
    const key = (x: number) => Math.round(x / TICK) * TICK;
    const add = (side: Map<number, number>, px: number, q: number) => side.set(key(px), (side.get(key(px)) ?? 0) + q);
    // seed
    for (let i = 1; i <= LEVELS; i++) {
      add(book.bids, ref - i * TICK, 20 + Math.random() * 40 * Math.exp(-i / 25));
      add(book.asks, ref + i * TICK, 20 + Math.random() * 40 * Math.exp(-i / 25));
    }
    const bestBid = () => Math.max(...book.bids.keys());
    const bestAsk = () => Math.min(...book.asks.keys());
    const trades: Trade[] = [];
    const mids: number[] = [];
    let t = 0, acc = 0, last = performance.now(), raf = 0, telT = 0, volume = 0, nMkt = 0, lastImpact = 0;

    const market = (side: "buy" | "sell", qty: number) => {
      const bookSide = side === "buy" ? book.asks : book.bids;
      const before = (bestBid() + bestAsk()) / 2;
      let rem = qty;
      const levels = [...bookSide.keys()].sort((a, b) => (side === "buy" ? a - b : b - a));
      for (const px of levels) {
        if (rem <= 0) break;
        const q = bookSide.get(px)!;
        const fill = Math.min(q, rem);
        rem -= fill;
        volume += fill;
        trades.push({ t, price: px, qty: fill, side });
        if (fill >= q) bookSide.delete(px);
        else bookSide.set(px, q - fill);
      }
      if (trades.length > 300) trades.splice(0, trades.length - 300);
      const after = (bestBid() + bestAsk()) / 2;
      lastImpact = ((after - before) / before) * 1e4;
      nMkt++;
    };

    const step = (dt: number) => {
      const q = p.current;
      const lambda = Number(q.arrival);
      const vol = Number(q.volatility);
      const aggr = Number(q.aggression);
      t += dt;
      ref += (Math.random() - 0.5) * vol * 0.02 + (100 - ref) * 0.002;
      acc += lambda * dt;
      while (acc >= 1) {
        acc -= 1;
        const u = Math.random();
        const mid = (bestBid() + bestAsk()) / 2;
        if (u < aggr) {
          market(Math.random() < 0.5 + (ref - mid) * 2 ? "buy" : "sell", 3 + Math.random() * 12);
        } else if (u < aggr + 0.25) {
          // cancel a random level partially
          const side = Math.random() < 0.5 ? book.bids : book.asks;
          const keys = [...side.keys()];
          if (keys.length > 5) {
            const k = keys[Math.floor(Math.random() * keys.length)];
            const qq = side.get(k)!;
            const c = qq * (0.3 + Math.random() * 0.7);
            if (qq - c < 0.5) side.delete(k);
            else side.set(k, qq - c);
          }
        } else {
          const side = Math.random() < 0.5 + (ref - mid) * 1.5 ? "bid" : "ask";
          const dist = -Math.log(1 - Math.random()) * 8 * TICK;
          if (side === "bid") add(book.bids, Math.min(bestAsk() - TICK, mid - dist), 3 + Math.random() * 14);
          else add(book.asks, Math.max(bestBid() + TICK, mid + dist), 3 + Math.random() * 14);
        }
      }
      // Make sure book never empties
      if (book.bids.size < 8) for (let i = 1; i <= 20; i++) add(book.bids, ref - i * TICK * 2, 10 + Math.random() * 20);
      if (book.asks.size < 8) for (let i = 1; i <= 20; i++) add(book.asks, ref + i * TICK * 2, 10 + Math.random() * 20);
      mids.push((bestBid() + bestAsk()) / 2);
      if (mids.length > 600) mids.shift();
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (sweepReq.current) {
        market(sweepReq.current, Number(p.current.sweep) * 10);
        sweepReq.current = null;
      }
      if (play.current) step(dt);
      drawDepth(dc, book, bestBid(), bestAsk());
      drawPrice(pc, mids, trades, t);
      telT += dt;
      if (telT > 0.2) {
        telT = 0;
        const bb = bestBid(), ba = bestAsk();
        const bidQ = [...book.bids.entries()].filter(([k]) => k > bb - 10 * TICK).reduce((s, [, v]) => s + v, 0);
        const askQ = [...book.asks.entries()].filter(([k]) => k < ba + 10 * TICK).reduce((s, [, v]) => s + v, 0);
        onTelemetry({
          "Mid price": Math.round(((bb + ba) / 2) * 1000) / 1000,
          "Spread (ticks)": Math.round((ba - bb) / TICK),
          "Imbalance (10 lvl)": Math.round(((bidQ - askQ) / (bidQ + askQ || 1)) * 100) / 100,
          "Market orders": nMkt,
          "Traded volume": Math.round(volume),
          "Last impact (bp)": Math.round(lastImpact * 10) / 10,
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [resetKey, onTelemetry]);

  return (
    <div className="engine-host orderbook">
      <div className="ob-panel">
        <canvas ref={depth} width={640} height={360} />
        <span>Cumulative depth around the mid</span>
      </div>
      <div className="ob-panel">
        <canvas ref={price} width={640} height={360} />
        <span>Mid price and trades, last 30 s</span>
      </div>
      <div className="ob-actions">
        <button type="button" onClick={() => (sweepReq.current = "buy")}>Sweep buy</button>
        <button type="button" onClick={() => (sweepReq.current = "sell")}>Sweep sell</button>
      </div>
    </div>
  );
}

function drawDepth(ctx: CanvasRenderingContext2D, book: Book, bb: number, ba: number) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, W, H);
  const mid = (bb + ba) / 2;
  const range = 0.6;
  const x = (px: number) => ((px - (mid - range)) / (2 * range)) * W;
  const bids = [...book.bids.entries()].sort((a, b) => b[0] - a[0]);
  const asks = [...book.asks.entries()].sort((a, b) => a[0] - b[0]);
  let cum = 0;
  const bPts: [number, number][] = [];
  for (const [px, q] of bids) {
    if (px < mid - range) break;
    cum += q;
    bPts.push([px, cum]);
  }
  cum = 0;
  const aPts: [number, number][] = [];
  for (const [px, q] of asks) {
    if (px > mid + range) break;
    cum += q;
    aPts.push([px, cum]);
  }
  const maxC = Math.max(1, ...bPts.map((p) => p[1]), ...aPts.map((p) => p[1]));
  const y = (c: number) => H - 24 - (c / maxC) * (H - 50);
  const area = (pts: [number, number][], color: string, edge: number) => {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(x(edge), H - 24);
    let prev = edge;
    for (const [px, c] of pts) {
      ctx.lineTo(x(prev), y(c));
      ctx.lineTo(x(px), y(c));
      prev = px;
    }
    ctx.lineTo(x(prev), H - 24);
    ctx.closePath();
    ctx.fillStyle = color + "33";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };
  area(bPts, "#7cf3a0", bb);
  area(aPts, "#ff5d73", ba);
  ctx.strokeStyle = "#5ee7ff";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x(mid), 10);
  ctx.lineTo(x(mid), H - 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#7e90a8";
  ctx.font = "11px 'IBM Plex Mono', monospace";
  for (let i = -2; i <= 2; i++) {
    const px = mid + i * 0.25;
    ctx.fillText(px.toFixed(2), x(px) - 16, H - 8);
  }
  ctx.fillStyle = "#e6eef8";
  ctx.fillText(`bid ${bb.toFixed(2)}  ask ${ba.toFixed(2)}`, 10, 18);
}

function drawPrice(ctx: CanvasRenderingContext2D, mids: number[], trades: Trade[], t: number) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, W, H);
  if (mids.length < 2) return;
  const win = mids.slice(-600);
  let lo = Math.min(...win), hi = Math.max(...win);
  const pad = Math.max(0.05, (hi - lo) * 0.15);
  lo -= pad;
  hi += pad;
  const x = (i: number) => (i / 599) * W;
  const y = (v: number) => H - 20 - ((v - lo) / (hi - lo)) * (H - 40);
  ctx.strokeStyle = "#182436";
  for (let f = 0.25; f < 1; f += 0.25) {
    ctx.beginPath();
    ctx.moveTo(0, 20 + (H - 40) * f);
    ctx.lineTo(W, 20 + (H - 40) * f);
    ctx.stroke();
  }
  ctx.strokeStyle = "#5ee7ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  win.forEach((m, i) => {
    const off = 600 - win.length;
    if (i === 0) ctx.moveTo(x(i + off), y(m));
    else ctx.lineTo(x(i + off), y(m));
  });
  ctx.stroke();
  // trades: map trade time to x by relative age; each mid sample ≈ one frame ≈ 1/60 s → 600 samples ≈ 10 s at 60 fps
  const span = 10;
  for (const tr of trades) {
    const age = t - tr.t;
    if (age > span) continue;
    const px = W - (age / span) * W;
    ctx.fillStyle = tr.side === "buy" ? "#ffb454" : "#ff5d73";
    const r = Math.min(9, 1.5 + Math.sqrt(tr.qty) * 0.7);
    ctx.beginPath();
    ctx.arc(px, y(tr.price), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#7e90a8";
  ctx.font = "11px 'IBM Plex Mono', monospace";
  ctx.fillText(hi.toFixed(2), 6, 14);
  ctx.fillText(lo.toFixed(2), 6, H - 6);
}
