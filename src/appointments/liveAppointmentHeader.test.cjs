const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const detailPath = path.join(root, "app", "appointments", "[id].tsx");
const source = fs.readFileSync(detailPath, "utf8");

const headerMetaPattern = /formatAppointmentScheduleLabel\(liveAppointment\.scheduledAt\)[\s\S]*liveAppointment\.placeName[\s\S]*countdownPrefix\(liveAppointment\.scheduledAt\)/;

assert.match(
  source,
  headerMetaPattern,
  "appointment detail header should show the place directly below the scheduled time and above the countdown"
);

assert.equal(
  [...source.matchAll(/style=\{styles\.scheduleLabel\}/g)].length >= 2,
  true,
  "appointment detail time and place should share the same list-style meta text style"
);

assert.match(
  source,
  /scheduleLabel:\s*\{[\s\S]*color:\s*colors\.textMuted,[\s\S]*fontSize:\s*16,[\s\S]*fontWeight:\s*"500"/,
  "appointment detail meta text should match the list font size, weight, and muted tone"
);
