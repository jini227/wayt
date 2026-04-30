import assert from "node:assert/strict";
import {
  createAppointmentMapMeta,
  formatAppointmentScheduleLabel
} from "./liveAppointmentSchedule";

assert.equal(
  formatAppointmentScheduleLabel("2026-05-01T03:00:00+09:00"),
  "5월 1일 (금) 오전 3:00",
  "appointment detail should match the list schedule label format"
);

assert.equal(
  formatAppointmentScheduleLabel("not-a-date"),
  "약속 시간 확인 중",
  "invalid scheduled times should fall back to a readable label"
);

assert.deepEqual(
  createAppointmentMapMeta({
    scheduledAt: "2026-05-01T04:01:00+09:00",
    placeName: "  경기도 수원시 팔달구 화서동 수성로232번길 7 래미안 클래식  "
  }),
  {
    scheduleLabel: "5월 1일 (금) 오전 4:01",
    placeLabel: "경기도 수원시 팔달구 화서동 수성로232번길 7 래미안 클래식",
    placeCopyText: "경기도 수원시 팔달구 화서동 수성로232번길 7 래미안 클래식"
  },
  "map metadata should keep the long address near the map and copy the clean address without display sizing"
);
