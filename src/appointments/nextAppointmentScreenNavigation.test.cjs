const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const source = fs.readFileSync(path.join(root, "app", "appointments", "next.tsx"), "utf8");

assert.match(
  source,
  /router\.push\(\{\s*pathname:\s*"\/appointments\/\[id\]"[\s\S]*params:\s*\{\s*id:\s*viewModel\.id,\s*fromTab:\s*"next"\s*\}/,
  "next appointment detail navigation preserves the next tab context"
);
