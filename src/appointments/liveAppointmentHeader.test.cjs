const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const detailPath = path.join(root, "app", "appointments", "[id].tsx");
const source = fs.readFileSync(detailPath, "utf8");

assert.match(
  source,
  /liveAppointment\.title[\s\S]*countdownPrefix\(liveAppointment\.scheduledAt\)/,
  "appointment detail header should keep the countdown directly below the title"
);

assert.doesNotMatch(
  source,
  /<Text style=\{styles\.scheduleLabel\}[\s\S]*formatAppointmentScheduleLabel\(liveAppointment\.scheduledAt\)[\s\S]*<\/Text>/,
  "appointment detail header should not repeat the scheduled time above the countdown"
);

assert.doesNotMatch(
  source,
  /<Text style=\{styles\.scheduleLabel\}[\s\S]*liveAppointment\.placeName[\s\S]*<\/Text>/,
  "appointment detail header should not repeat the place above the countdown"
);

assert.match(
  source,
  /scheduleLabel=\{mapMeta\.scheduleLabel\}[\s\S]*placeLabel=\{mapMeta\.placeLabel\}/,
  "appointment detail should keep the schedule and place labels near the map"
);
