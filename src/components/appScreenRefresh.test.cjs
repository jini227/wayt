const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const appScreenPath = path.join(root, "src", "components", "AppScreen.tsx");
const source = fs.readFileSync(appScreenPath, "utf8");

assert.match(source, /RefreshControl/, "AppScreen imports and uses React Native RefreshControl");
assert.match(source, /refreshing\?: boolean/, "AppScreen accepts a refreshing prop");
assert.match(source, /onRefresh\?: \(\) => void/, "AppScreen accepts an onRefresh prop");
assert.match(source, /onPullDownDismiss\?: \(\) => void/, "AppScreen accepts a pull-down dismiss prop");
assert.match(source, /refreshControl=\{[\s\S]*<RefreshControl/, "AppScreen wires RefreshControl into ScrollView");
assert.match(source, /onRefresh \?/, "AppScreen only creates RefreshControl when a refresh callback exists");
assert.match(source, /PanResponder\.create/, "AppScreen creates a pan responder for pull-down dismissal");
assert.match(source, /shouldStartDownwardDismissDrag/, "AppScreen uses the shared downward-dismiss start threshold");
assert.match(source, /shouldCompleteDownwardDismissDrag/, "AppScreen uses the shared downward-dismiss completion threshold");
assert.match(source, /onRefresh \?\s*\(\s*onPullDownDismiss \? undefined :/, "AppScreen disables pull-to-refresh when pull-down dismiss is active");
