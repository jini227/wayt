const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const acceptScreen = fs.readFileSync(path.join(root, "app", "invites", "[token].tsx"), "utf8");
const receivedScreen = fs.readFileSync(path.join(root, "app", "invites", "index.tsx"), "utf8");

assert.match(receivedScreen, /useEffect\(loadInvites, \[loadInvites\]\)/, "received invites load once when the inbox mounts");
assert.doesNotMatch(receivedScreen, /useFocusEffect/, "received invites do not auto-refresh on focus");
assert.doesNotMatch(receivedScreen, /RECEIVED_INVITES_REFRESH_INTERVAL_MS/, "received invites do not keep a polling interval constant");
assert.doesNotMatch(receivedScreen, /setInterval/, "received invites do not poll while the inbox is open");
assert.match(receivedScreen, /refreshing=\{refreshing\}/, "received invites keep pull-to-refresh state wired");
assert.match(receivedScreen, /onRefresh=\{refreshInvites\}/, "received invites keep manual refresh wired");

assert.match(
  acceptScreen,
  /back=\{invitePending \? \(\) => router\.back\(\) : undefined\}/,
  "non-pending invite states do not expose a back button to the stale invite card"
);
assert.match(acceptScreen, /router\.replace\("\/"\)/, "non-pending invite confirmation returns home");
assert.match(acceptScreen, />확인</, "non-pending invite footer uses a confirmation button");
assert.doesNotMatch(
  acceptScreen,
  /참여할 수 없는 초대/,
  "non-pending invite footer does not render an inert disabled action"
);
assert.match(
  acceptScreen,
  /setInvite\(\(current\) => current \? \{ \.\.\.current, status: staleStatus \} : current\)/,
  "a stale accept error updates the invite screen to the server status"
);
