export type HomeAppointmentLike = {
  scheduledAt: string;
  completedAt?: string | null;
};

const HOME_TIME_ZONE = "Asia/Seoul";

export function filterHomeAppointments<T extends HomeAppointmentLike>(
  appointments: readonly T[],
  filterIndex: number,
  now: Date = new Date()
): readonly T[] {
  if (filterIndex !== 1) {
    return appointments;
  }

  const todayKey = dateKeyInTimeZone(now, HOME_TIME_ZONE);

  return appointments.filter((appointment) => {
    if (appointment.completedAt) {
      return false;
    }

    return dateKeyInTimeZone(new Date(appointment.scheduledAt), HOME_TIME_ZONE) === todayKey;
  });
}

function dateKeyInTimeZone(date: Date, timeZone: string) {
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}
