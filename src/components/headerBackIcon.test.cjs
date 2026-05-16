const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const cardsPath = path.join(root, "src", "components", "Cards.tsx");
const source = fs.readFileSync(cardsPath, "utf8");

const headerStart = source.indexOf("export function Header");
const chevronCardStart = source.indexOf("export function ChevronCard");
const headerSource = source.slice(headerStart, chevronCardStart);

assert.match(source, /import \{[^}]*ChevronLeft[^}]*ChevronRight[^}]*\} from "lucide-react-native"/s, "Cards imports direct left and right chevrons");
assert.match(headerSource, /<ChevronLeft\b/, "Header back button renders a direct left chevron");
assert.doesNotMatch(headerSource, /<ChevronRight\b/, "Header back button does not reuse the right chevron");
assert.doesNotMatch(headerSource, /rotate:\s*"180deg"/, "Header back button does not rotate the icon");
