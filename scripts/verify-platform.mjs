// Structural checks for the catalog, lab registry and privacy constraints.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const load = (file) => {
  const src = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function("module", "exports", "require", outputText)(module, module.exports, () => ({}));
  return module.exports;
};

const { scenes, domains, labs } = load("app/catalog/data.ts");
const { labDefs } = load("app/labs/registry.ts");

// Catalog integrity
const ids = new Set();
for (const s of scenes) {
  assert.ok(!ids.has(s.id), `duplicate scene id ${s.id}`);
  ids.add(s.id);
  assert.ok(domains.some((d) => d.id === s.domain), `unknown domain for ${s.id}`);
  assert.match(s.source, /^https:\/\//, `non-https source for ${s.id}`);
  assert.ok(["lab", "engine", "planned"].includes(s.status));
  assert.ok(s.problem.length > 40 && s.input && s.output, `incomplete record ${s.id}`);
}
for (const d of domains) assert.ok(scenes.filter((s) => s.domain === d.id).length >= 4, `domain ${d.id} has too few scenes`);

// Every native lab has a registry entry and an engine file
for (const s of labs) {
  const def = labDefs.find((l) => l.id === s.lab);
  assert.ok(def, `missing registry entry for ${s.lab}`);
  assert.ok(def.controls.length >= 2 && def.legend.length >= 1 && def.assumptions.length > 60);
  const src = fs.readFileSync("app/labs/registry.ts", "utf8");
  const m = src.match(new RegExp(`id: "${s.lab}"[\\s\\S]*?import\\("./engines/(\\w+)"\\)`));
  assert.ok(m && fs.existsSync(path.join("app/labs/engines", `${m[1]}.tsx`)), `engine file missing for ${s.lab}`);
}
assert.equal(labDefs.length, labs.length, "registry and catalog lab counts differ");

// Privacy: no personal attribution or credentials anywhere in app/ or docs/
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
for (const file of [...walk("app"), ...walk("docs"), "README.md"]) {
  const text = fs.readFileSync(file, "utf8");
  assert.ok(!/mailto:|linkedin\.com|wechat|微信|DiDi|Alibaba|\bNIO\b|Tesla|resume|curriculum vitae/i.test(text), `personal attribution found in ${file}`);
  assert.ok(!/gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(text), `credential found in ${file}`);
}
console.log(`Passed: ${scenes.length} scenes, ${domains.length} domains, ${labs.length} native labs, privacy scan.`);
