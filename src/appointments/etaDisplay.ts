export type EtaSourceKind = "manual" | "location";

type EtaParticipant = {
  status: string;
  arrivedAt: string | null;
  manualEstimatedArrivalAt: string | null;
  etaMinutes: number | null;
  etaCalculatedAt: string | null;
};

export type ParticipantEtaSummary = {
  sourceLabel: "직접 수정" | "위치 기준 자동 계산" | "도착 완료" | "준비 중";
  arrivalLabel: string;
  remainingLabel: string | null;
};

export function participantEtaText(participant: EtaParticipant, fallback: string) {
  if (participant.arrivedAt || participant.status === "ARRIVED") {
    return "도착 완료";
  }
  if (participant.manualEstimatedArrivalAt) {
    return `${formatEstimatedArrivalTime(participant.manualEstimatedArrivalAt)} 도착 예정`;
  }
  if (participant.etaMinutes != null && participant.etaCalculatedAt) {
    return `${participant.etaMinutes}분 남음`;
  }
  return fallback;
}

export function etaSourceKind(participant: EtaParticipant): EtaSourceKind | null {
  if (participant.arrivedAt || participant.status === "ARRIVED") {
    return null;
  }
  if (participant.manualEstimatedArrivalAt) {
    return "manual";
  }
  if (participant.etaMinutes != null && participant.etaCalculatedAt) {
    return "location";
  }
  return null;
}

export function shouldShowManualEtaAction(participant: EtaParticipant) {
  return etaSourceKind(participant) !== null;
}

export function shouldPromptManualEtaAfterRoute(participant: EtaParticipant, appointmentCompleted: boolean) {
  return !appointmentCompleted && shouldShowManualEtaAction(participant);
}

export function participantEtaSummary(participant: EtaParticipant, now = new Date()): ParticipantEtaSummary {
  if (participant.arrivedAt || participant.status === "ARRIVED") {
    return {
      sourceLabel: "도착 완료",
      arrivalLabel: "도착 완료",
      remainingLabel: null
    };
  }

  if (participant.manualEstimatedArrivalAt) {
    const estimatedArrivalAt = new Date(participant.manualEstimatedArrivalAt);
    return {
      sourceLabel: "직접 수정",
      arrivalLabel: `${formatEstimatedArrivalTime(participant.manualEstimatedArrivalAt)} 도착 예정`,
      remainingLabel: formatRemainingEstimate(estimatedArrivalAt, now)
    };
  }

  const automaticArrivalAt = automaticEstimatedArrivalAt(participant, now);
  if (automaticArrivalAt) {
    return {
      sourceLabel: "위치 기준 자동 계산",
      arrivalLabel: `${formatEstimatedArrivalTime(automaticArrivalAt.toISOString())} 도착 예상`,
      remainingLabel: formatRemainingEstimate(automaticArrivalAt, now)
    };
  }

  return {
    sourceLabel: "준비 중",
    arrivalLabel: "도착예정시간 준비 중",
    remainingLabel: null
  };
}

export function parseManualEtaInput(input: string, baseDate = new Date()) {
  const match = input.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  const candidate = new Date(baseDate);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() < baseDate.getTime() - 30 * 60 * 1000) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate;
}

export function manualEtaInputValue(value: string | null | undefined, now = new Date()) {
  return formatEstimatedArrivalTime(value ?? now.toISOString());
}

function automaticEstimatedArrivalAt(participant: EtaParticipant, now: Date) {
  if (participant.etaMinutes == null || !participant.etaCalculatedAt) {
    return null;
  }

  return new Date(now.getTime() + participant.etaMinutes * 60 * 1000);
}

function formatRemainingEstimate(estimatedArrivalAt: Date, now: Date) {
  if (Number.isNaN(estimatedArrivalAt.getTime())) {
    return null;
  }

  const minutes = Math.max(0, Math.ceil((estimatedArrivalAt.getTime() - now.getTime()) / 60000));
  if (minutes === 0) {
    return "곧 도착 예상";
  }
  return `${formatDurationMinutes(minutes)} 남음 예상`;
}

function formatDurationMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function formatEstimatedArrivalTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
