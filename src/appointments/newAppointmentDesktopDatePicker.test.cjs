const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const screenPath = path.join(__dirname, "..", "..", "app", "appointments", "new.tsx");
const source = fs.readFileSync(screenPath, "utf8");

assert(
  source.includes("useWindowDimensions") && source.includes("isDesktopWebLayout"),
  "new appointment screen detects desktop web width for modal layout"
);
assert(
  source.includes("desktopWeb={desktopWeb}"),
  "new appointment screen passes desktop web state into the picker modal"
);
assert(
  source.includes("desktopWeb ? styles.desktopModalOverlay : null") &&
    source.includes("desktopWeb ? styles.desktopModalSheet : null"),
  "picker modal uses constrained desktop overlay and sheet styles"
);
assert(
  source.includes("desktopWeb={desktopWeb}") &&
    source.includes("desktopWeb ? styles.desktopDayCell : null"),
  "calendar day cells avoid viewport-sized squares on desktop web"
);

const desktopSheetStart = source.indexOf("desktopModalSheet:");
const desktopSheetEnd = source.indexOf("modalHeader:", desktopSheetStart);
const desktopSheetBlock = source.slice(desktopSheetStart, desktopSheetEnd);

assert(desktopSheetStart !== -1, "desktop modal sheet style exists");
assert(
  desktopSheetBlock.includes("width: 440") && desktopSheetBlock.includes("alignSelf: \"center\""),
  "desktop date picker sheet is a centered fixed-width card"
);
assert(
  desktopSheetBlock.includes("translateX: 260"),
  "desktop picker sheet is shifted right toward the settings value area"
);

const desktopDayCellStart = source.indexOf("desktopDayCell:");
const desktopDayCellEnd = source.indexOf("dayInner:", desktopDayCellStart);
const desktopDayCellBlock = source.slice(desktopDayCellStart, desktopDayCellEnd);

assert(desktopDayCellStart !== -1, "desktop day cell style exists");
assert(
  desktopDayCellBlock.includes("height: 44") && desktopDayCellBlock.includes("aspectRatio: undefined"),
  "desktop day cells use fixed height instead of stretching with viewport width"
);
