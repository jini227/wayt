import type { NotificationGroup } from "./notificationCatalog";

export type NotificationPreferences = Record<string, boolean>;
export type NotificationPreferenceApiItem = {
  type: string;
  enabled: boolean;
};
export type NotificationPreferencesResponse = {
  items: NotificationPreferenceApiItem[];
};
export type NotificationPreferencesPatchRequest = {
  items: NotificationPreferenceApiItem[];
};
export const NOTIFICATION_RESET_DIALOG_TITLE = "알림 설정을 초기화할까요?";
export const NOTIFICATION_RESET_DIALOG_MESSAGE = "설정한 알림 ON/OFF가 기본값으로 돌아가요.";
export const NOTIFICATION_RESET_DIALOG_CONFIRM_LABEL = "초기화";

export function buildDefaultNotificationPreferences(groups: readonly NotificationGroup[]): NotificationPreferences {
  return groups.reduce<NotificationPreferences>((preferences, group) => {
    for (const item of group.items) {
      preferences[item.id] = item.enabledByDefault;
    }
    return preferences;
  }, {});
}

export function toggleNotificationPreference(
  preferences: Readonly<NotificationPreferences>,
  notificationId: string
): NotificationPreferences {
  return {
    ...preferences,
    [notificationId]: !preferences[notificationId]
  };
}

export function enabledNotificationCount(preferences: Readonly<NotificationPreferences>) {
  return Object.values(preferences).filter(Boolean).length;
}

export function resetNotificationPreferences(
  defaults: Readonly<NotificationPreferences>
): NotificationPreferences {
  return { ...defaults };
}

export function mergeStoredNotificationPreferences(
  defaults: Readonly<NotificationPreferences>,
  storedValue: string | null
): NotificationPreferences {
  if (!storedValue) {
    return { ...defaults };
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...defaults };
    }

    const merged: NotificationPreferences = { ...defaults };
    for (const id of Object.keys(defaults)) {
      const value = (parsed as Record<string, unknown>)[id];
      if (typeof value === "boolean") {
        merged[id] = value;
      }
    }
    return merged;
  } catch {
    return { ...defaults };
  }
}

export function mergeServerNotificationPreferences(
  defaults: Readonly<NotificationPreferences>,
  response: NotificationPreferencesResponse | null
): NotificationPreferences {
  if (!response || !Array.isArray(response.items)) {
    return { ...defaults };
  }

  const merged: NotificationPreferences = { ...defaults };
  for (const item of response.items) {
    if (Object.prototype.hasOwnProperty.call(defaults, item.type)) {
      merged[item.type] = item.enabled;
    }
  }
  return merged;
}

export function notificationPreferencesPatchRequest(
  preferences: Readonly<NotificationPreferences>
): NotificationPreferencesPatchRequest {
  return {
    items: Object.entries(preferences).map(([type, enabled]) => ({ type, enabled }))
  };
}
