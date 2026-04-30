const APPOINTMENT_TIME_ZONE = "Asia/Seoul";

export function formatAppointmentScheduleLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "약속 시간 확인 중";
  }

  const month = new Intl.DateTimeFormat("ko-KR", {
    timeZone: APPOINTMENT_TIME_ZONE,
    month: "long"
  }).format(date);
  const day = new Intl.DateTimeFormat("ko-KR", {
    timeZone: APPOINTMENT_TIME_ZONE,
    day: "numeric"
  }).format(date);
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: APPOINTMENT_TIME_ZONE,
    weekday: "short"
  }).format(date);
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: APPOINTMENT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit"
  }).format(date);

  return `${month} ${day} (${weekday}) ${time}`;
}

export function createAppointmentMapMeta({
  scheduledAt,
  placeName
}: {
  scheduledAt: string;
  placeName: string;
}) {
  const cleanPlaceName = placeName.trim();

  return {
    scheduleLabel: formatAppointmentScheduleLabel(scheduledAt),
    placeLabel: cleanPlaceName,
    placeCopyText: cleanPlaceName
  };
}
