# Roadmap

Done (v2): per-domain sub-routes, ≤ 3 demos per scene, Built-with credits on every demo, 89 demos across 12 domains, no external redirects, legacy routes removed.

Next
- Log replay: protobuf / ROS 2 CDR decoding for uploaded MCAP (currently json channels only); Foxglove schema decoding for PointCloud and CompressedImage.
- HD map: OpenDRIVE spirals, polynomial lane widths, junction connecting roads; Lanelet2 import.
- MuJoCo: MuJoCo Menagerie models (needs mesh loading through the WASM virtual FS), a learned balance policy for the humanoid.
- URDF: mesh resolution for `package://` paths via a user-supplied folder.
- Geo: Mapbox Standard 3D buildings interaction, Cesium 3D Tiles with a user Ion token, real satellite TLEs via satellite.js.
- Annotation: SAM-style model-assisted segmentation in the browser (ONNX Runtime Web).
- Triage: import real event CSVs; persist review decisions locally.
- 3D: real Gaussian-splat file loading (.ply / .splat), Draco/KTX2 for glTF.
