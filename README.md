# OMNIVIS — Visualize everything

An open visualization platform: **12 domains · 37 scenes · 89 interactive demos**, every one running inside this site in the browser. Nothing redirects to a third-party demo; every demo names the open-source libraries and engines it is built on.

Domains: autonomous driving · triage · map engines · embodied AI · simulation & world models · annotation · data loop · 3D & neural rendering · AI systems · markets · science · industry.

## Routes

```
/                        home: domains, featured demos, method
/<domain>                domain index (scenes with their demos)
/<domain>/<scene>        scene page; ?demo=<id> selects one of ≤ 3 demos
/stack  /methodology     how it is built, what it does and does not claim
```

Examples: `/driving/log-replay?demo=mcap`, `/embodied/mujoco?demo=humanoid`, `/geo/cesium?demo=orbits`, `/annotation/lidar-cuboid`.

## Highlights

| Domain | Scenes | Real engines used |
| --- | --- | --- |
| Driving | perception, planning & prediction, log replay (MCAP), calibration, HD map (OpenDRIVE) | Three.js, @mcap/core (writes and reads real MCAP), OpenDRIVE reader |
| Triage | event mining, review workbench, log sim (counterfactual), fleet dashboard | Canvas, Three.js, deck.gl HexagonLayer on MapLibre |
| Geo | deck.gl, MapLibre, Mapbox, AMap Loca, AntV L7, CesiumJS, Baidu MapVGL | deck.gl 9, maplibre-gl, mapbox-gl (key), AMap JSAPI/Loca (key), @antv/l7, cesium (OSM imagery, no Ion token), MapVGL (key) |
| Embodied | episode review, MuJoCo in the browser, URDF inspector, kinematics, policy monitor | MuJoCo WASM (official DeepMind bindings), urdf-loader, Three.js |
| Simulation | scenario editor & sweep, physics, traffic, world model | Rapier WASM, IDM/MOBIL traffic, DC-flow style solvers |
| Annotation | LiDAR cuboids, tracking, image tools, QC & export | Three.js TransformControls, canvas tools, KITTI / nuScenes export |
| Data loop, 3D, AI, Markets, Science, Industry | pipeline, dataset stats, training runs · glTF + Gaussian splats · attention, embeddings, agent trace · LOB, IV surface, liquidation map · Lorenz, wave field · power flow, supply chain | Three.js shaders, GLTFLoader, canvas |

## Run

```bash
npm install
npm run dev      # copies MuJoCo / Cesium runtime assets into public/vendor, then starts Next.js
npm run build && npm start
node scripts/verify-platform.mjs   # registry integrity + privacy scan
```

Optional map provider keys (demos without them show a configuration note instead of failing):

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.…   # Mapbox Standard style, globe
NEXT_PUBLIC_AMAP_KEY=…          # AMap JSAPI 2.0 + Loca
NEXT_PUBLIC_BAIDU_KEY=…         # Baidu Maps GL + MapVGL
```

Everything else (deck.gl, MapLibre, L7, Cesium with OpenStreetMap imagery, MuJoCo, Rapier, MCAP) runs without keys.

## Architecture

- `app/scenes/types.ts` — `SceneDef` / `DemoDef` / `EngineProps` and the library catalog used for "Built with" credits.
- `app/scenes/domains/*.ts` — per-domain registries (controls, legend, assumptions, libs, lazy `load()` of the engine).
- `app/scenes/engines/<domain>/*.tsx` — one component per demo.
- `app/scenes/kit/*` — shared helpers: Three.js stage, canvas plots, synthetic city / point clouds / fleet logs, MCAP writer/reader, OpenDRIVE parser, MapLibre + deck.gl overlay, MuJoCo bridge, URDF loader, Cesium loader.
- `app/scenes/SceneShell.tsx` — demo tabs, transport, controls, telemetry, export, key gating, Built-with panel.
- `scripts/copy-assets.mjs` — copies `mujoco.js/.wasm` and Cesium's static files to `public/vendor` (gitignored) before dev/build; both are loaded at runtime to keep them out of the bundle.

## Boundaries

Synthetic data is labelled as such in every demo's assumptions. Third-party engines are credited, not claimed. See `/methodology` and `docs/ROADMAP.md`.
