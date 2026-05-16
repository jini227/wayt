const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
const source = fs.readFileSync(path.join(root, "app", "appointments", "[id]", "invite.tsx"), "utf8");

assert.match(
  source,
  /createAppointmentShareUrl/,
  "invite screen share block builds the public appointment detail URL"
);

assert.doesNotMatch(
  source,
  /\/appointments\/\$\{appointment\.id\}\/invite-link/,
  "invite screen share block must not create invite-token links for public sharing"
);

assert.match(
  source,
  /Clipboard\.setStringAsync\(appointmentShareUrl\)/,
  "link copy copies the public appointment detail URL"
);

assert.match(
  source,
  /<Text style=\{styles\.cardTitle\}>공유하기<\/Text>/,
  "the former link invite block is labeled as sharing"
);

assert.match(
  source,
  /navigator[\s\S]*\.share/,
  "web sharing uses the browser share sheet when available"
);

assert.match(
  source,
  /shareAppointmentWithKakao/,
  "web sharing tries Kakao Talk sharing before falling back to the browser share sheet"
);

assert.match(
  source,
  /Share\.share\(\{[\s\S]*url: appointmentShareUrl/,
  "native sharing sends the public appointment detail URL"
);
