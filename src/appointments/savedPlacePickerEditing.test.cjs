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
  !source.includes("apiPatchAuthenticated"),
  "new appointment screen does not patch saved place labels from the picker"
);
assert(
  !source.includes("savedPlaceLabelUpdateRequest"),
  "saved place picker does not own label edit request logic"
);
assert(
  !source.includes("const handleRenameSavedPlace"),
  "new appointment screen does not own saved place rename persistence"
);
assert(
  source.includes("onManageSavedPlaces"),
  "saved place picker exposes a manage action for the dedicated places screen"
);
assert(
  source.includes("height: 480") && source.includes("favoriteModalSheet"),
  "saved place modal keeps a fixed sheet height across tabs"
);
assert(
  source.includes("favoritePlaceList: {\n    flex: 1"),
  "saved place list scrolls inside the fixed-height sheet"
);
assert(
  source.includes("showsVerticalScrollIndicator"),
  "saved place list leaves the scroll indicator available"
);
assert(
  !source.includes("MoreHorizontal"),
  "saved place rows do not expose an overflow menu"
);
assert(
  !source.includes("editingPlace"),
  "saved place picker does not open an edit modal"
);
