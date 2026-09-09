# Platform plan and roadmap

## Architecture

Four layers, one contract. Native labs implement every layer in the browser; heavy engines replace the compute layer with a job and stream results back as MCAP into the same data layer.

```
browser (local, no account)                    optional services
┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐   ┌─────────────┐
│  Data  │→ │ Compute │→ │ Render │→ │ Evidence │   │ CARLA/Isaac │
│ params │  │ planner │  │ Three  │  │ telemetry│ ← │ SUMO/Cosmos │
│ GLB    │  │ physics │  │ canvas │  │ export   │   │ results as  │
│ MCAP   │  │ LOB/attn│  │ deck.gl│  │ assump.  │   │ MCAP        │
└────────┘  └─────────┘  └────────┘  └──────────┘   └─────────────┘
```

### Engine contract

```ts
type EngineProps = {
  params: Record<string, number | boolean | string>;
  playing: boolean;
  resetKey: number;
  asset: ArrayBuffer | null;
  onTelemetry: (t: Record<string, string | number>) => void;
};
```

A lab is a registry entry (`app/labs/registry.ts`: controls, legend, assumptions, camera hint, dynamic import) plus one engine component in `app/labs/engines/`. `LabShell` owns transport, parameters, export and layout. Engines own their WebGL context and dispose it on unmount.

### Data contracts (planned)

| Contract | Format | Used by |
| --- | --- | --- |
| Sensor logs | MCAP (ROS 2 / Protobuf schemas) | ROS replay, calibration, scenario regression |
| Robot episodes | LeRobot v2 parquet + mp4 | Teleop review, RL monitor |
| Scenes | glTF 2.0, OpenUSD, .spz splats, 3D Tiles | Model viewer, splats, twins, cities |
| Tables | Apache Arrow / Parquet | Geospatial layers, embeddings, training runs |
| Market data | Columnar ticks + order events | Order book, liquidation maps, IV surfaces |
| Runs | JSON (params, telemetry, assumptions) | Every lab today |

## Delivery phases

### Phase 0 — shipped
- 10 native labs across driving, robotics, simulation, 3D, AI and markets.
- Catalog of 46 scenes with status, inputs, outputs and engine links.
- Method page, stack page, JSON export, keyboard transport, reduced-motion support.

### Phase 1 — data in (4–6 weeks)
- MCAP reader in a Web Worker; timeline scrubber; point cloud + image + TF panels (ROS replay).
- Calibration overlay: project LiDAR into camera with editable extrinsics; residual heatmap.
- LeRobot episode player from local parquet/mp4.
- Shareable run URLs (parameters encoded in the query string).

### Phase 2 — render at scale (4–6 weeks)
- WebGPU renderer path with TSL; native Gaussian splat mesh; Spark 2.0 for streamed captures.
- deck.gl + MapLibre layer host; CesiumJS globe host for city, orbit and corridor scenes.
- Occupancy voxel viewer with semantic legend and time scrub.

### Phase 3 — engines as jobs (6–8 weeks)
- Job runner interface (submit scenario → poll → MCAP result) for CARLA, SUMO and Isaac Sim.
- World-model rollout grid: generated vs recorded, divergence metrics, action-faithfulness score.
- RL training monitor fed by run logs.

### Phase 4 — evidence and comparison (ongoing)
- Side-by-side run diff for any lab.
- Bookmarks and clips on timelines.
- Provenance labels (synthetic / generated / recorded, license) on every input.

## Acceptance gates

- Build passes with TypeScript strict; `node scripts/verify.mjs && node scripts/verify-platform.mjs` pass.
- Every lab renders on a 380 px wide viewport and on a 1440 px desktop.
- No engine leaks a WebGL context on route change (checked with `renderer.info` in dev).
- No personal attribution, contact details or credentials in `app/`, `docs/` or `README.md`.
- Every catalog entry has a working primary source link and a status that matches reality.

## Explicit non-claims

Linking to an engine is not integration. Rendering is not validation. Synthetic scenes teach mechanisms; they do not certify safety, clinical accuracy or financial return.
