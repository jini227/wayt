const { readFileSync } = require("node:fs") as typeof import("node:fs");
const { resolve } = require("node:path") as typeof import("node:path");

const source = readFileSync(resolve(process.cwd(), "app/appointments/new.tsx"), "utf8");

function styleBlock(styleName: string) {
  const match = source.match(new RegExp(`\\n  ${styleName}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!match) {
    throw new Error(`missing ${styleName} style`);
  }
  return match[1];
}

function numericStyleValue(styleName: string, propertyName: string) {
  const match = styleBlock(styleName).match(new RegExp(`\\n    ${propertyName}: (\\d+),?`));
  if (!match) {
    throw new Error(`missing ${propertyName} on ${styleName}`);
  }
  return Number(match[1]);
}

const searchInputHeight = numericStyleValue("mapSearchBox", "minHeight");
const savedPlacesHeight = numericStyleValue("mapSearchSavedPlacesButton", "height");

if (!source.includes("buttonStyle={styles.mapSearchSavedPlacesButton}")) {
  throw new Error("expanded map saved places picker should apply the compact height to the actual button");
}

if (savedPlacesHeight !== searchInputHeight) {
  throw new Error(
    `expanded map saved places button height should match search input height: expected ${searchInputHeight}, got ${savedPlacesHeight}`
  );
}
