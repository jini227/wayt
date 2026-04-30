const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const appointmentDetail = fs.readFileSync(path.join(root, "app", "appointments", "[id].tsx"), "utf8");

assert.match(
  appointmentDetail,
  /const displayParticipants = activeParticipants;/,
  "appointment detail renders only active participants"
);

assert.doesNotMatch(
  appointmentDetail,
  /const displayParticipants = appointment\?\.participants \?\? \[\];/,
  "appointment detail does not render removed or left participants"
);
