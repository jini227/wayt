const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const helperPath = path.join(root, "src", "components", "webDesktopLayout.ts");
const appScreenPath = path.join(root, "src", "components", "AppScreen.tsx");
const bottomTabPath = path.join(root, "src", "components", "BottomTabBar.tsx");
const rootLayoutPath = path.join(root, "app", "_layout.tsx");

assert.equal(fs.existsSync(helperPath), true, "web desktop layout helper exists");

const helperSource = fs.readFileSync(helperPath, "utf8");
const appScreenSource = fs.readFileSync(appScreenPath, "utf8");
const bottomTabSource = fs.readFileSync(bottomTabPath, "utf8");
const rootLayoutSource = fs.readFileSync(rootLayoutPath, "utf8");

assert.match(
  helperSource,
  /Platform\.OS === "web" && width >= DESKTOP_WEB_BREAKPOINT/,
  "desktop web layout is gated to wide web viewports only"
);
assert.match(
  helperSource,
  /export const DESKTOP_WEB_BREAKPOINT = 1024/,
  "desktop web layout starts at the desktop breakpoint"
);
assert.match(
  appScreenSource,
  /isDesktopWebLayout\(width\)/,
  "AppScreen applies desktop layout through the shared web-only helper"
);
assert.match(
  bottomTabSource,
  /isDesktopWebLayout\(width\)/,
  "BottomTabBar applies sidebar layout through the shared web-only helper"
);
assert.match(
  bottomTabSource,
  /desktopWrap/,
  "BottomTabBar has a dedicated desktop sidebar style"
);
assert.match(
  helperSource,
  /shouldShowDesktopSideNav/,
  "desktop side navigation visibility is centralized"
);
const layoutBodyStart = rootLayoutSource.indexOf("<StatusBar");
const mainStackIndex = rootLayoutSource.indexOf("<AppStack />", layoutBodyStart);
const mainSideNavIndex = rootLayoutSource.indexOf("<DesktopSideNavigation />", layoutBodyStart);
assert.ok(mainStackIndex !== -1 && mainSideNavIndex !== -1, "RootLayout renders both the app stack and desktop sidebar");
assert.ok(
  mainStackIndex < mainSideNavIndex,
  "RootLayout renders the global desktop sidebar above the app stack"
);
assert.match(
  rootLayoutSource,
  /<BottomTabBar variant="desktop" \/>/,
  "RootLayout renders one global desktop-only sidebar"
);
assert.match(
  bottomTabSource,
  /variant = "mobile"/,
  "screen-level BottomTabBar defaults to mobile-only rendering"
);
assert.match(
  bottomTabSource,
  /variant === "mobile" && desktopWeb/,
  "screen-level BottomTabBar does not duplicate the global desktop sidebar"
);
