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
  /canLeave=\{Boolean\(myParticipant\)\}/,
  "participants keep the leave action even when the backend has not deployed isParticipant yet"
);

assert.match(
  detailSource,
  /router\.push\(`\/appointments\/\$\{liveAppointment\.id\}\/invite`\)/,
  "participant invite actions still open the existing invite management screen"
);

assert.match(
  detailSource,
  /canInvite=\{Boolean\(myParticipant\)\}/,
  "public shared viewers do not see invite management actions"
);

assert.doesNotMatch(
  detailSource,
  /Share\.share/,
  "appointment detail does not call unsupported native share from the web header action"
);

assert.match(
  authGateSource,
  /publicAppointmentPath/,
  "auth gate allows direct shared appointment links to render for anonymous viewers"
);
