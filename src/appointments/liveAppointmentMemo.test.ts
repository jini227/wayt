import { displayAppointmentMemo } from "./liveAppointmentMemo";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(
  displayAppointmentMemo("  Bring the reservation name  "),
  "Bring the reservation name",
  "appointment detail shows the saved memo text"
);

assertEqual(
  displayAppointmentMemo("   "),
  null,
  "appointment detail hides empty memo text"
);

assertEqual(
  displayAppointmentMemo(null),
  null,
  "appointment detail hides missing memo text"
);
