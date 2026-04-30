import { formatPenaltyLabel, isMeaningfulPenalty } from "./penalty";
import { displayAppointmentMemo } from "./liveAppointmentMemo";
import { appointmentRoleMark } from "./appointmentRole";

export type NextAppointmentCandidate = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  locationShareStartsAt: string;
  penalty?: string | null;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: readonly unknown[];
};

export type NextAppointmentViewModel = {
  id: string;
  title: string;
  place: string;
  scheduleLabel: string;
  countdownLabel: string;
  shareLabel: string;
  actionLabel: string;
  participantLabel: string;
  participantAvatars: NextAppointmentParticipantAvatar[];
  roleLabel: string | null;
  penaltyLabel: string;
  memoPreview: string | null;
  hasPenalty: boolean;
  hasMemo: boolean;
  isLocationSharingActive: boolean;
};

export type NextAppointmentParticipantAvatar = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export function selectNextAppointment<T extends NextAppointmentCandidate>(
  appointments: readonly T[],
  now: Date = new Date()
): T | null {
  const nowTime = now.getTime();

  return appointments
    .filter((appointment) => {
      const scheduledTime = new Date(appointment.scheduledAt).getTime();
      return Number.isFinite(scheduledTime) && scheduledTime > nowTime;
    })
    .slice()
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime())[0] ?? null;
}

export function createNextAppointmentViewModel(
  appointment: NextAppointmentCandidate,
  now: Date = new Date()
): NextAppointmentViewModel {
  const scheduledAt = new Date(appointment.scheduledAt);
  const locationShareStartsAt = new Date(appointment.locationShareStartsAt);
  const isLocationSharingActive = Number.isFinite(locationShareStartsAt.getTime())
    && locationShareStartsAt.getTime() <= now.getTime();
  const hasPenalty = isMeaningfulPenalty(appointment.penalty);
  const memoPreview = displayAppointmentMemo(appointment.memo);
  const activeParticipants = selectActiveParticipants(appointment.participants);

  return {
    id: appointment.id,
    title: appointment.title,
    place: appointment.placeName,
    scheduleLabel: formatDateTime(scheduledAt, appointment.scheduledAt),
    countdownLabel: `약속까지 ${formatDuration(now, scheduledAt)}`,
    shareLabel: isLocationSharingActive
      ? "위치 공유 중"
      : `위치 공유 ${formatDuration(now, locationShareStartsAt)} 뒤 시작`,
    actionLabel: isLocationSharingActive ? "약속 현황 보기" : "약속 보기",
    participantLabel: `${activeParticipants.length}명`,
    participantAvatars: activeParticipants.map(toParticipantAvatar),
    roleLabel: appointmentRoleMark(appointment.myRole),
    penaltyLabel: formatPenaltyLabel(appointment.penalty),
    memoPreview,
    hasPenalty,
    hasMemo: memoPreview !== null,
    isLocationSharingActive
  };
}

function selectActiveParticipants(participants: readonly unknown[]) {
  return participants.filter((participant) => {
    if (participant == null || typeof participant !== "object") {
      return true;
    }
    const membershipStatus = (participant as { membershipStatus?: unknown }).membershipStatus;
    return membershipStatus == null || membershipStatus === "ACTIVE";
  });
}

function toParticipantAvatar(participant: unknown, index: number): NextAppointmentParticipantAvatar {
  if (participant == null || typeof participant !== "object") {
    return {
      id: `participant-${index}`,
      name: "참가자"
    };
  }

  const item = participant as {
    id?: unknown;
    userId?: unknown;
    name?: unknown;
    avatarUrl?: unknown;
  };
  const avatarUrl = typeof item.avatarUrl === "string" && item.avatarUrl.trim().length > 0
    ? item.avatarUrl
    : undefined;

  return {
    id: stringValue(item.userId) ?? stringValue(item.id) ?? `participant-${index}`,
    name: stringValue(item.name) ?? "참가자",
    ...(avatarUrl ? { avatarUrl } : {})
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function formatDateTime(date: Date, fallback: string) {
  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatDuration(from: Date, to: Date) {
  if (!Number.isFinite(to.getTime())) {
    return "곧";
  }

  const minutes = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 60000));
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
