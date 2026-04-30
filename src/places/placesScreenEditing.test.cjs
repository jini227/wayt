const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const screenPath = path.join(__dirname, "..", "..", "app", "places.tsx");
const source = fs.readFileSync(screenPath, "utf8");

assert(
  source.includes("keyboardAvoiding") && source.includes('keyboardShouldPersistTaps="handled"'),
  "places screen enables keyboard avoidance for inline editing"
);
assert(
  source.includes("editingPlaceKey") && source.includes("savedPlaceRowKey") && !source.includes("editingPlaceId"),
  "places screen tracks which single saved place row instance is being edited"
);
assert(
  source.includes('sectionKey="favorite"') &&
    source.includes('sectionKey="recent"') &&
    source.includes('sectionKey="other"'),
  "duplicate saved places in different sections get distinct row edit keys"
);
assert(
  source.includes("isEditing"),
  "saved place rows render separate read and edit modes"
);
assert(
  source.includes("Pencil") && !source.includes(">수정</Text>"),
  "read mode exposes an icon-only edit action beside the saved place label"
);
assert(
  source.includes("Check") && !source.includes(">저장</Text>") && !source.includes(">취소</Text>"),
  "save and cancel actions are icon-only buttons"
);
assert(
  source.includes("editLine") && !source.includes("editActions"),
  "edit mode keeps the input, cancel button, and save button on one row"
);
assert(
  source.includes("PLACE_ROW_ACTION_BUTTON_SIZE = 34") &&
    source.includes("width: PLACE_ROW_ACTION_BUTTON_SIZE") &&
    source.includes("height: PLACE_ROW_ACTION_BUTTON_SIZE"),
  "edit, cancel, and save buttons share the smaller fixed-size icon button style"
);
assert(
  source.includes("PLACE_ROW_ACTION_ICON_SIZE = 14") &&
    (source.match(/size=\{PLACE_ROW_ACTION_ICON_SIZE\}/g) ?? []).length >= 3,
  "edit, cancel, and save icons use the smaller shared action icon size"
);
assert(
  source.includes("clearLabelDraft") && source.includes("장소 이름 지우기"),
  "edit mode exposes a clear button that removes the whole draft"
);
assert(
  source.includes("savedPlaceLabelUpdateRequest"),
  "places screen saves labels through the shared saved place edit helper"
);
