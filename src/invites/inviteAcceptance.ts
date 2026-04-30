import {
  initialTravelModeSelection,
  isTravelMode,
  type ApiTravelMode,
  type TravelMode
} from "../travel/travelMode";
import { formatAppointmentScheduleLabel } from "../appointments/liveAppointmentSchedule";

export type InviteAcceptanceTravelModeState = {
  selectedTravelMode: TravelMode;
  shouldShowTravelModeQuestion: boolean;
  shouldAskDefaultSave: boolean;
};

export function buildInviteAcceptanceTravelModeState(
  defaultTravelMode: ApiTravelMode | null | undefined
): InviteAcceptanceTravelModeState {
  const hasDefaultTravelMode = isTravelMode(defaultTravelMode);

  return {
    selectedTravelMode: initialTravelModeSelection(defaultTravelMode),
    shouldShowTravelModeQuestion: !hasDefaultTravelMode,
    shouldAskDefaultSave: !hasDefaultTravelMode
  };
}

export type InviteAcceptanceDetailSource = {
  appointmentTitle?: string | null;
  placeName?: string | null;
  scheduledAt?: string | null;
  memo?: string | null;
  inviterNickname?: string | null;
  inviterWaytId?: string | null;
  inviterAvatarUrl?: string | null;
};

export type InviteAcceptanceDetailRow = {
  id: "scheduledAt" | "place" | "memo";
  label: string;
  value: string;
};

export type InviteAcceptanceDetails = {
  title: string;
  inviterLabel: string;
  inviterHandle: string | null;
  inviterAvatarUrl: string | null;
  rows: InviteAcceptanceDetailRow[];
};

export function buildInviteAcceptanceDetails(source: InviteAcceptanceDetailSource): InviteAcceptanceDetails {
  const title = cleanText(source.appointmentTitle) || "약속 정보 없음";
  const inviterNickname = cleanText(source.inviterNickname);
  const inviterHandle = cleanText(source.inviterWaytId);
  const inviterAvatarUrl = cleanText(source.inviterAvatarUrl);
  const scheduledAt = cleanText(source.scheduledAt);
  const placeName = cleanText(source.placeName);
  const memo = cleanText(source.memo);

  const rows: InviteAcceptanceDetailRow[] = [];
  if (scheduledAt) {
    rows.push({ id: "scheduledAt", label: "일시", value: formatAppointmentScheduleLabel(scheduledAt) });
  }
  if (placeName) {
    rows.push({ id: "place", label: "장소", value: placeName });
  }
  if (memo) {
    rows.push({ id: "memo", label: "메모", value: memo });
  }

  return {
    title,
    inviterLabel: inviterNickname ? `${inviterNickname}님의 초대` : "초대받은 약속",
    inviterHandle: inviterHandle || null,
    inviterAvatarUrl: inviterAvatarUrl || null,
    rows
  };
}

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? "";
}
