export type ProfileSectionId = "profileSettings" | "shortcutBlock";
export type ProfileShortcutId = "addressBook" | "notifications";

export const profileSectionOrder: readonly ProfileSectionId[] = [
  "profileSettings",
  "shortcutBlock"
];

export const profileShortcutRows: readonly { id: ProfileShortcutId }[] = [
  { id: "addressBook" },
  { id: "notifications" }
];
