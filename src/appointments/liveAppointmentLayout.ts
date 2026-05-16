export type LiveAppointmentSection =
  | "map"
  | "appointmentStatus"
  | "participants"
  | "myTravelInfo"
  | "memo"
  | "activityLog"
  | "lockedNotice"
  | "statusActions";

export type MyTravelInfoDisplay = {
  title: "내 이동 정보";
  presentation: "card";
  etaPrimaryLabel: string;
  etaDetailLabel: string;
  travelModeControl: "segmented";
  primaryActionLabel: "도착예정 수정";
  travelModeLabel: string;
};

type EtaSummary = {
  sourceLabel: string;
  arrivalLabel: string;
  remainingLabel: string | null;
};

export function createLiveAppointmentSectionOrder({
  hasMyParticipant,
  isParticipant = hasMyParticipant,
  hasMemo,
  locationPublic
}: {
  hasMyParticipant: boolean;
  isParticipant?: boolean;
  hasMemo: boolean;
  locationPublic: boolean;
}): LiveAppointmentSection[] {
  if (!locationPublic) {
    return [
      "map",
      "appointmentStatus",
      "lockedNotice",
      "participants",
      ...(hasMyParticipant ? ["myTravelInfo" as const] : []),
      ...(hasMemo ? ["memo" as const] : [])
    ];
  }

  return [
    "map",
    "appointmentStatus",
    "participants",
    ...(hasMyParticipant ? ["myTravelInfo" as const] : []),
    ...(hasMemo ? ["memo" as const] : []),
    locationPublic ? "activityLog" : "lockedNotice",
    ...(locationPublic && isParticipant ? ["statusActions" as const] : [])
  ];
}

export function createMyTravelInfoDisplay({
  etaSummary,
  travelModeLabel
}: {
  etaSummary: EtaSummary;
  travelModeLabel: string;
}): MyTravelInfoDisplay {
  return {
    title: "내 이동 정보",
    presentation: "card",
    etaPrimaryLabel: etaSummary.arrivalLabel,
    etaDetailLabel: [etaSummary.remainingLabel, etaSummary.sourceLabel, travelModeLabel]
      .filter((label): label is string => Boolean(label))
      .join(" · "),
    travelModeControl: "segmented",
    primaryActionLabel: "도착예정 수정",
    travelModeLabel
  };
}
