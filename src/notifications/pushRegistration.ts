import { Platform } from "react-native";

type ExpoProjectConfig = {
  easConfig?: {
    projectId?: string | null;
  } | null;
  expoConfig?: {
    version?: string | null;
    extra?: {
      eas?: {
        projectId?: string | null;
      } | null;
      appEnvironment?: string | null;
    } | null;
  } | null;
};

export type PushRegistrationDisabledReason =
  | "not-physical-device"
  | "missing-project-id"
  | "permission-denied";

export type PushRegistrationGate =
  | { enabled: true; reason: null }
  | { enabled: false; reason: PushRegistrationDisabledReason };

export type PushTokenPayload = {
  token: string;
  platform: string;
  environment: string;
  deviceId?: string | null;
  appVersion?: string | null;
};

export type PushRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "disabled"; reason: PushRegistrationDisabledReason }
  | { status: "failed"; reason: string };

export function resolveExpoProjectId(constants: ExpoProjectConfig) {
  return firstNonBlank(
    constants.easConfig?.projectId,
    constants.expoConfig?.extra?.eas?.projectId
  );
}

export function shouldRequestPushToken({
  isDevice,
  projectId,
  permissionStatus
}: {
  isDevice: boolean;
  projectId: string | null;
  permissionStatus: string;
}): PushRegistrationGate {
  if (!isDevice) {
    return { enabled: false, reason: "not-physical-device" };
  }
  if (!projectId) {
    return { enabled: false, reason: "missing-project-id" };
  }
  if (permissionStatus !== "granted") {
    return { enabled: false, reason: "permission-denied" };
  }
  return { enabled: true, reason: null };
}

export function buildPushTokenPayload(payload: PushTokenPayload): PushTokenPayload {
  return {
    token: payload.token,
    platform: payload.platform,
    environment: payload.environment,
    deviceId: payload.deviceId,
    appVersion: payload.appVersion
  };
}

export function notificationResponseRoute(data: Record<string, unknown>) {
  const route = stringValue(data.route);
  if (route) {
    return route;
  }

  const appointmentId = stringValue(data.appointmentId);
  if (appointmentId) {
    return `/appointments/${appointmentId}`;
  }

  return null;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  try {
    const [Notifications, Device, Constants] = await Promise.all([
      import("expo-notifications"),
      import("expo-device"),
      import("expo-constants")
    ]);
    const { apiPostAuthenticated } = await import("../api/client");

    const constants = Constants.default as ExpoProjectConfig;
    const projectId = resolveExpoProjectId(constants);
    const physicalDeviceGate = shouldRequestPushToken({
      isDevice: Device.isDevice,
      projectId,
      permissionStatus: "granted"
    });
    if (!physicalDeviceGate.enabled) {
      return { status: "disabled", reason: physicalDeviceGate.reason };
    }

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;
    if (finalStatus !== "granted") {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    const permissionGate = shouldRequestPushToken({
      isDevice: Device.isDevice,
      projectId,
      permissionStatus: finalStatus
    });
    if (!permissionGate.enabled) {
      return { status: "disabled", reason: permissionGate.reason };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "기본 알림",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1478FF"
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: projectId! })).data;
    await apiPostAuthenticated("/push-tokens", buildPushTokenPayload({
      token,
      platform: Platform.OS,
      environment: appEnvironment(constants),
      deviceId: firstNonBlank((constants as { sessionId?: string | null }).sessionId) ?? undefined,
      appVersion: constants.expoConfig?.version ?? undefined
    }));

    return { status: "registered", token };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Push registration failed"
    };
  }
}

function appEnvironment(constants: ExpoProjectConfig) {
  return firstNonBlank(
    constants.expoConfig?.extra?.appEnvironment,
    process.env.EXPO_PUBLIC_APP_ENV,
    typeof __DEV__ !== "undefined" && __DEV__ ? "development" : "production"
  ) ?? "production";
}

function firstNonBlank(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
