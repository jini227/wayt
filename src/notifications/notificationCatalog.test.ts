import {
  highPriorityNotificationCount,
  notificationGroups,
  notificationSummaryLabel,
  recommendedNotificationCount
} from "./notificationCatalog";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(notificationGroups.length, 4, "notification catalog has current and recommended groups");
assertEqual(notificationGroups[0]?.title, "기본 알림", "current notifications stay at the top");
assertEqual(notificationGroups[1]?.title, "우선순위 높음", "high priority recommendations are second");
assertEqual(highPriorityNotificationCount(notificationGroups), 7, "high priority group includes seven recommendations");
assertEqual(recommendedNotificationCount(notificationGroups), 18, "recommended count excludes current notifications");
assertEqual(notificationSummaryLabel(notificationGroups), "추천 알림 18개", "profile summary shows recommended count");
assertEqual(
  notificationGroups.flatMap((group) => group.items).some((item) => item.title === "출발 추천 알림"),
  true,
  "catalog includes departure recommendation"
);
assertEqual(
  notificationGroups.flatMap((group) => group.items).some((item) => item.title === "ETA 갱신 알림"),
  true,
  "catalog includes ETA update notification"
);
