import assert from "node:assert/strict";
import {
  createLiveAppointmentSectionOrder,
  createMyTravelInfoDisplay
} from "./liveAppointmentLayout";

assert.deepEqual(
  createLiveAppointmentSectionOrder({
    hasMyParticipant: true,
    hasMemo: false,
    locationPublic: true
  }),
  ["map", "appointmentStatus", "participants", "myTravelInfo", "activityLog", "statusActions"],
  "live appointment details should place my travel controls right after participants"
);

assert.deepEqual(
  createLiveAppointmentSectionOrder({
    hasMyParticipant: false,
    hasMemo: true,
    locationPublic: false
  }),
  ["map", "appointmentStatus", "participants", "memo", "lockedNotice"],
  "guests without a participant record should not see personal travel controls"
);

assert.deepEqual(
  createMyTravelInfoDisplay({
    travelModeLabel: "대중교통",
    etaSummary: {
      sourceLabel: "위치 기준",
      arrivalLabel: "18:42 도착 예정",
      remainingLabel: "12분 남음"
    }
  }),
  {
    title: "내 이동 정보",
    presentation: "card",
    etaPrimaryLabel: "18:42 도착 예정",
    etaDetailLabel: "12분 남음 · 위치 기준 · 대중교통",
    travelModeControl: "segmented",
    primaryActionLabel: "도착예정 수정",
    travelModeLabel: "대중교통"
  },
  "my travel info should collapse ETA and current travel mode into a quiet status strip"
);

assert.equal(
  createMyTravelInfoDisplay({
    travelModeLabel: "도보",
    etaSummary: {
      sourceLabel: "직접 수정",
      arrivalLabel: "도착 완료",
      remainingLabel: null
    }
  }).etaDetailLabel,
  "직접 수정 · 도보",
  "my travel info should omit the separator when there is no remaining ETA"
);
