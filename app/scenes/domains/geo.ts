import { c, lib, type SceneDef } from "../types";

export const geo: SceneDef[] = [
  {
    id: "deckgl", domain: "geo", title: "deck.gl", question: "GPU layers for millions of points, arcs and trips — how do the core deck.gl layers look on the same data?", input: "Synthetic points / arcs / trips around San Francisco, 60k-point cloud", output: "Layer browser, animated trips, orbit point cloud",
    demos: [
      { id: "layers", title: "Layer browser", summary: "Scatterplot, Hexagon (extruded), Heatmap, Arc and GeoJSON layers over one dataset on a MapLibre dark basemap via MapLibreOverlay.", controls: [{ key: "layer", label: "Layer", type: "select", options: ["scatter", "hexagon", "heatmap", "arc", "geojson"].map((v) => ({ value: v, label: v })), default: "hexagon" }, { key: "count", label: "Points", type: "range", min: 500, max: 20000, step: 500, default: 4000 }, { key: "pitch", label: "Pitch", type: "range", min: 0, max: 70, step: 5, unit: "°", default: 45 }],
        legend: [{ color: c.live, label: "Low" }, { color: c.ref, label: "Mid" }, { color: c.bad, label: "High" }],
        assumptions: "Basemap tiles from Carto's public style; without network the map falls back to a plain dark canvas and layers still render.", camera: "Drag · scroll · ctrl-drag to tilt", libs: [lib.deck, lib.maplibre], load: () => import("../engines/geo/DeckLayers") },
      { id: "trips", title: "TripsLayer replay", summary: "Forty timestamped trajectories animated with a fading trail — deck.gl's TripsLayer, the standard fleet-replay visual.", controls: [{ key: "speed", label: "Playback speed", type: "range", min: 1, max: 40, step: 1, unit: "×", default: 12 }, { key: "trail", label: "Trail length", type: "range", min: 5, max: 120, step: 5, unit: "s", default: 40 }, { key: "width", label: "Line width", type: "range", min: 1, max: 8, step: 1, unit: "px", default: 3 }],
        legend: [{ color: c.live, label: "Fleet A" }, { color: c.ref, label: "Fleet B" }, { color: c.ok, label: "Fleet C" }],
        assumptions: "Random-walk trajectories with synthetic timestamps; no road snapping.", libs: [lib.deck, lib.maplibre], load: () => import("../engines/geo/DeckTrips") },
      { id: "pointcloud", title: "PointCloudLayer (orbit)", summary: "60k synthetic LiDAR-like points uploaded as binary attributes to PointCloudLayer in an OrbitView — no map, pure GPU.", controls: [{ key: "count", label: "Points", type: "range", min: 10000, max: 300000, step: 10000, default: 60000 }, { key: "size", label: "Point size", type: "range", min: 1, max: 6, step: 0.5, unit: "px", default: 2 }],
        legend: [{ color: c.live, label: "Ground" }, { color: c.ref, label: "Elevated" }],
        assumptions: "Binary attribute upload (Float32 positions, Uint8 colors) skips per-object accessors — the path for large clouds.", libs: [lib.deck], load: () => import("../engines/geo/DeckPointCloud") },
    ],
  },
  {
    id: "maplibre", domain: "geo", title: "MapLibre GL", question: "The open vector-tile engine: terrain, a Three.js custom layer and live style edits, all without a key.", input: "Public Carto style, MapLibre demo DEM tiles, synthetic extrusions", output: "3D terrain, 3D objects in map space, runtime restyling",
    demos: [
      { id: "terrain", title: "Terrain + extrusions", summary: "raster-dem terrain with exaggeration and hillshade, a sky layer and 120 synthetic fill-extrusion blocks.", controls: [{ key: "terrain", label: "Terrain", type: "toggle", default: true }, { key: "exaggeration", label: "Exaggeration", type: "range", min: 0.5, max: 3, step: 0.1, default: 1.5 }, { key: "hillshade", label: "Hillshade", type: "toggle", default: true }],
        legend: [{ color: "#27394f", label: "Low block" }, { color: c.live, label: "Tall block / hillshade highlight" }],
        assumptions: "DEM tiles come from demotiles.maplibre.org (limited coverage). Extrusions are synthetic.", libs: [lib.maplibre], load: () => import("../engines/geo/MapLibreTerrain") },
      { id: "three", title: "Three.js custom layer", summary: "A MapLibre custom layer (renderingMode 3d) drives a Three.js scene in Mercator coordinates: orbiting vehicles, a beacon and a pulsing ring, sharing the map's GL context.", controls: [{ key: "radius", label: "Orbit radius", type: "range", min: 30, max: 200, step: 10, unit: "m", default: 90 }, { key: "speed", label: "Speed", type: "range", min: 1, max: 20, step: 1, default: 6 }],
        legend: [{ color: c.live, label: "Vehicle A" }, { color: c.ref, label: "Vehicle B" }, { color: c.ok, label: "Beacon" }],
        assumptions: "Meter scale is taken at the origin; fine for a city block, wrong across continents.", libs: [lib.maplibre, lib.three], load: () => import("../engines/geo/MapLibreThree") },
      { id: "style", title: "Live style editing", summary: "setPaintProperty / setLayoutProperty on the basemap at runtime (water, roads, labels) plus a data-driven choropleth from expressions.", controls: [{ key: "water", label: "Water color", type: "text", default: "#0b2a44" }, { key: "roads", label: "Road color", type: "text", default: "#3a4c66" }, { key: "labels", label: "Labels", type: "toggle", default: true }, { key: "opacity", label: "Choropleth opacity", type: "range", min: 0, max: 1, step: 0.05, default: 0.45 }],
        legend: [{ color: "#0c1628", label: "v=0" }, { color: c.live, label: "v=50" }, { color: c.bad, label: "v=100" }],
        assumptions: "Layer matching is by id substring (water / road), which depends on the style; with the fallback style only the choropleth responds.", camera: "Static 2D map", libs: [lib.maplibre], load: () => import("../engines/geo/MapLibreStyle") },
    ],
  },
  {
    id: "mapbox", domain: "geo", title: "Mapbox GL JS", question: "Mapbox Standard style, terrain and the globe — what does the commercial engine add?", input: "Mapbox styles and DEM (token required)", output: "3D city with light presets and a route, spinning globe with atmosphere",
    demos: [
      { id: "standard", title: "Standard style + terrain", summary: "Mapbox Standard (3D buildings, light presets) or dark-v11, optional terrain, an animated route marker and auto-rotate.", controls: [{ key: "style", label: "Style", type: "select", options: [{ value: "standard", label: "Standard (3D)" }, { value: "dark", label: "Dark v11" }], default: "standard" }, { key: "light", label: "Light preset", type: "select", options: ["dawn", "day", "dusk", "night"].map((v) => ({ value: v, label: v })), default: "night" }, { key: "terrain", label: "Terrain", type: "toggle", default: false }, { key: "rotate", label: "Auto-rotate", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Route" }, { color: c.ref, label: "Marker" }],
        assumptions: "Requires NEXT_PUBLIC_MAPBOX_TOKEN at build time; Standard style config properties need GL JS ≥ 3.", needsKey: "mapbox", libs: [lib.mapbox], load: () => import("../engines/geo/MapboxStandard") },
      { id: "globe", title: "Globe + atmosphere", summary: "Globe projection with fog/stars, spinning, and data-driven city circles with labels.", controls: [{ key: "spin", label: "Spin", type: "toggle", default: true }, { key: "speed", label: "Spin speed", type: "range", min: 1, max: 30, step: 1, unit: "°/s", default: 6 }],
        legend: [{ color: c.live, label: "City (radius ∝ value)" }],
        assumptions: "Requires NEXT_PUBLIC_MAPBOX_TOKEN.", needsKey: "mapbox", libs: [lib.mapbox], load: () => import("../engines/geo/MapboxGlobe") },
    ],
  },
  {
    id: "loca", domain: "geo", title: "AMap Loca", question: "China's dominant web map with Loca's animated data layers — what does the native stack look like?", input: "AMap JSAPI 2.0 + Loca 2.0 (key required)", output: "Gradient buildings with pulse lines, national flight links",
    demos: [
      { id: "city", title: "City: buildings + pulse lines", summary: "AMap 3D grey basemap with gradient-styled buildings, a PulseLineLayer route and breathing ScatterLayer points over Lujiazui.", controls: [{ key: "pitch", label: "Pitch", type: "range", min: 30, max: 75, step: 5, unit: "°", default: 60 }, { key: "heightFactor", label: "Building height factor", type: "range", min: 1, max: 4, step: 0.5, default: 2 }],
        legend: [{ color: c.live, label: "Building gradient" }, { color: c.ref, label: "Pulse head" }, { color: c.bad, label: "Breathing points" }],
        assumptions: "Requires NEXT_PUBLIC_AMAP_KEY (browser key with JSAPI + Loca enabled).", needsKey: "amap", libs: [lib.loca, lib.amap], load: () => import("../engines/geo/LocaCity") },
      { id: "flights", title: "National flight links", summary: "LinkLayer arcs from hub cities to the rest with breathing scatter sized by value on the AMap dark style.", controls: [{ key: "hubs", label: "Hub cities", type: "range", min: 1, max: 4, step: 1, default: 2 }, { key: "height", label: "Arc height", type: "range", min: 100, max: 1200, step: 50, default: 500 }],
        legend: [{ color: c.live, label: "Link start" }, { color: c.ref, label: "Link end" }],
        assumptions: "Requires NEXT_PUBLIC_AMAP_KEY.", needsKey: "amap", libs: [lib.loca, lib.amap], load: () => import("../engines/geo/LocaFlights") },
    ],
  },
  {
    id: "l7", domain: "geo", title: "AntV L7", question: "One layer API over any basemap — L7 with its built-in MapLibre engine, no key.", input: "Synthetic points, arcs and city values", output: "Hexbin columns, animated arcs, bubbles, national flights",
    demos: [
      { id: "layers", title: "L7 layer modes", summary: "HeatmapLayer hexbin columns, LineLayer arc3d with animation, PointLayer bubbles, or an animated China flight network — switch modes to compare L7's declarative chain API.", controls: [{ key: "mode", label: "Mode", type: "select", options: [{ value: "hexbin", label: "Hexbin columns" }, { value: "arcs", label: "Animated arcs" }, { value: "bubbles", label: "Bubbles" }, { value: "flights", label: "China flights" }], default: "hexbin" }, { key: "size", label: "Hexagon size", type: "range", min: 100, max: 1200, step: 50, unit: "m", default: 400 }, { key: "animate", label: "Animate bubbles", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Low" }, { color: c.ref, label: "Mid" }, { color: c.bad, label: "High" }],
        assumptions: "Uses @antv/l7-maps `Map` (MapLibre-based) with the Carto style; L7 also targets AMap, Mapbox, Baidu and Tencent basemaps with the same layers.", libs: [lib.l7, lib.maplibre], load: () => import("../engines/geo/L7Layers") },
    ],
  },
  {
    id: "cesium", domain: "geo", title: "CesiumJS", question: "A real globe with orbits and a drone corridor — the digital-twin engine, without an Ion token.", input: "OpenStreetMap imagery, synthetic orbits and flight path", output: "Constellation with ground tracks, corridor wall + geofence check",
    demos: [
      { id: "orbits", title: "Satellite constellation", summary: "A synthetic constellation on circular orbits (analytic propagation, Earth rotation), colored by plane, with fading ground tracks on a Cesium globe.", controls: [{ key: "count", label: "Satellites", type: "range", min: 6, max: 120, step: 6, default: 36 }, { key: "speed", label: "Time scale", type: "range", min: 10, max: 600, step: 10, unit: "×", default: 120 }, { key: "tracks", label: "Ground tracks", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Plane 1" }, { color: c.ref, label: "Plane 2" }, { color: c.ok, label: "Plane 3" }, { color: c.violet, label: "Plane 4" }],
        assumptions: "Kepler circular orbits, not SGP4/TLE; swap in satellite.js for real objects. Imagery from OpenStreetMap tiles.", camera: "Drag to rotate globe · scroll to zoom", libs: [lib.cesium, lib.satellite], load: () => import("../engines/geo/CesiumOrbits") },
      { id: "corridor", title: "Drone corridor + geofence", summary: "A 3D flight path with an altitude wall, a moving UAV and an extruded no-fly polygon; the geofence check runs every frame.", controls: [{ key: "altitude", label: "Base altitude", type: "range", min: 0, max: 400, step: 20, unit: "m", default: 60 }, { key: "speed", label: "Speed", type: "range", min: 0.5, max: 8, step: 0.5, unit: "×", default: 2 }, { key: "wall", label: "Corridor wall", type: "toggle", default: true }],
        legend: [{ color: c.live, label: "Corridor" }, { color: c.ref, label: "UAV" }, { color: c.bad, label: "No-fly zone" }],
        assumptions: "Ellipsoid terrain (no world terrain without an Ion token).", libs: [lib.cesium], load: () => import("../engines/geo/CesiumCorridor") },
    ],
  },
  {
    id: "baidu", domain: "geo", title: "Baidu MapVGL", question: "Baidu Maps GL with MapVGL's WebGL layers — points, heat volumes and fly lines.", input: "Baidu Maps GL + MapVGL (AK required)", output: "Point / heatmap / fly-line layers over a dark Baidu basemap",
    demos: [
      { id: "layers", title: "MapVGL layers", summary: "PointLayer, 3D HeatmapLayer or FlyLineLayer from the same city values on Baidu Maps GL with the dark style.", controls: [{ key: "layer", label: "Layer", type: "select", options: [{ value: "points", label: "Points" }, { value: "heatmap", label: "3D heatmap" }, { value: "flyline", label: "Fly lines" }], default: "flyline" }, { key: "tilt", label: "Tilt", type: "range", min: 0, max: 70, step: 5, unit: "°", default: 45 }],
        legend: [{ color: c.live, label: "Point / line" }, { color: c.ref, label: "Fly-line head" }, { color: c.bad, label: "Heat peak" }],
        assumptions: "Requires NEXT_PUBLIC_BAIDU_KEY; MapVGL loads from unpkg at runtime.", needsKey: "baidu", libs: [lib.mapvgl], load: () => import("../engines/geo/BaiduMapVGL") },
    ],
  },
];
