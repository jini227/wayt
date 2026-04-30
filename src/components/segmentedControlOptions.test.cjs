const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

function requireTs(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    }
  }).outputText;
  const module = { exports: {} };
  const dirname = path.dirname(filePath);

  function localRequire(id) {
    if (id.startsWith(".")) {
      const resolved = path.resolve(dirname, id.endsWith(".ts") ? id : `${id}.ts`);
      return requireTs(resolved);
    }
    return require(id);
  }

  new Function("require", "module", "exports", "__filename", "__dirname", output)(
    localRequire,
    module,
    module.exports,
    filePath,
    dirname
  );

  return module.exports;
}

const { withCountLabels } = requireTs(path.join(__dirname, "segmentedControlOptions.ts"));

test("appends counts to matching segment labels", () => {
  assert.deepEqual(withCountLabels(["전체", "오늘"], [3, 1]), ["전체 3", "오늘 1"]);
});

test("leaves labels without finite counts unchanged", () => {
  assert.deepEqual(withCountLabels(["전체", "오늘"], [3, Number.NaN]), ["전체 3", "오늘"]);
});
