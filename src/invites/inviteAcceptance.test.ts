import { formatAppointmentScheduleLabel } from "../appointments/liveAppointmentSchedule";
import {
  buildInviteAcceptanceDetails,
  buildInviteAcceptanceTravelModeState
} from "./inviteAcceptance";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}

const withDefault = buildInviteAcceptanceTravelModeState("CAR");

assertEqual(
  withDefault.selectedTravelMode,
  "CAR",
  "invite acceptance uses the profile default as the selected mode"
);
assertEqual(
  withDefault.shouldShowTravelModeQuestion,
  false,
  "invite acceptance hides the travel mode question when a profile default exists"
);
assertEqual(
  withDefault.shouldAskDefaultSave,
  false,
  "invite acceptance does not ask to save a default that already exists"
);

const withoutDefault = buildInviteAcceptanceTravelModeState(null);

assertEqual(
  withoutDefault.selectedTravelMode,
  "TRANSIT",
  "invite acceptance falls back to transit when there is no profile default"
);
assertEqual(
  withoutDefault.shouldShowTravelModeQuestion,
  true,
  "invite acceptance asks for a travel mode when no profile default exists"
);
assertEqual(
  withoutDefault.shouldAskDefaultSave,
  true,
  "invite acceptance can offer to save the selected mode when no profile default exists"
);

const scheduledAt = "2026-05-01T19:30:00+09:00";
const details = buildInviteAcceptanceDetails({
  appointmentTitle: "홍대 저녁 약속",
  placeName: "홍대입구역 9번 출구",
  scheduledAt,
  memo: "케이크 픽업 후 와주세요",
  inviterNickname: "민지",
  inviterWaytId: "@minji",
  inviterAvatarUrl: "https://example.com/minji.png"
});

assertEqual(details.title, "홍대 저녁 약속", "invite acceptance details keep the appointment title prominent");
assertEqual(details.inviterLabel, "민지님의 초대", "invite acceptance details name the inviter");
assertEqual(details.inviterHandle, "@minji", "invite acceptance details include the inviter handle");
assertEqual(
  details.inviterAvatarUrl,
  "https://example.com/minji.png",
  "invite acceptance details preserve the inviter avatar"
);
assertDeepEqual(
  details.rows,
  [
    { id: "scheduledAt", label: "일시", value: formatAppointmentScheduleLabel(scheduledAt) },
    { id: "place", label: "장소", value: "홍대입구역 9번 출구" },
    { id: "memo", label: "메모", value: "케이크 픽업 후 와주세요" }
  ],
  "invite acceptance details show time, place, and memo"
);

const detailsWithoutMemo = buildInviteAcceptanceDetails({
  appointmentTitle: "점심",
  placeName: "강남역",
  scheduledAt,
  memo: "   ",
  inviterNickname: "지훈",
  inviterWaytId: "@jihun"
});

assertDeepEqual(
  detailsWithoutMemo.rows.map((row) => row.id),
  ["scheduledAt", "place"],
  "invite acceptance details skip a blank memo"
);
