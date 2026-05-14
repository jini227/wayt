const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const screenPath = path.join(__dirname, "..", "..", "app", "profile.tsx");
const source = fs.readFileSync(screenPath, "utf8");

function styleBlock(styleName) {
  const match = source.match(new RegExp(`\\n  ${styleName}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!match) {
    throw new Error(`missing ${styleName} style`);
  }
  return match[1];
}

const squareActionButton = styleBlock("squareActionButton");

assert(
  source.includes("<Check") && source.includes("<Trash2"),
  "profile actions render icon-only save and delete affordances"
);
assert(
  squareActionButton.includes("width: 48") && squareActionButton.includes("height: 44"),
  "profile icon action buttons keep a fixed touch target"
);
assert(
  !squareActionButton.includes("flex: 0"),
  "profile icon action buttons must not use flex: 0 because it collapses them on web"
);
assert(
  squareActionButton.includes("flexShrink: 0"),
  "profile icon action buttons opt out of row shrinking without overriding their width"
);
