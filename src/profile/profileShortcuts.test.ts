import { profileSectionOrder, profileShortcutRows } from "./profileShortcuts";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(profileSectionOrder[0], "profileSettings", "profile settings appear before shortcuts");
assertEqual(profileSectionOrder[1], "shortcutBlock", "shortcut block appears below profile settings");
assertEqual(
  profileSectionOrder.join(","),
  "profileSettings,shortcutBlock",
  "profile sections follow the visible order"
);
assertEqual(profileShortcutRows[0]?.id, "addressBook", "address book is the first row inside shortcut block");
assertEqual(profileShortcutRows[1]?.id, "notifications", "notifications are the second row inside shortcut block");
assertEqual(profileShortcutRows.length, 2, "address book and notifications share one shortcut block");
