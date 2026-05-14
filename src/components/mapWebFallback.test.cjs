const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const mapSurface = readFileSync(resolve(process.cwd(), "src/components/MapSurface.tsx"), "utf8");
const naverWebMap = readFileSync(resolve(process.cwd(), "src/components/NaverWebMap.tsx"), "utf8");
const newAppointment = readFileSync(resolve(process.cwd(), "app/appointments/new.tsx"), "utf8");

assert.match(
  mapSurface,
  /Platform\.OS === "web" \|\| Constants\.appOwnership === "expo"/,
  "web builds should use the web-safe Naver map instead of the native map"
);
assert.match(
  naverWebMap,
  /Platform\.OS === "web"/,
  "shared map surface should avoid react-native-webview on web"
);
assert.match(
  newAppointment,
  /Platform\.OS === "web"/,
  "place picker should avoid react-native-webview on web"
);
assert.match(
  newAppointment,
  /window\.parent\.postMessage\(payload, "\*"\)/,
  "web place picker iframe should send selected coordinates to the parent page"
);
