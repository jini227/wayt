const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const files = [
  "app/index.tsx",
  "app/invites/index.tsx",
  "app/appointments/calendar.tsx",
  "app/appointments/next.tsx",
  "app/appointments/[id].tsx",
  "app/appointments/[id]/invite.tsx",
  "app/history/index.tsx",
  "app/history/[id].tsx"
];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(source, /refreshing=\{/, `${file} passes refreshing to AppScreen`);
  assert.match(source, /onRefresh=\{/, `${file} passes onRefresh to AppScreen`);
}
