import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
const source = fs.readFileSync("app/lib/particle-fields.ts", "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const sandbox = { exports: {} };
vm.runInNewContext(outputText, sandbox);
for (const mode of ["field", "lidar", "network"])
  for (const count of [6400, 14400]) {
    const points = sandbox.exports.particleField(mode, count);
    assert.equal(points.length, count * 3);
    assert.ok(
      Array.from(points).every((n) => Number.isFinite(n) && Math.abs(n) < 20),
    );
    assert.deepEqual(points, sandbox.exports.particleField(mode, count));
  }
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
for (const file of walk("app")) {
  const text = fs.readFileSync(file, "utf8");
  assert.ok(
    !/ziv|callmedanieldaniel|mailto:|DiDi|Alibaba|\bNIO\b/i.test(text),
    `Personal attribution found in ${file}`,
  );
  assert.ok(
    !/gh[pousr]_[A-Za-z0-9]{20,}|(?:AMAP_KEY|BAIDU_KEY)\s*=\s*["'][A-Za-z0-9]{20,}["']/.test(
      text,
    ),
    `Embedded credential found in ${file}`,
  );
}
const data = fs.readFileSync("app/projects/data.ts", "utf8");
assert.equal(
  (data.match(/    slug:/g) || []).length,
  11,
  "Keep every original project route",
);
assert.ok(
  !/org: "[^"\n]*(?:19|20)\d{2}/.test(data),
  "Employment dates must be removed",
);
console.log(
  "Passed: six deterministic geometry fixtures, eleven preserved project routes, source privacy checks.",
);
