import {
  getBottomTabNavigationTarget,
  getBottomTabPressAction,
  isBottomTabActive
} from "./bottomTabNavigation";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(isBottomTabActive("/", "/"), true, "home tab is active only on home");
assertEqual(isBottomTabActive("/appointments/new", "/"), true, "new appointment keeps the home tab active");
assertEqual(isBottomTabActive("/appointments/calendar", "/"), true, "appointment calendar keeps the home tab active");
assertEqual(isBottomTabActive("/appointments/abc123", "/"), true, "appointment detail keeps the home tab active");
assertEqual(isBottomTabActive("/history/appointment-1", "/history"), true, "history detail keeps history tab active");
assertEqual(isBottomTabActive("/appointments/next", "/appointments/next"), true, "next tab is active on next appointment");
assertEqual(isBottomTabActive("/appointments/new", "/appointments/next"), false, "new appointment does not activate next tab");
assertEqual(isBottomTabActive("/appointments/calendar", "/appointments/next"), false, "appointment calendar does not activate next tab");
assertEqual(
  getBottomTabNavigationTarget("/appointments/next", "/appointments/next"),
  null,
  "pressing the active tab does not navigate"
);
assertEqual(
  getBottomTabNavigationTarget("/appointments/abc123", "/"),
  "/",
  "pressing the active home tab from appointment detail returns to the home list"
);
assertEqual(
  getBottomTabNavigationTarget("/history/appointment-1", "/history"),
  "/history",
  "pressing the active history tab from history detail returns to the history list"
);
assertEqual(
  getBottomTabNavigationTarget("/appointments/next", "/history"),
  "/history",
  "pressing an inactive tab navigates to its href"
);

const activePressAction = getBottomTabPressAction("/appointments/next", "/appointments/next");
assertEqual(activePressAction.type, "scrollToTop", "pressing the active tab scrolls the current screen to top");

const activeNestedPressAction = getBottomTabPressAction("/appointments/abc123", "/");
assertEqual(activeNestedPressAction.type, "navigate", "pressing home from appointment detail navigates to the home list");
if (activeNestedPressAction.type !== "navigate") {
  throw new Error("active nested home press should be a navigation action");
}
assertEqual(activeNestedPressAction.target, "/", "active nested home press targets the home list");

const inactivePressAction = getBottomTabPressAction("/appointments/next", "/history");
assertEqual(inactivePressAction.type, "navigate", "pressing an inactive tab returns a navigation action");
if (inactivePressAction.type !== "navigate") {
  throw new Error("inactive tab press should be a navigation action");
}
assertEqual(inactivePressAction.target, "/history", "inactive tab navigation action keeps the target href");
assertEqual(inactivePressAction.scrollRoute, "/history", "inactive tab navigation scrolls the target route to top");
assertEqual(inactivePressAction.historyAction, "replace", "inactive tab navigation replaces the current tab route");
