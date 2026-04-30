import {
  buildDefaultNotificationPreferences,
  enabledNotificationCount,
  mergeStoredNotificationPreferences,
  mergeServerNotificationPreferences,
  NOTIFICATION_RESET_DIALOG_CONFIRM_LABEL,
  NOTIFICATION_RESET_DIALOG_MESSAGE,
  NOTIFICATION_RESET_DIALOG_TITLE,
  notificationPreferencesPatchRequest,
  resetNotificationPreferences,
  toggleNotificationPreference
} from "./notificationPreferences";
import { notificationGroups } from "./notificationCatalog";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const defaults = buildDefaultNotificationPreferences(notificationGroups);

assertEqual(defaults["appointment-invite"], true, "basic invitation notifications are enabled by default");
assertEqual(defaults["location-share-start"], true, "location sharing notifications are enabled by default");
assertEqual(defaults["history-saved"], false, "later-stage notifications are disabled by default");
assertEqual(enabledNotificationCount(defaults), 10, "default preferences enable current and high-priority notifications");

const disabledInvite = toggleNotificationPreference(defaults, "appointment-invite");
assertEqual(disabledInvite["appointment-invite"], false, "toggle turns an enabled notification off");
assertEqual(defaults["appointment-invite"], true, "toggle keeps the previous preference object immutable");

const enabledHistory = toggleNotificationPreference(defaults, "history-saved");
assertEqual(enabledHistory["history-saved"], true, "toggle turns a disabled notification on");

const merged = mergeStoredNotificationPreferences(defaults, JSON.stringify({
  "appointment-invite": false,
  "history-saved": true,
  "unknown-notification": true
}));
assertEqual(merged["appointment-invite"], false, "stored preferences override known defaults");
assertEqual(merged["history-saved"], true, "stored preferences restore enabled later-stage choices");
assertEqual(merged["unknown-notification"], undefined, "stored preferences ignore unknown notification ids");
const fallback = mergeStoredNotificationPreferences(defaults, "{");
assertEqual(fallback["appointment-invite"], true, "invalid stored preferences fall back to defaults");

const serverMerged = mergeServerNotificationPreferences(defaults, {
  items: [
    { type: "appointment-invite", enabled: false },
    { type: "history-saved", enabled: true },
    { type: "unknown-notification", enabled: true }
  ]
});
assertEqual(serverMerged["appointment-invite"], false, "server preferences override known defaults");
assertEqual(serverMerged["history-saved"], true, "server preferences restore later-stage choices");
assertEqual(serverMerged["unknown-notification"], undefined, "server preferences ignore unknown notification ids");

const patchRequest = notificationPreferencesPatchRequest({
  "appointment-invite": false,
  "history-saved": true
});
assertEqual(patchRequest.items.length, 2, "patch request includes every preference item");
assertEqual(patchRequest.items[0].type, "appointment-invite", "patch request keeps preference ids as API types");
assertEqual(patchRequest.items[0].enabled, false, "patch request includes disabled values");

const changed = toggleNotificationPreference(defaults, "appointment-invite");
const reset = resetNotificationPreferences(defaults);
assertEqual(changed["appointment-invite"], false, "changed preferences can differ from defaults before reset");
assertEqual(reset["appointment-invite"], true, "reset restores enabled defaults");
assertEqual(reset["history-saved"], false, "reset restores disabled defaults");
assertEqual(reset === defaults, false, "reset returns a new preference object");
assertEqual(
  NOTIFICATION_RESET_DIALOG_TITLE,
  "알림 설정을 초기화할까요?",
  "reset dialog title asks before resetting"
);
assertEqual(
  NOTIFICATION_RESET_DIALOG_MESSAGE,
  "설정한 알림 ON/OFF가 기본값으로 돌아가요.",
  "reset dialog message explains the reset effect"
);
assertEqual(
  NOTIFICATION_RESET_DIALOG_CONFIRM_LABEL,
  "초기화",
  "reset dialog confirm action is clear"
);
