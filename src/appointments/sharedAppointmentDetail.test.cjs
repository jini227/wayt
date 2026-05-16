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
  /isParticipant:\s*liveAppointment\.isParticipant/,
  "appointment detail sections are driven by the server participant flag"
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
