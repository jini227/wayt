const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const screenPath = path.join(__dirname, "..", "..", "app", "appointments", "[id].tsx");
const source = fs.readFileSync(screenPath, "utf8");

assert(
  source.includes("previewStatusLogs(appointment.statusLogs)"),
  "appointment detail uses a shared recent status preview helper"
);
assert(
  source.includes("shouldShowStatusLogSheetAction(appointment.statusLogs)"),
  "appointment detail only offers the full log sheet when hidden logs exist"
);
assert(
  source.includes("<StatusLogSheet"),
  "appointment detail renders the full status log sheet"
);
assert(
  source.includes("visible={statusLogSheetVisible}"),
  "status log sheet visibility is controlled by local screen state"
);
assert(
  source.includes("showsVerticalScrollIndicator"),
  "status log sheet keeps an explicit scroll indicator for long histories"
);
