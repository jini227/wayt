const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");

const homeSource = fs.readFileSync(path.join(root, "app", "index.tsx"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "app", "profile.tsx"), "utf8");
const detailSource = fs.readFileSync(path.join(root, "app", "appointments", "[id].tsx"), "utf8");
const bottomTabSource = fs.readFileSync(path.join(root, "src", "components", "BottomTabBar.tsx"), "utf8");

assert.match(homeSource, /desktopAside=\{/, "home screen passes a desktop-only aside into AppScreen");
assert.match(profileSource, /desktopAside=\{/, "profile screen passes a desktop-only aside into AppScreen");
assert.match(detailSource, /desktopAside=\{/, "appointment detail passes a desktop-only aside into AppScreen");
assert.match(homeSource, /isDesktopWebLayout\(width\)/, "home hides mobile floating actions on desktop web");
assert.match(detailSource, /desktopSummaryCard/, "appointment detail defines a desktop summary card");
assert.match(bottomTabSource, /Image/, "desktop side navigation renders the Wayt logo image");
assert.match(bottomTabSource, /require\("\.\.\/\.\.\/assets\/wayt-icon\.png"\)/, "desktop side navigation uses the Wayt app logo asset");
assert.match(bottomTabSource, /onPress=\{\(\) => handleTabPress\("\/"\)\}/, "desktop side navigation brand navigates home");
