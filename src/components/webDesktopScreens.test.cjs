const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");

const homeSource = fs.readFileSync(path.join(root, "app", "index.tsx"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "app", "profile.tsx"), "utf8");
const detailSource = fs.readFileSync(path.join(root, "app", "appointments", "[id].tsx"), "utf8");

assert.match(homeSource, /desktopAside=\{/, "home screen passes a desktop-only aside into AppScreen");
assert.match(profileSource, /desktopAside=\{/, "profile screen passes a desktop-only aside into AppScreen");
assert.match(detailSource, /desktopAside=\{/, "appointment detail passes a desktop-only aside into AppScreen");
assert.match(homeSource, /isDesktopWebLayout\(width\)/, "home hides mobile floating actions on desktop web");
assert.match(detailSource, /desktopSummaryCard/, "appointment detail defines a desktop summary card");
