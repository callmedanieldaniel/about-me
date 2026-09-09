// Inline SVG glyphs for domains. Animated via CSS (.glyph paths draw on hover).
export function Glyph({ id, size = 48 }: { id: string; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const g: Record<string, React.ReactNode> = {
    lidar: (
      <>
        <circle cx="32" cy="32" r="22" {...common} strokeDasharray="4 5" />
        <circle cx="32" cy="32" r="12" {...common} />
        <path d="M32 32 L50 18" {...common} className="glyph-sweep" />
        <rect x="27" y="29" width="10" height="6" rx="1" fill="var(--accent)" />
      </>
    ),
    triage: (
      <>
        <path d="M8 40 L20 40 L26 22 L34 50 L40 34 L56 34" {...common} className="glyph-draw" />
        <circle cx="40" cy="34" r="3.5" fill="var(--accent)" />
        <path d="M46 12 L46 22 M46 26 L46 27" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    map: (
      <>
        <path d="M10 18 L24 12 L40 18 L54 12 L54 46 L40 52 L24 46 L10 52 Z" {...common} />
        <path d="M24 12 V46 M40 18 V52" {...common} />
        <circle cx="32" cy="30" r="4" fill="var(--accent)" />
      </>
    ),
    robot: (
      <>
        <rect x="18" y="18" width="28" height="22" rx="4" {...common} />
        <circle cx="27" cy="29" r="3" fill="var(--accent)" />
        <circle cx="37" cy="29" r="3" fill="var(--accent)" />
        <path d="M32 10 V18 M22 40 V52 M42 40 V52 M12 26 H18 M46 26 H52" {...common} />
      </>
    ),
    sim: (
      <>
        <path d="M12 44 Q22 20 32 32 T52 20" {...common} className="glyph-draw" />
        <path d="M12 52 H52" {...common} strokeDasharray="3 4" />
        <circle cx="32" cy="32" r="4" fill="var(--accent)" />
      </>
    ),
    annot: (
      <>
        <rect x="12" y="14" width="40" height="30" rx="2" {...common} />
        <rect x="20" y="22" width="14" height="12" {...common} stroke="var(--accent)" />
        <path d="M20 22 L14 16 M34 22 L40 16 M20 34 L14 40 M34 34 L40 40" {...common} stroke="var(--accent)" />
        <path d="M14 52 H50" {...common} />
      </>
    ),
    loop: (
      <>
        <path d="M32 12 A20 20 0 1 1 14 22" {...common} className="glyph-draw" />
        <path d="M14 12 V22 H24" {...common} />
        <circle cx="32" cy="32" r="5" fill="var(--accent)" />
      </>
    ),
    cube: (
      <>
        <path d="M32 10 L52 22 V42 L32 54 L12 42 V22 Z" {...common} />
        <path d="M32 34 L52 22 M32 34 V54 M32 34 L12 22" {...common} />
        <circle cx="32" cy="34" r="3" fill="var(--accent)" />
      </>
    ),
    ai: (
      <>
        <circle cx="16" cy="20" r="4" {...common} />
        <circle cx="16" cy="44" r="4" {...common} />
        <circle cx="48" cy="32" r="4" {...common} />
        <circle cx="32" cy="32" r="5" fill="var(--accent)" />
        <path d="M20 22 L28 30 M20 42 L28 34 M37 32 H44" {...common} />
      </>
    ),
    chart: (
      <>
        <path d="M10 50 H54" {...common} />
        <rect x="14" y="30" width="8" height="20" {...common} />
        <rect x="28" y="18" width="8" height="32" fill="var(--accent)" />
        <rect x="42" y="36" width="8" height="14" {...common} />
      </>
    ),
    science: (
      <>
        <ellipse cx="32" cy="32" rx="22" ry="9" {...common} />
        <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" {...common} />
        <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-60 32 32)" {...common} />
        <circle cx="32" cy="32" r="4" fill="var(--accent)" />
      </>
    ),
    grid: (
      <>
        <path d="M12 12 H52 V52 H12 Z M12 32 H52 M32 12 V52" {...common} />
        <circle cx="32" cy="32" r="4" fill="var(--accent)" />
        <circle cx="12" cy="12" r="2.5" fill="var(--accent)" />
        <circle cx="52" cy="52" r="2.5" fill="var(--accent)" />
      </>
    ),
  };
  return (
    <svg className="glyph" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {g[id] ?? g.cube}
    </svg>
  );
}
