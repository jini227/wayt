import assert from "node:assert/strict";
import {
  etaSourceKind,
  shouldPromptManualEtaAfterRoute,
  participantEtaSummary,
  manualEtaInputValue,
  parseManualEtaInput,
  participantEtaText,
  shouldShowManualEtaAction
} from "./etaDisplay";

const manualParticipant = {
  status: "MOVING",
  arrivedAt: null,
  manualEstimatedArrivalAt: "2026-05-01T18:42:00+09:00",
  etaMinutes: 17,
  etaCalculatedAt: "2026-05-01T18:12:00+09:00"
} as const;

assert.equal(
  participantEtaText(manualParticipant, "가는 중"),
  "18:42 도착 예정",
  "manual ETA should be shown before automatic ETA"
);
assert.equal(
  etaSourceKind(manualParticipant),
  "manual",
  "manual ETA should use the edited source icon"
);

const automaticParticipant = {
  status: "MOVING",
  arrivedAt: null,
  manualEstimatedArrivalAt: null,
  etaMinutes: 12,
  etaCalculatedAt: "2026-05-01T18:12:00+09:00"
} as const;

assert.equal(
  participantEtaText(automaticParticipant, "가는 중"),
  "12분 남음",
  "automatic ETA should be shown when there is no manual ETA"
);
assert.equal(
  etaSourceKind(automaticParticipant),
  "location",
  "automatic ETA should use the location-based source icon"
);

const arrivedParticipant = {
  status: "ARRIVED",
  arrivedAt: "2026-05-01T18:32:00+09:00",
  manualEstimatedArrivalAt: "2026-05-01T18:42:00+09:00",
  etaMinutes: 12,
  etaCalculatedAt: "2026-05-01T18:12:00+09:00"
} as const;

assert.equal(participantEtaText(arrivedParticipant, "도착 완료"), "도착 완료");
assert.equal(etaSourceKind(arrivedParticipant), null);

const baseDate = new Date("2026-05-01T18:10:00+09:00");
assert.equal(
  parseManualEtaInput("18:42", baseDate)?.toISOString(),
  new Date("2026-05-01T18:42:00+09:00").toISOString(),
  "HH:mm input should resolve to the same local day when it is ahead"
);
assert.equal(
  parseManualEtaInput("00:20", new Date("2026-05-01T23:50:00+09:00"))?.toISOString(),
  new Date("2026-05-02T00:20:00+09:00").toISOString(),
  "HH:mm input should roll to tomorrow when it is behind the current time"
);
assert.equal(parseManualEtaInput("24:00", baseDate), null);
assert.equal(manualEtaInputValue("2026-05-01T18:42:00+09:00"), "18:42");

assert.deepEqual(
  participantEtaSummary(manualParticipant, new Date("2026-05-01T18:10:00+09:00")),
  {
    sourceLabel: "직접 수정",
    arrivalLabel: "18:42 도착 예정",
    remainingLabel: "32분 남음 예상"
  },
  "manual ETA summary should show the shared arrival time and remaining minutes"
);

assert.deepEqual(
  participantEtaSummary(automaticParticipant, new Date("2026-05-01T18:10:00+09:00")),
  {
    sourceLabel: "위치 기준 자동 계산",
    arrivalLabel: "18:22 도착 예상",
    remainingLabel: "12분 남음 예상"
  },
  "automatic ETA summary should show the calculated arrival time and remaining minutes"
);

const waitingParticipant = {
  status: "WAITING",
  arrivedAt: null,
  manualEstimatedArrivalAt: null,
  etaMinutes: null,
  etaCalculatedAt: null
} as const;

assert.equal(
  shouldShowManualEtaAction(waitingParticipant),
  false,
  "manual ETA action should stay hidden until there is an ETA to edit"
);
assert.equal(
  shouldShowManualEtaAction(automaticParticipant),
  true,
  "manual ETA action should show when a location-based ETA exists"
);
assert.equal(
  shouldShowManualEtaAction(manualParticipant),
  true,
  "manual ETA action should show when a manual ETA exists"
);
assert.equal(
  shouldShowManualEtaAction(arrivedParticipant),
  false,
  "manual ETA action should hide after arrival"
);
assert.equal(
  shouldPromptManualEtaAfterRoute(waitingParticipant, false),
  false,
  "route return prompt should stay hidden when manual ETA action is hidden"
);
assert.equal(
  shouldPromptManualEtaAfterRoute(automaticParticipant, false),
  true,
  "route return prompt should show when the manual ETA action is available"
);
assert.equal(
  shouldPromptManualEtaAfterRoute(automaticParticipant, true),
  false,
  "route return prompt should stay hidden after appointment completion"
);
