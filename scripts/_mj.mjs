import loadMujoco from "mujoco";
import fs from "fs"; import ts from "typescript";
const src = fs.readFileSync("app/scenes/kit/mjcf/humanoid.ts","utf8");
const js = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
fs.writeFileSync("/tmp/mjcf.mjs", js);
const m = await import("/tmp/mjcf.mjs");
const mujoco = await loadMujoco();
for (const [name, xml] of [["humanoid", m.HUMANOID_XML], ["arm", m.ARM_XML], ["drop", m.DROP_XML(0.8, 0.2, 0.3)]]) {
  try {
    try { mujoco.FS.mkdir("/working"); } catch {}
    mujoco.FS.writeFile(`/working/${name}.xml`, xml);
    const model = mujoco.MjModel.mj_loadXML(`/working/${name}.xml`);
    const data = new mujoco.MjData(model);
    for (let i = 0; i < 200; i++) mujoco.mj_step(model, data);
    console.log(name, "ngeom", model.ngeom, "nu", model.nu, "nq", model.nq, "xpos type", data.geom_xpos?.constructor?.name, "len", data.geom_xpos?.length, "geom_type", Array.from(model.geom_type).slice(0,6), "size", Array.from(model.geom_size).slice(0,6), "rgba", model.geom_rgba?.length, "ctrl", data.ctrl?.length, "contacts", data.ncon);
    model.delete(); data.delete();
  } catch (e) { console.log(name, "ERR", e.message ?? e); }
}
