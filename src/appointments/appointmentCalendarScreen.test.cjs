const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.join(__dirname, "..", "..");
const homePath = path.join(root, "app", "index.tsx");
const calendarPath = path.join(root, "app", "appointments", "calendar.tsx");
const homeSource = fs.readFileSync(homePath, "utf8");

assert(
  homeSource.includes('router.push("/appointments/calendar")'),
  "home floating calendar button routes to the appointment calendar screen"
);
assert(
  homeSource.includes('accessibilityLabel="약속 달력 보기"'),
  "home floating calendar button has an explicit accessibility label"
);
assert(
  homeSource.includes("styles.calendarFab"),
  "home uses a separate stacked style for the calendar floating button"
);

assert(fs.existsSync(calendarPath), "appointment calendar is implemented as a full-screen route");

const calendarSource = fs.readFileSync(calendarPath, "utf8");

assert(
  calendarSource.includes("calendarGridDateRange") &&
    calendarSource.includes("`/appointments?scope=all&from=${encodeURIComponent(visibleDateRange.from)}&to=${encodeURIComponent(visibleDateRange.to)}`"),
  "calendar screen loads the visible calendar range"
);
assert(
  calendarSource.includes("buildCalendarMonth") &&
    calendarSource.includes("appointmentsForCalendarDate") &&
    calendarSource.includes("appointmentIndicator"),
  "calendar screen uses the tested calendar view-model helpers"
);
assert(
  !calendarSource.includes("BottomTabBar"),
  "calendar route stays a tabless full-screen subpage"
);
assert(
  calendarSource.includes('router.push(`/appointments/${appointment.id}`)'),
  "calendar appointment rows open the existing appointment detail route"
);
assert(
  calendarSource.includes("const closeCalendar = useCallback(() =>") &&
    calendarSource.includes("router.back();") &&
    calendarSource.includes("onPullDownDismiss={closeCalendar}"),
  "calendar screen closes when pulled downward from the top"
);
