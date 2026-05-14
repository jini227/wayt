process.env.TS_NODE_SKIP_PROJECT = "true";
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "CommonJS",
  moduleResolution: "Node",
  jsx: "react-jsx"
});

require("ts-node/register/transpile-only");

const assert = require("node:assert/strict");
const Module = require("module");

const originalLoad = Module._load;

function Icon() {
  return null;
}

Module._load = function loadWithTravelModeGridStubs(request, parent, isMain) {
  if (request === "react-native") {
    return {
      Pressable: "Pressable",
      StyleSheet: { create: (styles) => styles },
      Text: "Text",
      View: "View"
    };
  }

  if (request === "lucide-react-native") {
    return new Proxy({}, { get: () => Icon });
  }

  return originalLoad.apply(this, arguments);
};

const { colors } = require("../theme.ts");
const { TravelModeChoiceGrid } = require("./TravelModeChoiceGrid.tsx");

const grid = TravelModeChoiceGrid({
  selected: null,
  onSelect: () => undefined,
  includeSkip: true,
  onSkip: () => undefined
});

const choices = collectElements(grid, "Pressable");

assert.equal(choices.length, 5, "renders four travel modes and the skip choice");
assert.deepEqual(
  choices.slice(0, 4).map((choice) => hasActiveBackground(choice)),
  [false, false, false, false],
  "no travel mode is highlighted when the saved default is empty"
);
assert.equal(hasActiveBackground(choices[4]), true, "the skip choice is highlighted when the saved default is empty");
assert.deepEqual(
  choices.slice(0, 4).map((choice) => styleValue(choice, "flexBasis")),
  ["47%", "47%", "47%", "47%"],
  "travel mode choices use the same two-column basis regardless of label length"
);
assert.deepEqual(
  choices.slice(0, 4).map((choice) => styleValue(choice, "minWidth")),
  [0, 0, 0, 0],
  "travel mode choices can shrink from their text content instead of growing unevenly"
);

function hasActiveBackground(node) {
  return styleItems(node).some((style) => style?.backgroundColor === colors.primarySoft);
}

function styleValue(node, key) {
  return styleItems(node).find((style) => Object.prototype.hasOwnProperty.call(style, key))?.[key];
}

function styleItems(node) {
  const style = typeof node.props.style === "function" ? node.props.style({ pressed: false }) : node.props.style;
  return [style].flat(Number.POSITIVE_INFINITY).filter(Boolean);
}

function collectElements(node, type) {
  if (!isElement(node)) {
    return Array.isArray(node) ? node.flatMap((child) => collectElements(child, type)) : [];
  }

  return [
    ...(node.type === type ? [node] : []),
    ...collectElements(node.props?.children, type)
  ];
}

function isElement(value) {
  return value !== null && typeof value === "object" && "type" in value && "props" in value;
}
