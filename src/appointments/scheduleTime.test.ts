import {
  MINUTE_OPTIONS,
  availableTimesForDate,
  validTimeForDate
} from "./scheduleTime";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(value: boolean, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

const now = new Date("2026-05-01T12:34:15+09:00");
const today = new Date("2026-05-01T00:00:00+09:00");
const tomorrow = new Date("2026-05-02T00:00:00+09:00");

assertEqual(MINUTE_OPTIONS.length, 60, "time wheel exposes every minute");
assertEqual(MINUTE_OPTIONS[0], 0, "minute wheel starts at 00");
assertEqual(MINUTE_OPTIONS[59], 59, "minute wheel ends at 59");
assertTrue(MINUTE_OPTIONS.includes(17), "minute wheel includes arbitrary one-minute values");

const todayTimes = availableTimesForDate(today, now);

assertEqual(todayTimes[0], "12:35", "today starts at the next future minute");
assertEqual(todayTimes[1], "12:36", "today increments by one minute");
assertTrue(todayTimes.includes("19:17"), "today includes non-half-hour minute selections");

const tomorrowTimes = availableTimesForDate(tomorrow, now);

assertEqual(tomorrowTimes.length, 24 * 60, "future dates expose every minute in the day");
assertEqual(tomorrowTimes[1], "00:01", "future dates include one-minute increments from midnight");
assertEqual(tomorrowTimes[1439], "23:59", "future dates include the last minute of the day");

assertEqual(validTimeForDate(today, "12:34", now), "12:35", "past selected minute moves to next valid minute");
assertEqual(validTimeForDate(today, "12:35", now), "12:35", "future selected minute is kept");
