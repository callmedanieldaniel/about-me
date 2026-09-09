"use client";
import { useRef } from "react";

// Shared scrubber used by log-replay demos. Value in seconds.
export function Timeline({ t, duration, onSeek, marks = [] }: { t: number; duration: number; onSeek: (t: number) => void; marks?: { t: number; color: string; label?: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const seek = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); onSeek(Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration))); };
  return (
    <div className="timeline" ref={ref} onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); seek(e); }} onPointerMove={(e) => { if (e.buttons) seek(e); }}>
      <div className="tl-track">
        {marks.map((m, i) => (
          <i key={i} style={{ left: `${(m.t / duration) * 100}%`, background: m.color }} title={m.label} />
        ))}
        <div className="tl-fill" style={{ width: `${(t / duration) * 100}%` }} />
        <div className="tl-head" style={{ left: `${(t / duration) * 100}%` }} />
      </div>
      <div className="tl-time">
        {t.toFixed(2)} / {duration.toFixed(1)} s
      </div>
    </div>
  );
}
