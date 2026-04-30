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
assertEqual(isBottomTabActive("/history/appointment-1", "/history"), true, "history detail keeps history tab active");
assertEqual(isBottomTabActive("/appointments/next", "/appointments/next"), true, "next tab is active on next appointment");
assertEqual(
  getBottomTabNavigationTarget("/appointments/next", "/appointments/next"),
  null,
  "pressing the active tab does not navigate"
);
assertEqual(
  getBottomTabNavigationTarget("/appointments/next", "/history"),
  "/history",
  "pressing an inactive tab navigates to its href"
);

const activePressAction = getBottomTabPressAction("/appointments/next", "/appointments/next");
assertEqual(activePressAction.type, "scrollToTop", "pressing the active tab scrolls the current screen to top");

const inactivePressAction = getBottomTabPressAction("/appointments/next", "/history");
assertEqual(inactivePressAction.type, "navigate", "pressing an inactive tab returns a navigation action");
if (inactivePressAction.type !== "navigate") {
  throw new Error("inactive tab press should be a navigation action");
}
assertEqual(inactivePressAction.target, "/history", "inactive tab navigation action keeps the target href");
assertEqual(inactivePressAction.scrollRoute, "/history", "inactive tab navigation scrolls the target route to top");
assertEqual(inactivePressAction.historyAction, "replace", "inactive tab navigation replaces the current tab route");
