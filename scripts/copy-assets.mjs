// Copies runtime assets (MuJoCo WASM, Cesium static files) into public/vendor before dev/build.
import fs from "node:fs";
import path from "node:path";
const out = "public/vendor";
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync("node_modules/mujoco/mujoco.wasm", path.join(out, "mujoco.wasm"));
fs.copyFileSync("node_modules/mujoco/mujoco.js", path.join(out, "mujoco.js"));
const cesium = "node_modules/cesium/Build/Cesium";
for (const dir of ["Workers", "Assets", "ThirdParty", "Widgets"]) fs.cpSync(path.join(cesium, dir), path.join(out, "cesium", dir), { recursive: true });
console.log("assets copied to", out);
