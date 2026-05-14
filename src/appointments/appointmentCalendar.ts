export type CalendarAppointmentLike = {
  scheduledAt: string;
  completedAt?: string | null;
};

export type CalendarDay = {
  key: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  appointmentCount: number;
};

export type CalendarMonth = {
  label: string;
  weeks: CalendarDay[][];
};

export type AppointmentIndicator = "none" | "single" | "dots" | "count";

export type CalendarDateRange = {
  from: string;
  to: string;
};

const CALENDAR_TIME_ZONE = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

export function calendarMonthLabel(month: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: CALENDAR_TIME_ZONE,
    year: "numeric",
    month: "long"
  }).format(month);
}

export function calendarDateKey(date: Date) {
  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CALENDAR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}

export function buildCalendarMonth<T extends CalendarAppointmentLike>(
  visibleMonth: Date,
  appointments: readonly T[]
): CalendarMonth {
  const monthParts = calendarMonthParts(visibleMonth);
  const firstDay = new Date(monthParts.year, monthParts.month - 1, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const currentMonthKey = monthKey(monthParts.year, monthParts.month);
  const appointmentCounts = countAppointmentsByDate(appointments);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * DAY_MS);
    const key = calendarDateKey(date);
    return {
      key,
      dayNumber: date.getDate(),
      isCurrentMonth: key.startsWith(currentMonthKey),
      appointmentCount: appointmentCounts.get(key) ?? 0
    };
  });

  return {
    label: calendarMonthLabel(firstDay),
    weeks: Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7))
  };
}

export function calendarGridDateRange(visibleMonth: Date): CalendarDateRange {
  const monthParts = calendarMonthParts(visibleMonth);
  const firstDay = new Date(monthParts.year, monthParts.month - 1, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  const gridEnd = new Date(gridStart.getTime() + 42 * DAY_MS);

  return {
    from: startOfDayOffsetDateTime(calendarDateKey(gridStart)),
    to: startOfDayOffsetDateTime(calendarDateKey(gridEnd))
  };
}

export function appointmentsForCalendarDate<T extends CalendarAppointmentLike>(
  appointments: readonly T[],
  dateKey: string
): T[] {
  return appointments
    .filter((appointment) => isOpenAppointment(appointment) && calendarDateKey(new Date(appointment.scheduledAt)) === dateKey)
    .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime());
}

export function appointmentIndicator(count: number): AppointmentIndicator {
  if (count <= 0) {
    return "none";
  }
  if (count === 1) {
    return "single";
  }
  if (count <= 3) {
    return "dots";
  }
  return "count";
}

function countAppointmentsByDate<T extends CalendarAppointmentLike>(appointments: readonly T[]) {
  return appointments.reduce<Map<string, number>>((counts, appointment) => {
    if (!isOpenAppointment(appointment)) {
      return counts;
    }

    const key = calendarDateKey(new Date(appointment.scheduledAt));
    if (!key) {
      return counts;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map());
}

function isOpenAppointment(appointment: CalendarAppointmentLike) {
  return !appointment.completedAt;
}

function calendarMonthParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CALENDAR_TIME_ZONE,
    year: "numeric",
    month: "numeric"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? date.getFullYear()),
    month: Number(parts.find((part) => part.type === "month")?.value ?? date.getMonth() + 1)
  };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function startOfDayOffsetDateTime(dateKey: string) {
  return `${dateKey}T00:00:00+09:00`;
}
