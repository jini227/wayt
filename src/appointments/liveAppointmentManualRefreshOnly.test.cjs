const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const detailPath = path.join(root, "app", "appointments", "[id].tsx");
const source = fs.readFileSync(detailPath, "utf8");

assert.doesNotMatch(source, /DETAIL_REFRESH_INTERVAL_MS/, "detail screen does not keep a polling interval constant");
assert.doesNotMatch(source, /setInterval\(\(\) => \{[\s\S]*loadAppointment\(\{ silent: true \}\)/, "detail screen does not poll appointment data");
assert.doesNotMatch(source, /clearInterval\(timer\)/, "detail screen has no polling cleanup left behind");
assert.match(source, /refreshing=\{refreshing\}/, "detail screen keeps pull-to-refresh state wired");
assert.match(source, /onRefresh=\{refreshAppointment\}/, "detail screen keeps manual refresh wired");
