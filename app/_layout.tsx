import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/AuthContext";
import { AuthGate } from "../src/auth/AuthGate";
import { AppFeedbackProvider } from "../src/feedback/AppFeedback";
import { PushNotificationBridge } from "../src/notifications/PushNotificationBridge";
import { ScrollToTopProvider } from "../src/components/ScrollToTopRegistry";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppFeedbackProvider>
          <ScrollToTopProvider>
            <PushNotificationBridge />
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#ffffff" },
                animation: "slide_from_right"
              }}
            >
              <Stack.Screen name="appointments/new" options={{ gestureEnabled: false }} />
            </Stack>
          </ScrollToTopProvider>
        </AppFeedbackProvider>
      </AuthGate>
    </AuthProvider>
  );
}
