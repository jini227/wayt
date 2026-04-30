import {
  buildPushTokenPayload,
  notificationResponseRoute,
  resolveExpoProjectId,
  shouldRequestPushToken
} from "./pushRegistration";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(
  resolveExpoProjectId({
    easConfig: { projectId: "eas-project" },
    expoConfig: { extra: { eas: { projectId: "extra-project" } } }
  }),
  "eas-project",
  "EAS project id takes priority"
);

assertEqual(
  resolveExpoProjectId({
    expoConfig: { extra: { eas: { projectId: "extra-project" } } }
  }),
  "extra-project",
  "expoConfig extra EAS project id is used as fallback"
);

assertEqual(resolveExpoProjectId({}), null, "missing project id disables push instead of crashing");

assertEqual(
  shouldRequestPushToken({ isDevice: false, projectId: "project", permissionStatus: "granted" }).enabled,
  false,
  "non-device environments do not request push tokens"
);

assertEqual(
  shouldRequestPushToken({ isDevice: true, projectId: null, permissionStatus: "granted" }).reason,
  "missing-project-id",
  "missing project id is reported as a disabled push state"
);

assertEqual(
  shouldRequestPushToken({ isDevice: true, projectId: "project", permissionStatus: "denied" }).reason,
  "permission-denied",
  "denied notification permission is reported without throwing"
);

const payload = buildPushTokenPayload({
  token: "ExpoPushToken[abc]",
  platform: "ios",
  environment: "production",
  deviceId: "device-1",
  appVersion: "1.2.3"
});

assertEqual(payload.token, "ExpoPushToken[abc]", "push token payload keeps the Expo token");
assertEqual(payload.platform, "ios", "push token payload keeps platform");
assertEqual(payload.environment, "production", "push token payload keeps environment");
assertEqual(payload.deviceId, "device-1", "push token payload keeps device id");
assertEqual(payload.appVersion, "1.2.3", "push token payload keeps app version");

assertEqual(
  notificationResponseRoute({ route: "/appointments/123", appointmentId: "123" }),
  "/appointments/123",
  "notification data route is used directly"
);
assertEqual(
  notificationResponseRoute({ appointmentId: "456" }),
  "/appointments/456",
  "appointment id falls back to appointment detail route"
);
assertEqual(notificationResponseRoute({}), null, "missing notification routing data is ignored");
