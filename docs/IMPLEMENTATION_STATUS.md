# Implementation status

## Implemented in this repository

- Platform-first home: six domain filters, text search, 24 scenario records. Each record includes a concrete problem, input, output, real engine, official source link and priority.
- Four native labs with independent, relevant calculations/rendering:
  - `/labs/braking`: deterministic one-dimensional braking, two delay configurations, seekable replay, stopping distance, impact speed, JSON export.
  - `/labs/robot`: planar two-link forward and inverse kinematics, editable joints and target, reachability and endpoint error, JSON export. This is not a URDF dynamics simulator.
  - `/labs/physics`: actual Rapier WASM rigid-body stepping at 1/60 s, configurable gravity/restitution/drop height, restart and state export.
  - `/labs/model`: Three.js GLTFLoader reads a local self-contained GLB, shows mesh/node information, authored bounding dimensions, first animation or turntable, wireframe. Files stay local; size is limited to 30 MB; external assets and extra compression decoders are not supported.
- Lazy-loaded engine bundle, pointer and keyboard camera controls, explicit play/pause, context-loss/error paths and resource cleanup.
- Methodology page distinguishes visualization, computation, physics simulation and recorded playback.
- Existing 11 project URLs retained; `/examples` provides access to earlier map studies.
- No personal introduction, employer attribution, contact details or personal profile links in the new platform.

## Research references; not yet integrated

Rerun/MCAP sensor playback, calibration workflows, CARLA jobs, LeRobot episode tools, full URDF import/control, MuJoCo/Isaac/Gazebo jobs, ROS live bridge, Cosmos generation, VI-WorldSim, licensed car models, Spark/SuperSplat, Cesium/SUMO, Phoenix traces, Netron, UMAP data explorer, OpenLineage, existing external finance/supply-chain/anatomy applications, VTK scientific data.

An official demo/reference link does not constitute platform integration. The existing external domain projects have not been migrated in this change. No third-party production achievement is claimed as platform performance.

## Validation scope

- Production Next.js build and TypeScript check.
- Unit-level analytical checks for braking, collision speed, FK/IK, reachability and GLB signatures.
- Rapier runtime check for contact/settling and different restitution responses, using the installed real WASM engine.
- Source privacy and retained route checks.
- The Rapier regression fixture drops a radius-0.35 m ball from a 4 m center height: restitution 0 settles near 0.35 m, and restitution 0.8 produces a first post-contact peak near 2.697 m. This is a test of the simplified engine setup, not measured material performance.
- No browser, GPU pixel output, device interaction, real ROS hardware, commercial simulator or external model/data integration was tested in this turn.

## Remaining before a production launch

Browser/device visual and interaction tests, approved sample assets, asset-import edge cases and large-file resource budgets, MCAP parsing/seek, data provenance and source-specific license review, server-side storage/permissions/jobs, representative performance measurements, and user-task validation described in the plan.
