// Minimal OpenDRIVE 1.x reader: planView line/arc geometries, lane sections with constant widths, road links.
// Produces sampled lane center/border polylines and a lane graph.

export type Lane = { key: string; road: string; id: number; width: number; center: [number, number][]; outer: [number, number][]; inner: [number, number][]; succ: string[]; pred: string[]; type: string; length: number };
export type Road = { id: string; length: number; ref: [number, number, number][]; junction: string; succ?: { type: string; id: string; contact: string }; pred?: { type: string; id: string; contact: string } };
export type Network = { roads: Road[]; lanes: Lane[]; bbox: [number, number, number, number] };

export const SAMPLE_XODR = `<?xml version="1.0"?>
<OpenDRIVE><header revMajor="1" revMinor="8" name="xvis-loop"/>
<road name="R1" length="120" id="1" junction="-1"><link><predecessor elementType="road" elementId="4" contactPoint="end"/><successor elementType="road" elementId="2" contactPoint="start"/></link>
 <planView><geometry s="0" x="0" y="0" hdg="0" length="120"><line/></geometry></planView>
 <lanes><laneSection s="0"><left><lane id="2" type="sidewalk"><width a="2"/></lane><lane id="1" type="driving"><width a="3.5"/></lane></left><center><lane id="0" type="none"/></center><right><lane id="-1" type="driving"><width a="3.5"/></lane><lane id="-2" type="driving"><width a="3.5"/></lane><lane id="-3" type="shoulder"><width a="1.5"/></lane></right></laneSection></lanes></road>
<road name="R2" length="125.66" id="2" junction="-1"><link><predecessor elementType="road" elementId="1" contactPoint="end"/><successor elementType="road" elementId="3" contactPoint="start"/></link>
 <planView><geometry s="0" x="120" y="0" hdg="0" length="125.66"><arc curvature="0.025"/></geometry></planView>
 <lanes><laneSection s="0"><left><lane id="1" type="driving"><width a="3.5"/></lane></left><center><lane id="0" type="none"/></center><right><lane id="-1" type="driving"><width a="3.5"/></lane><lane id="-2" type="driving"><width a="3.5"/></lane></right></laneSection></lanes></road>
<road name="R3" length="120" id="3" junction="-1"><link><predecessor elementType="road" elementId="2" contactPoint="end"/><successor elementType="road" elementId="4" contactPoint="start"/></link>
 <planView><geometry s="0" x="120" y="80" hdg="3.14159" length="120"><line/></geometry></planView>
 <lanes><laneSection s="0"><left><lane id="1" type="driving"><width a="3.5"/></lane></left><center><lane id="0" type="none"/></center><right><lane id="-1" type="driving"><width a="3.5"/></lane><lane id="-2" type="driving"><width a="3.5"/></lane></right></laneSection></lanes></road>
<road name="R4" length="125.66" id="4" junction="-1"><link><predecessor elementType="road" elementId="3" contactPoint="end"/><successor elementType="road" elementId="1" contactPoint="start"/></link>
 <planView><geometry s="0" x="0" y="80" hdg="3.14159" length="125.66"><arc curvature="0.025"/></geometry></planView>
 <lanes><laneSection s="0"><left><lane id="1" type="driving"><width a="3.5"/></lane></left><center><lane id="0" type="none"/></center><right><lane id="-1" type="driving"><width a="3.5"/></lane><lane id="-2" type="driving"><width a="3.5"/></lane></right></laneSection></lanes></road>
<road name="R5-exit" length="80" id="5" junction="-1"><link><predecessor elementType="road" elementId="1" contactPoint="end"/></link>
 <planView><geometry s="0" x="120" y="-7" hdg="-0.35" length="80"><line/></geometry></planView>
 <lanes><laneSection s="0"><center><lane id="0" type="none"/></center><right><lane id="-1" type="driving"><width a="3.5"/></lane></right></laneSection></lanes></road>
</OpenDRIVE>`;

const kids = (el: Element, tag: string) => Array.from(el.childNodes).filter((n): n is Element => n.nodeType === 1 && (n as Element).tagName === tag);
const first = (el: Element, tag: string) => kids(el, tag)[0];

export function parseOpenDrive(xml: string): Network {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const roads: Road[] = []; const lanes: Lane[] = [];
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const r of Array.from(doc.getElementsByTagName("road"))) {
    const id = r.getAttribute("id")!; const length = Number(r.getAttribute("length"));
    const ref: [number, number, number][] = [];
    const pv = first(r, "planView");
    for (const g of pv ? kids(pv, "geometry") : []) {
      const x0 = Number(g.getAttribute("x")), y0 = Number(g.getAttribute("y")), h0 = Number(g.getAttribute("hdg")), L = Number(g.getAttribute("length"));
      const arc = first(g, "arc"); const k = arc ? Number(arc.getAttribute("curvature")) : 0;
      const n = Math.max(2, Math.ceil(L / 2));
      for (let i = 0; i <= n; i++) {
        const s = (i / n) * L;
        let x: number, y: number, h: number;
        if (Math.abs(k) < 1e-9) { x = x0 + Math.cos(h0) * s; y = y0 + Math.sin(h0) * s; h = h0; }
        else { h = h0 + k * s; x = x0 + (Math.sin(h) - Math.sin(h0)) / k; y = y0 - (Math.cos(h) - Math.cos(h0)) / k; }
        ref.push([x, y, h]);
      }
    }
    const link = (sel: string) => { const lk = first(r, "link"); const e = lk ? first(lk, sel) : undefined; return e ? { type: e.getAttribute("elementType")!, id: e.getAttribute("elementId")!, contact: e.getAttribute("contactPoint") ?? "start" } : undefined; };
    const road: Road = { id, length, ref, junction: r.getAttribute("junction") ?? "-1", succ: link("successor"), pred: link("predecessor") };
    roads.push(road);
    const lanesEl = first(r, "lanes"); const sec = lanesEl ? first(lanesEl, "laneSection") : undefined; if (!sec) continue;
    const sideLanes = (side: "left" | "right") => { const s = first(sec, side); return (s ? kids(s, "lane") : []).map((l) => ({ id: Number(l.getAttribute("id")), type: l.getAttribute("type") ?? "driving", width: Number(first(l, "width")?.getAttribute("a") ?? 3.5) })); }
    for (const side of ["left", "right"] as const) {
      let offset = 0;
      for (const l of sideLanes(side).sort((a, b) => Math.abs(a.id) - Math.abs(b.id))) {
        const sign = side === "left" ? 1 : -1;
        const inner = ref.map(([x, y, h]) => [x - Math.sin(h) * sign * offset, y + Math.cos(h) * sign * offset] as [number, number]);
        const outer = ref.map(([x, y, h]) => [x - Math.sin(h) * sign * (offset + l.width), y + Math.cos(h) * sign * (offset + l.width)] as [number, number]);
        const center = ref.map(([x, y, h]) => [x - Math.sin(h) * sign * (offset + l.width / 2), y + Math.cos(h) * sign * (offset + l.width / 2)] as [number, number]);
        for (const [x, y] of outer) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
        lanes.push({ key: `${id}:${l.id}`, road: id, id: l.id, width: l.width, center, outer, inner, succ: [], pred: [], type: l.type, length });
        offset += l.width;
      }
    }
  }
  // topology: same lane id across road links (right lanes flow with road direction, left lanes against it)
  const byKey = new Map(lanes.map((l) => [l.key, l]));
  for (const r of roads) for (const l of lanes.filter((x) => x.road === r.id && x.type === "driving")) {
    const nextRoad = l.id < 0 ? r.succ : r.pred, prevRoad = l.id < 0 ? r.pred : r.succ;
    const cand = (rr: Road["succ"]) => (rr ? lanes.filter((x) => x.road === rr.id && x.type === "driving" && Math.sign(x.id) === Math.sign(l.id) && Math.abs(Math.abs(x.id) - Math.abs(l.id)) <= 1).map((x) => x.key) : []);
    l.succ = cand(nextRoad); l.pred = cand(prevRoad);
  }
  for (const l of lanes) for (const s of l.succ) { const t = byKey.get(s); if (t && !t.pred.includes(l.key)) t.pred.push(l.key); }
  return { roads, lanes, bbox: [minx, miny, maxx, maxy] };
}

export function shortestPath(net: Network, from: string, to: string): string[] {
  const dist = new Map<string, number>(); const prev = new Map<string, string>(); const open = new Set<string>([from]); dist.set(from, 0);
  const L = new Map(net.lanes.map((l) => [l.key, l]));
  while (open.size) {
    let u = "", best = Infinity; for (const k of open) { const d = dist.get(k)!; if (d < best) { best = d; u = k; } }
    open.delete(u); if (u === to) break;
    const lane = L.get(u)!;
    const neighbors = [...lane.succ, ...net.lanes.filter((x) => x.road === lane.road && x.type === "driving" && Math.sign(x.id) === Math.sign(lane.id) && Math.abs(x.id - lane.id) === 1).map((x) => x.key)];
    for (const v of neighbors) { const w = L.get(v)!.length * (lane.road === L.get(v)!.road ? 0.4 : 1); const nd = best + w; if (nd < (dist.get(v) ?? Infinity)) { dist.set(v, nd); prev.set(v, u); open.add(v); } }
  }
  if (!dist.has(to)) return [];
  const path = [to]; while (path[0] !== from) { const pv = prev.get(path[0]); if (!pv) return []; path.unshift(pv); }
  return path;
}
