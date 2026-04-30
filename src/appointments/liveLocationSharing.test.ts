import assert from "node:assert/strict";
import {
  locationPermissionNotice,
  participantLocationInviteStatus,
  participantLocationStatusTone,
  shouldRenderParticipantLocationMarker
} from "./liveLocationSharing";

const movingParticipant = {
  status: "MOVING",
  latestLatitude: 37.5,
  latestLongitude: 127.0,
  locationConsent: true,
  arrivedAt: null,
  lateMinutes: null
} as const;

assert.equal(
  shouldRenderParticipantLocationMarker(movingParticipant),
  true,
  "moving participants with coordinates should render a map marker"
);

const locationOffParticipant = {
  ...movingParticipant,
  status: "LOCATION_OFF"
} as const;

assert.equal(
  shouldRenderParticipantLocationMarker(locationOffParticipant),
  false,
  "participants with location off should not render a stale map marker"
);
assert.equal(
  participantLocationStatusTone(locationOffParticipant),
  "muted",
  "participants with location off should use a muted status tone"
);
assert.equal(
  participantLocationInviteStatus(locationOffParticipant),
  "위치 권한 꺼짐",
  "participant rows should explain that phone location permission is off"
);

const missingLocationParticipant = {
  ...movingParticipant,
  latestLatitude: null,
  latestLongitude: null
} as const;

assert.equal(
  shouldRenderParticipantLocationMarker(missingLocationParticipant),
  false,
  "participants without coordinates should not render a map marker"
);

assert.deepEqual(
  locationPermissionNotice(false),
  {
    title: "위치 권한이 꺼져 있어요.",
    message: "Wayt가 내 위치를 공유하려면 휴대폰 설정에서 위치 권한을 '앱 사용 중 허용'으로 바꿔주세요.",
    primaryActionLabel: "설정 열기"
  },
  "permission notice should send users to phone settings after denial"
);
