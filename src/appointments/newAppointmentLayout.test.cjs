const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const screenPath = path.join(__dirname, "..", "..", "app", "appointments", "new.tsx");
const source = fs.readFileSync(screenPath, "utf8");

const headerStart = source.indexOf("<View style={styles.placeHeaderRow}>");
const pickerStart = source.indexOf("<PlacePicker", headerStart);
const headerBlock = source.slice(headerStart, pickerStart);

assert(headerStart !== -1, "meeting place section uses a dedicated title/action header row");
assert(
  headerBlock.includes("<SavedPlacePicker"),
  "saved place picker is rendered in the meeting place header row"
);

const placePickerFunctionStart = source.indexOf("function PlacePicker");
const mapWrapStart = source.indexOf("<View style={styles.mapWrap}>", placePickerFunctionStart);
const placePickerTopBlock = source.slice(placePickerFunctionStart, mapWrapStart);

assert(
  !placePickerTopBlock.includes("<SavedPlacePicker"),
  "saved place picker is not rendered as a separate row above the map"
);

const fullMapHeaderStart = source.indexOf("<View style={styles.fullMapHeader}>", placePickerFunctionStart);
const fullMapBodyStart = source.indexOf("<View style={styles.fullMapBody}>", fullMapHeaderStart);
const fullMapHeaderBlock = source.slice(fullMapHeaderStart, fullMapBodyStart);

assert(
  !fullMapHeaderBlock.includes("<SavedPlacePicker"),
  "full-screen map header keeps saved place picker away from the done action"
);

const fullMapRenderSurfaceStart = source.indexOf("renderSurface(", fullMapBodyStart);
const fullMapRenderSurfaceEnd = source.indexOf("</View>", fullMapRenderSurfaceStart);
const fullMapSurfaceBlock = source.slice(fullMapRenderSurfaceStart, fullMapRenderSurfaceEnd);

assert(
  fullMapSurfaceBlock.includes("<SavedPlacePicker"),
  "full-screen map passes saved place picker into the search row"
);
assert(
  !fullMapSurfaceBlock.includes("<SaveSelectedPlaceButton"),
  "full-screen map search row does not include the favorite star"
);
assert(
  source.includes("<View style={styles.fullMapSavePlaceControl}>") &&
    source.includes("style={styles.fullMapSavePlaceButton}"),
  "full-screen map floats the favorite star above the current-location button"
);
assert(
  source.includes("currentLocationButtonStyle: styles.fullMapCurrentLocationButton"),
  "full-screen map uses a larger, inset current-location button"
);
assert(
  source.includes("currentLocationIconSize: 26"),
  "full-screen map uses a larger current-location icon"
);

const searchRowStart = source.indexOf("<View style={styles.mapSearchRow}>");
const searchBoxStart = source.indexOf("<View style={styles.mapSearchBox}>", searchRowStart);
const searchBoxEnd = source.indexOf("</View>", searchBoxStart);
const searchAccessoryStart = source.indexOf("{searchAccessory ? <View", searchBoxEnd);

assert(searchRowStart !== -1, "map search overlay uses a row for search and trailing controls");
assert(
  searchAccessoryStart > searchBoxEnd,
  "saved place search accessory is rendered outside and to the right of the input box"
);
