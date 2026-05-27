import type { Project } from "../projects/data";

// Static SVG covers — lightweight, render server-side, hint at each demo
export default function CardCover({ kind }: { kind: Project["cover"] }) {
  switch (kind) {
    case "ad": return <AdCover />;
    case "mapv": return <MapvCover />;
    case "loca": return <LocaCover />;
    case "truck": return <TruckCover />;
    case "qianxi": return <QianxiCover />;
    case "jiaotong": return <JiaotongCover />;
    case "renqi": return <RenqiCover />;
    case "mapv-pro": return <MapvProCover />;
    case "amap-sdk": return <AmapSdkCover />;
    case "l7": return <L7Cover />;
    case "baidu-sdk": return <BaiduSdkCover />;
  }
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect x="0" y="0" width="320" height="180" fill="#0a0a10" />
      {children}
    </svg>
  );
}

function Grid({ stroke = "rgba(40,40,55,0.6)" }: { stroke?: string }) {
  const lines = [];
  for (let x = 0; x <= 320; x += 20) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={180} stroke={stroke} />);
  for (let y = 0; y <= 180; y += 20) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={320} y2={y} stroke={stroke} />);
  return <g>{lines}</g>;
}

function AdCover() {
  // dotted lidar arcs
  const dots = [];
  for (let r = 0; r < 6; r++) {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const rad = 20 + r * 12;
      const x = 160 + Math.cos(a) * rad;
      const y = 90 + Math.sin(a) * rad * 0.5;
      const o = 0.3 + (r / 6) * 0.7;
      const c = r < 2 ? "#79ffe1" : r < 4 ? "#ff7eb6" : "#f0c83c";
      dots.push(<circle key={`${r}-${i}`} cx={x} cy={y} r={1} fill={c} opacity={o} />);
    }
  }
  return (
    <Frame>
      <Grid />
      <rect x={148} y={82} width={24} height={16} fill="none" stroke="#79ffe1" strokeWidth={1} />
      {dots}
      <rect x={70} y={50} width={26} height={20} fill="none" stroke="#ff7eb6" strokeWidth={1} />
      <rect x={220} y={120} width={26} height={20} fill="none" stroke="#ff7eb6" strokeWidth={1} />
    </Frame>
  );
}

function MapvCover() {
  const blobs = [];
  const data: [number, number, number][] = [
    [80, 100, 28], [180, 70, 36], [240, 120, 24], [120, 130, 20], [60, 60, 16], [220, 50, 18],
  ];
  for (const [x, y, r] of data) {
    blobs.push(
      <g key={`${x}-${y}`}>
        <circle cx={x} cy={y} r={r} fill="#ff5a50" opacity="0.25" />
        <circle cx={x} cy={y} r={r * 0.6} fill="#f0c83c" opacity="0.4" />
        <circle cx={x} cy={y} r={r * 0.3} fill="#fff" opacity="0.5" />
      </g>
    );
  }
  return <Frame><Grid />{blobs}</Frame>;
}

function LocaCover() {
  const boxes = [];
  for (let i = 0; i < 36; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const x = 60 + col * 36;
    const y = 60 + row * 22;
    const h = 10 + Math.random() * 60;
    const c = h > 50 ? "#ff7eb6" : h > 30 ? "#f0c83c" : "#79ffe1";
    boxes.push(
      <g key={i} transform={`translate(${x}, ${y - h})`}>
        <rect x={0} y={0} width={28} height={h + 12} fill={c} opacity="0.85" />
        <polygon points={`0,0 14,-8 42,-8 28,0`} fill={c} />
        <polygon points={`28,0 42,-8 42,${h + 4} 28,${h + 12}`} fill={c} opacity="0.7" />
      </g>
    );
  }
  return <Frame><Grid stroke="rgba(30,30,40,0.5)" />{boxes}</Frame>;
}

function TruckCover() {
  return (
    <Frame>
      <Grid />
      <rect x={70} y={40} width={50} height={30} fill="rgba(255,90,80,0.15)" stroke="#ff5a50" strokeDasharray="4 3" />
      <text x={75} y={56} fontFamily="ui-monospace" fontSize="8" fill="#ff5a50">RESTRICTED</text>
      <polyline points="30,140 60,120 100,110 140,90 180,80 220,60 260,50 290,40"
        fill="none" stroke="#79ffe1" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={30} cy={140} r={5} fill="#ff7eb6" />
      <circle cx={290} cy={40} r={5} fill="#ff7eb6" />
      <g transform="translate(160, 86) rotate(-12)">
        <rect x={-10} y={-5} width={20} height={10} fill="#fff" />
        <rect x={8} y={-4} width={3} height={8} fill="#ff7eb6" />
      </g>
    </Frame>
  );
}

function QianxiCover() {
  const cities: [number, number, number][] = [
    [60, 50, 4], [180, 35, 6], [260, 80, 5], [80, 130, 4], [220, 140, 5], [150, 90, 6],
  ];
  const arcs: [number, number, number, number][] = [
    [60, 50, 180, 35], [60, 50, 260, 80], [180, 35, 220, 140],
    [150, 90, 80, 130], [180, 35, 150, 90], [260, 80, 220, 140],
  ];
  return (
    <Frame>
      <Grid />
      {arcs.map(([x1, y1, x2, y2], i) => {
        const cx = (x1 + x2) / 2 - (y2 - y1) * 0.3;
        const cy = (y1 + y2) / 2 + (x2 - x1) * 0.3;
        return <path key={i} d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
          fill="none" stroke="#ff7eb6" strokeWidth={1} opacity={0.6} />;
      })}
      {cities.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2} fill="#79ffe1" opacity="0.2" />
          <circle cx={x} cy={y} r={r} fill="#79ffe1" />
        </g>
      ))}
    </Frame>
  );
}

function JiaotongCover() {
  return (
    <Frame>
      <Grid stroke="rgba(30,30,45,0.5)" />
      <circle cx={160} cy={90} r={60} fill="none" stroke="#ff5a50" strokeWidth={3} />
      <circle cx={160} cy={90} r={60} fill="none" stroke="rgba(255,90,80,0.3)" strokeWidth={6} />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const x1 = 160 + Math.cos(a) * 60;
        const y1 = 90 + Math.sin(a) * 60;
        const x2 = 160 + Math.cos(a) * 95;
        const y2 = 90 + Math.sin(a) * 95;
        const c = i % 3 === 0 ? "#ff5a50" : i % 3 === 1 ? "#f0c83c" : "#79ffe1";
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={3} />;
      })}
      <line x1={120} y1={90} x2={200} y2={90} stroke="#79ffe1" strokeWidth={3} />
      <line x1={160} y1={60} x2={160} y2={120} stroke="#f0c83c" strokeWidth={3} />
      <circle cx={160} cy={90} r={5} fill="#ff7eb6" />
    </Frame>
  );
}

function RenqiCover() {
  return (
    <Frame>
      <Grid />
      {[80, 50, 30, 15].map((r, i) => (
        <circle key={i} cx={160} cy={90} r={r}
          fill={`rgba(255,126,182,${0.05 + i * 0.05})`}
          stroke="rgba(121,255,225,0.4)"
          strokeDasharray="4 4"
        />
      ))}
      {[
        [100, 60, 12], [200, 110, 14], [220, 60, 10], [110, 130, 11], [70, 90, 8],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r}
          fill="#ff7eb6" opacity={0.5} />
      ))}
      <circle cx={160} cy={90} r={5} fill="#fff" />
    </Frame>
  );
}

function MapvProCover() {
  return (
    <Frame>
      <rect x={10} y={10} width={170} height={160} fill="none" stroke="rgba(255,126,182,0.3)" />
      <rect x={190} y={10} width={120} height={48} fill="none" stroke="rgba(255,126,182,0.3)" />
      <rect x={190} y={66} width={120} height={48} fill="none" stroke="rgba(255,126,182,0.3)" />
      <rect x={190} y={122} width={120} height={48} fill="none" stroke="rgba(255,126,182,0.3)" />
      <polyline points="200,55 215,40 230,50 245,30 260,38 275,28 290,35 305,25"
        fill="none" stroke="#79ffe1" strokeWidth={1.5} />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect key={i} x={196 + i * 14} y={130 + (8 - i) * 4} width={10} height={(i) * 4 + 5}
          fill="#ff7eb6" opacity={0.7} />
      ))}
      <g fill="#79ffe1">
        <circle cx={60} cy={60} r={3} /><circle cx={120} cy={50} r={3} />
        <circle cx={80} cy={120} r={3} /><circle cx={140} cy={130} r={3} />
        <circle cx={40} cy={100} r={3} /><circle cx={160} cy={90} r={3} />
      </g>
    </Frame>
  );
}

function AmapSdkCover() {
  return (
    <Frame>
      <Grid />
      {/* roads */}
      <line x1={0} y1={70} x2={320} y2={70} stroke="rgba(120,120,150,0.7)" strokeWidth={3} />
      <line x1={0} y1={120} x2={320} y2={120} stroke="rgba(120,120,150,0.7)" strokeWidth={3} />
      <line x1={100} y1={0} x2={100} y2={180} stroke="rgba(120,120,150,0.7)" strokeWidth={3} />
      <line x1={220} y1={0} x2={220} y2={180} stroke="rgba(120,120,150,0.7)" strokeWidth={3} />
      {/* parks */}
      <circle cx={60} cy={140} r={28} fill="rgba(121,255,225,0.08)" stroke="rgba(121,255,225,0.3)" />
      <circle cx={270} cy={45} r={20} fill="rgba(121,255,225,0.08)" stroke="rgba(121,255,225,0.3)" />
      {/* markers */}
      {[[100, 70], [220, 70], [100, 120], [220, 120]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={6} fill="#ff7eb6" stroke="#fff" strokeWidth={1.5} />
        </g>
      ))}
    </Frame>
  );
}

function L7Cover() {
  // hex grid mock
  const hexes = [];
  const r = 12;
  const dx = Math.sqrt(3) * r;
  const dy = 1.5 * r;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 12; col++) {
      const x = 40 + col * dx + (row % 2 ? dx / 2 : 0);
      const y = 30 + row * dy;
      if (x > 290 || y > 160) continue;
      const dist = Math.hypot(x - 160, y - 90);
      const t = Math.max(0, 1 - dist / 130);
      if (t < 0.05) continue;
      const c = t > 0.7 ? "#ff7eb6" : t > 0.4 ? "#f0c83c" : "#79ffe1";
      hexes.push(
        <polygon
          key={`${row}-${col}`}
          points={`${x - dx/2},${y - r/2} ${x},${y - r} ${x + dx/2},${y - r/2} ${x + dx/2},${y + r/2} ${x},${y + r} ${x - dx/2},${y + r/2}`}
          fill={c}
          opacity={0.3 + t * 0.6}
        />
      );
    }
  }
  return <Frame>{hexes}</Frame>;
}

function BaiduSdkCover() {
  return (
    <Frame>
      <Grid />
      {/* IDE-ish code block */}
      <rect x={20} y={30} width={180} height={120} fill="rgba(255,255,255,0.04)" stroke="rgba(255,126,182,0.3)" />
      {[
        "import BMapGL", "const map = new BMapGL.Map(", "  '#container'", ")", "map.setCenter(", "  new BMapGL.Point(...)", ")",
      ].map((line, i) => (
        <text key={i} x={28} y={50 + i * 14}
          fontFamily="ui-monospace" fontSize="9"
          fill={i === 0 ? "#ff7eb6" : i % 2 ? "#79ffe1" : "rgba(255,255,255,0.7)"}>
          {line}
        </text>
      ))}
      {/* map preview */}
      <rect x={210} y={30} width={90} height={120} fill="rgba(255,255,255,0.04)" stroke="rgba(121,255,225,0.3)" />
      <circle cx={255} cy={90} r={6} fill="#ff7eb6" />
      <line x1={220} y1={70} x2={290} y2={70} stroke="rgba(120,120,150,0.7)" strokeWidth={2} />
      <line x1={220} y1={120} x2={290} y2={120} stroke="rgba(120,120,150,0.7)" strokeWidth={2} />
      <line x1={240} y1={40} x2={240} y2={150} stroke="rgba(120,120,150,0.7)" strokeWidth={2} />
    </Frame>
  );
}
