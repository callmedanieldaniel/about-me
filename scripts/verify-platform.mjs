// Structural checks for the scene registry and privacy constraints. Run: node scripts/verify-platform.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const cache = new Map();
const load = (file) => {
  const abs = path.resolve(file);
  if (cache.has(abs)) return cache.get(abs);
  const src = fs.readFileSync(abs, "utf8");
  const { outputText } = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  const req = (spec) => { if (spec.startsWith(".")) { const base = path.resolve(path.dirname(abs), spec); const cand = [base + ".ts", base + ".tsx", path.join(base, "index.ts")].find((f) => fs.existsSync(f)); if (cand) return load(cand); } return {}; };
  new Function("module", "exports", "require", outputText)(module, module.exports, req);
  cache.set(abs, module.exports);
  return module.exports;
};

const { scenes } = load("app/scenes/registry.ts");
const { domains } = load("app/scenes/domains.ts");

const ids = new Set();
let demoCount = 0;
for (const s of scenes) {
  assert.ok(!ids.has(s.id), `duplicate scene id ${s.id}`); ids.add(s.id);
  assert.ok(domains.some((d) => d.id === s.domain), `unknown domain for ${s.id}`);
  assert.ok(s.demos.length >= 1 && s.demos.length <= 3, `${s.id} must have 1–3 demos`);
  assert.ok(s.question.length > 30 && s.input && s.output, `incomplete scene ${s.id}`);
  const dids = new Set();
  for (const d of s.demos) {
    demoCount++;
    assert.ok(!dids.has(d.id), `duplicate demo id ${s.id}/${d.id}`); dids.add(d.id);
    assert.ok(d.libs.length >= 1, `${s.id}/${d.id} credits no library`);
    for (const l of d.libs) assert.match(l.url, /^https:\/\//, `non-https lib url in ${s.id}/${d.id}`);
    assert.ok(d.summary.length > 40 && d.assumptions.length > 20, `${s.id}/${d.id} needs summary and assumptions`);
    const keys = new Set(); for (const c of d.controls) { assert.ok(!keys.has(c.key), `duplicate control ${c.key} in ${s.id}/${d.id}`); keys.add(c.key); }
    assert.equal(typeof d.load, "function");
  }
}
for (const d of domains) assert.ok(scenes.some((s) => s.domain === d.id), `domain ${d.id} has no scenes`);

// Every engine referenced by a load() must exist on disk.
const domainFiles = fs.readdirSync("app/scenes/domains").map((f) => path.join("app/scenes/domains", f));
for (const f of domainFiles) { const src = fs.readFileSync(f, "utf8"); for (const m of src.matchAll(/import\("\.\.\/engines\/([^"]+)"\)/g)) assert.ok(fs.existsSync(path.join("app/scenes/engines", m[1] + ".tsx")), `missing engine ${m[1]}`); }

// Privacy scan: no personal identifiers, emails, phone numbers or Chinese personal profile text in app/, docs/, README.
const banned = [/@gmail\.com/i, /@qq\.com/i, /\b1[3-9]\d{9}\b/, /linkedin\.com\/in\//i, /resume/i, /简历/, /wechat/i, /微信/];
const walk = (dir, out = []) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (!["node_modules", ".next", "vendor", ".git"].includes(e.name)) walk(p, out); } else if (/\.(tsx?|md|json|css)$/.test(e.name)) out.push(p); } return out; };
for (const f of [...walk("app"), ...walk("docs"), "README.md"]) { const txt = fs.readFileSync(f, "utf8"); for (const re of banned) assert.ok(!re.test(txt), `privacy: ${re} matched in ${f}`); }

// No legacy routes remain.
for (const legacy of ["app/labs", "app/examples", "app/projects", "app/demos", "app/catalog"]) assert.ok(!fs.existsSync(legacy), `legacy route ${legacy} still exists`);

console.log(`ok · ${domains.length} domains · ${scenes.length} scenes · ${demoCount} demos · privacy scan clean`);
