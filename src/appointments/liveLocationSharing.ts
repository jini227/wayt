export type LiveLocationParticipantStatus =
  | "BEFORE_LOCATION_SHARE"
  | "WAITING"
  | "NOT_STARTED"
  | "MOVING"
  | "NEAR_ARRIVAL"
  | "ARRIVED"
  | "LIKELY_LATE"
  | "LATE_CONFIRMED"
  | "LOCATION_OFF";

export type LiveLocationParticipant = {
  status: LiveLocationParticipantStatus;
  locationConsent: boolean;
  latestLatitude: number | null;
  latestLongitude: number | null;
  arrivedAt: string | null;
  lateMinutes: number | null;
};

export type ParticipantStatusTone = "primary" | "danger" | "success" | "muted";
export type ParticipantLocationInviteStatus = "참가 완료" | "위치 동의 완료" | "위치 권한 꺼짐";

export function shouldRenderParticipantLocationMarker(
  participant: LiveLocationParticipant
): participant is LiveLocationParticipant & { latestLatitude: number; latestLongitude: number } {
  return (
    participant.status !== "LOCATION_OFF" &&
    participant.latestLatitude != null &&
    participant.latestLongitude != null
  );
}

export function participantLocationStatusTone(participant: LiveLocationParticipant): ParticipantStatusTone {
  if (participant.arrivedAt || participant.status === "ARRIVED") {
    return "success";
  }
  if (participant.status === "LOCATION_OFF") {
    return "muted";
  }
  if (participant.status === "LIKELY_LATE" || participant.status === "LATE_CONFIRMED" || (participant.lateMinutes ?? 0) > 0) {
    return "danger";
  }
  return "primary";
}

export function participantLocationInviteStatus(participant: LiveLocationParticipant): ParticipantLocationInviteStatus {
  if (participant.status === "LOCATION_OFF") {
    return "위치 권한 꺼짐";
  }
  return participant.locationConsent ? "위치 동의 완료" : "참가 완료";
}

export function locationPermissionNotice(canAskAgain: boolean) {
  return {
    title: canAskAgain ? "위치 권한이 필요해요." : "위치 권한이 꺼져 있어요.",
    message: canAskAgain
      ? "Wayt가 약속 참가자에게 내 위치를 공유하려면 위치 권한을 허용해 주세요."
      : "Wayt가 내 위치를 공유하려면 휴대폰 설정에서 위치 권한을 '앱 사용 중 허용'으로 바꿔주세요.",
    primaryActionLabel: "설정 열기"
  };
}
