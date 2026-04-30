import { filterHomeAppointments } from "./homeAppointments";

type TestAppointment = {
  id: string;
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

const now = new Date("2026-05-01T10:00:00+09:00");

const appointments: TestAppointment[] = [
  {
    id: "today",
    scheduledAt: "2026-05-01T19:00:00+09:00",
    completedAt: null
  },
  {
    id: "tomorrow",
    scheduledAt: "2026-05-02T12:00:00+09:00",
    completedAt: null
  },
  {
    id: "today-completed",
    scheduledAt: "2026-05-01T14:00:00+09:00",
    completedAt: "2026-05-01T14:10:00+09:00"
  },
  {
    id: "utc-seoul-today",
    scheduledAt: "2026-04-30T16:30:00Z",
    completedAt: null
  }
];

assertEqual(
  ids(filterHomeAppointments(appointments, 0, now)),
  "today,tomorrow,today-completed,utc-seoul-today",
  "all tab keeps the incoming appointment list unchanged"
);

assertEqual(
  ids(filterHomeAppointments(appointments, 1, now)),
  "today,utc-seoul-today",
  "today tab lists only incomplete appointments scheduled today in Seoul"
);
