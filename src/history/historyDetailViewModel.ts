import type { Participant } from "../data/mock";
import { isMeaningfulPenalty, penaltyText } from "../appointments/penalty";

export type ApiHistoryParticipantStatus =
  | "BEFORE_LOCATION_SHARE"
  | "WAITING"
  | "NOT_STARTED"
  | "MOVING"
  | "NEAR_ARRIVAL"
  | "ARRIVED"
  | "LIKELY_LATE"
  | "LATE_CONFIRMED"
  | "LOCATION_OFF";

export type ApiHistoryParticipant = {
  id: string;
  userId: string;
  name: string;
  waytId: string;
  avatarUrl?: string | null;
  role: "HOST" | "PARTICIPANT";
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED";
  status: ApiHistoryParticipantStatus;
  arrivedAt: string | null;
  punctuality?: "ON_TIME" | "LATE" | null;
  lateMinutes?: number | null;
  removedAt?: string | null;
  removedByName?: string | null;
};

export type ApiHistoryStatusLog = {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  createdAt: string;
};

export type ApiHistoryAppointment = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  penalty: string;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: ApiHistoryParticipant[];
  statusLogs: ApiHistoryStatusLog[];
};

export type HistoryDetailViewModel = {
  id: string;
  title: string;
  roleLabel: string;
  fullTime: string;
  place: string;
  penalty: string;
  penaltyTarget: string;
  memo: string;
  participants: Participant[];
  statusLogs: Array<{
    id: string;
    time: string;
    text: string;
    tone: StatusLogTone;
  }>;
};

export type StatusLogTone = "primary" | "danger" | "success" | "muted";

const HOST_LABEL = "\uBC29\uC7A5";
const PARTICIPANT_LABEL = "\uCC38\uAC00\uC790";
const ON_TIME_LABEL = "\uC815\uC2DC";
const LATE_LABEL = "\uC9C0\uAC01";
const NO_TARGET_LABEL = "\uB300\uC0C1 \uC5C6\uC74C";
const NO_MEMO_LABEL = "\uBA54\uBAA8 \uC5C6\uC74C";
const NOT_ARRIVED_LABEL = "\uBBF8\uB3C4\uCC29";
const REMOVED_LABEL = "\uC0AD\uC81C\uB428";
const LEFT_LABEL = "\uB098\uAC10";
const ARRIVED_SUFFIX = " \uB3C4\uCC29";
const STARTED_STATUS_MESSAGE = "\uCD9C\uBC1C\uD588\uC5B4\uC694";
const NEAR_STATUS_MESSAGE = "\uAC70\uC758 \uB2E4 \uC654\uC5B4\uC694";
const LATE_STATUS_MESSAGE = "\uC870\uAE08 \uB2A6\uC5B4\uC694";
const ARRIVED_STATUS_MESSAGE = "\uB3C4\uCC29\uD588\uC5B4\uC694";
const ON_TIME_COLOR = "#19C36B";
const LATE_COLOR = "#FF3B30";
const INACTIVE_COLOR = "#8B95A1";

export function createHistoryDetailViewModel(appointment: ApiHistoryAppointment): HistoryDetailViewModel {
  const participants = appointment.participants.map(mapParticipant);
  const hasPenalty = isMeaningfulPenalty(appointment.penalty);
  const lateNames = participants
    .filter((participant) => participant.result === LATE_LABEL)
    .map((participant) => participant.name);

  return {
    id: appointment.id,
    title: appointment.title,
    roleLabel: appointment.myRole === "HOST" ? HOST_LABEL : PARTICIPANT_LABEL,
    fullTime: formatDateTime(appointment.scheduledAt),
    place: appointment.placeName,
    penalty: penaltyText(appointment.penalty),
    penaltyTarget: hasPenalty && lateNames.length > 0 ? lateNames.join(", ") : NO_TARGET_LABEL,
    memo: appointment.memo?.trim() ? appointment.memo.trim() : NO_MEMO_LABEL,
    participants,
    statusLogs: appointment.statusLogs.map((log) => ({
      id: log.id,
      time: formatTime(log.createdAt),
      text: `${log.participantName} ${log.message}`.trim(),
      tone: statusLogTone(log.message)
    }))
  };
}

function mapParticipant(participant: ApiHistoryParticipant): Participant {
  if (participant.membershipStatus === "REMOVED") {
    return {
      id: participant.id,
      name: participant.name,
      handle: participant.waytId,
      avatar: participant.avatarUrl ?? "",
      accent: INACTIVE_COLOR,
      arrival: participant.removedByName ? `${participant.removedByName}\uB2D8\uC774 \uC0AD\uC81C` : REMOVED_LABEL,
      result: REMOVED_LABEL,
      statusTone: "muted"
    };
  }
  if (participant.membershipStatus === "LEFT") {
    return {
      id: participant.id,
      name: participant.name,
      handle: participant.waytId,
      avatar: participant.avatarUrl ?? "",
      accent: INACTIVE_COLOR,
      arrival: LEFT_LABEL,
      result: LEFT_LABEL,
      statusTone: "muted"
    };
  }

  const late = isLate(participant);
  return {
    id: participant.id,
    name: participant.name,
    handle: participant.waytId,
    avatar: participant.avatarUrl ?? "",
    accent: late ? LATE_COLOR : ON_TIME_COLOR,
    arrival: participant.arrivedAt ? `${formatTime(participant.arrivedAt)}${ARRIVED_SUFFIX}` : NOT_ARRIVED_LABEL,
    result: late ? LATE_LABEL : ON_TIME_LABEL,
    statusTone: late ? "danger" : "success"
  };
}

function isLate(participant: ApiHistoryParticipant) {
  if (participant.punctuality != null) {
    return participant.punctuality === "LATE";
  }
  if (participant.lateMinutes != null) {
    return participant.lateMinutes > 0;
  }
  return (
    participant.status === "LATE_CONFIRMED" ||
    participant.status === "LIKELY_LATE"
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function statusLogTone(message: string): StatusLogTone {
  const normalized = message.toLowerCase();
  if (message.includes(LATE_STATUS_MESSAGE) || message.includes(LATE_LABEL) || normalized.includes("late")) {
    return "danger";
  }
  if (message.includes(ARRIVED_STATUS_MESSAGE) || normalized.includes("arrived")) {
    return "success";
  }
  if (message.includes(STARTED_STATUS_MESSAGE) || message.includes(NEAR_STATUS_MESSAGE)) {
    return "primary";
  }
  return "muted";
}
