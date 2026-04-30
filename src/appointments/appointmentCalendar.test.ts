import {
  appointmentIndicator,
  appointmentsForCalendarDate,
  buildCalendarMonth,
  calendarDateKey,
  calendarMonthLabel
} from "./appointmentCalendar";

type TestAppointment = {
  id: string;
  title: string;
  scheduledAt: string;
  completedAt?: string | null;
};

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ids(appointments: readonly TestAppointment[]) {
  return appointments.map((appointment) => appointment.id).join(",");
}

const appointments: TestAppointment[] = [
  { id: "may-3-evening", title: "Dinner", scheduledAt: "2026-05-03T19:00:00+09:00" },
  { id: "may-3-afternoon", title: "Meeting", scheduledAt: "2026-05-03T14:00:00+09:00" },
  { id: "may-3-utc", title: "UTC edge", scheduledAt: "2026-05-02T16:30:00Z" },
  { id: "may-15", title: "Movie", scheduledAt: "2026-05-15T20:00:00+09:00" },
  { id: "june-1", title: "Trip", scheduledAt: "2026-06-01T09:00:00+09:00" },
  {
    id: "completed",
    title: "Completed",
    scheduledAt: "2026-05-03T12:00:00+09:00",
    completedAt: "2026-05-03T13:00:00+09:00"
  }
];

const visibleMonth = new Date("2026-05-01T00:00:00+09:00");

assertEqual(calendarMonthLabel(visibleMonth), "2026년 5월", "calendar month label uses Korean year and month");
assertEqual(
  calendarDateKey(new Date("2026-05-02T16:30:00Z")),
  "2026-05-03",
  "calendar date keys use Seoul local dates"
);

const month = buildCalendarMonth(visibleMonth, appointments);

assertEqual(month.weeks.length, 6, "month calendar always exposes six weeks");
assertEqual(month.weeks[0][0].key, "2026-04-26", "May 2026 grid starts on the Sunday before the month");
assertEqual(month.weeks[5][6].key, "2026-06-06", "May 2026 grid ends on the Saturday after the month");

const may3 = month.weeks.flat().find((day) => day.key === "2026-05-03");
assertEqual(may3?.appointmentCount, 3, "day count ignores completed appointments and groups by Seoul date");
assertEqual(may3?.isCurrentMonth, true, "selected month days are marked as current month");

const june1 = month.weeks.flat().find((day) => day.key === "2026-06-01");
assertEqual(june1?.appointmentCount, 1, "adjacent month cells still show appointment distribution");
assertEqual(june1?.isCurrentMonth, false, "adjacent month cells are marked outside the current month");

assertEqual(
  ids(appointmentsForCalendarDate(appointments, "2026-05-03")),
  "may-3-utc,may-3-afternoon,may-3-evening",
  "selected date appointments are sorted by time and ignore completed appointments"
);

assertEqual(appointmentIndicator(0), "none", "empty dates do not render an indicator");
assertEqual(appointmentIndicator(1), "single", "one appointment renders a single dot");
assertEqual(appointmentIndicator(3), "dots", "up to three appointments render dots");
assertEqual(appointmentIndicator(4), "count", "busy dates render a count badge");
