import assert from "node:assert/strict";
import {
  previewStatusLogs,
  shouldShowStatusLogSheetAction,
  statusLogCountLabel
} from "./statusLogDisplay";

const logs = Array.from({ length: 5 }, (_, index) => ({ id: `log-${index + 1}` }));

assert.deepEqual(
  previewStatusLogs(logs).map((log) => log.id),
  ["log-3", "log-4", "log-5"],
  "recent status preview should keep the latest three logs in chronological order"
);

assert.equal(
  shouldShowStatusLogSheetAction(logs),
  true,
  "status log sheet action should show when hidden logs exist"
);

assert.equal(
  shouldShowStatusLogSheetAction(logs.slice(0, 3)),
  false,
  "status log sheet action should stay hidden when all logs fit in the preview"
);

assert.equal(
  statusLogCountLabel(logs),
  "전체 5개",
  "status log count label should describe the complete log count"
);
