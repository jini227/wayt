import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuth } from "../auth/AuthContext";
import { notificationResponseRoute, registerForPushNotificationsAsync } from "./pushRegistration";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export function PushNotificationBridge() {
  const router = useRouter();
  const { user } = useAuth();
  const lastHandledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    void registerForPushNotificationsAsync();
  }, [user]);

  useEffect(() => {
    function openNotification(response: Notifications.NotificationResponse | null | undefined) {
      if (!response) {
        return;
      }
      const notificationId = response.notification.request.identifier;
      if (lastHandledNotificationId.current === notificationId) {
        return;
      }

      const route = notificationResponseRoute(response.notification.request.content.data);
      if (!route) {
        return;
      }

      lastHandledNotificationId.current = notificationId;
      router.push(route as never);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then(openNotification).catch(() => undefined);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}
