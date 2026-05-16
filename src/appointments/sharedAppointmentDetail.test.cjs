const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const detailSource = fs.readFileSync(path.join(root, "app", "appointments", "[id].tsx"), "utf8");
const apiClientSource = fs.readFileSync(path.join(root, "src", "api", "client.ts"), "utf8");
const authGateSource = fs.readFileSync(path.join(root, "src", "auth", "AuthGate.tsx"), "utf8");

assert.match(
  apiClientSource,
  /apiGetOptionalAuthenticated/,
  "API client exposes a public fetch helper that includes auth only when available"
);

assert.match(
  detailSource,
  /`\/appointments\/\$\{id\}\/public`/,
  "appointment detail falls back to the public appointment endpoint"
);

assert.match(
  detailSource,
  /const isParticipant = liveAppointment\.isParticipant \|\| Boolean\(myParticipant\);/,
  "appointment detail treats the current participant row as a participant fallback"
);

assert.match(
  detailSource,
  /isParticipant,\s*[\r\n\s]+hasMemo:/,
  "appointment detail sections use the normalized participant flag"
);

assert.match(
  detailSource,
  /Platform\.OS === "web"[\s\S]*Clipboard\.setStringAsync\(url\)/,
  "web share button copies the appointment link instead of using unsupported native share"
);

assert.match(
  detailSource,
  /canLeave=\{Boolean\(myParticipant\)\}/,
  "participants keep the leave action even when the backend has not deployed isParticipant yet"
);

assert.doesNotMatch(
  detailSource,
  /router\.push\(`\/appointments\/\$\{liveAppointment\.id\}\/invite`\)/,
  "the top-level share action shares the appointment URL instead of opening invite management"
);

assert.match(
  authGateSource,
  /publicAppointmentPath/,
  "auth gate allows direct shared appointment links to render for anonymous viewers"
);
