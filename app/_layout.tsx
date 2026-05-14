import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { AuthProvider } from "../src/auth/AuthContext";
import { AuthGate } from "../src/auth/AuthGate";
import { AppFeedbackProvider } from "../src/feedback/AppFeedback";
import { PushNotificationBridge } from "../src/notifications/PushNotificationBridge";
import { ScrollToTopProvider } from "../src/components/ScrollToTopRegistry";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { shouldShowDesktopSideNav } from "../src/components/webDesktopLayout";
import { useAuth } from "../src/auth/AuthContext";

export default function RootLayout() {
  const pathname = usePathname();

  if (pathname === "/naver-map-frame") {
    return <AppStack />;
  }

  return (
    <AuthProvider>
      <AuthGate>
        <AppFeedbackProvider>
          <ScrollToTopProvider>
            <View style={styles.root}>
              <PushNotificationBridge />
              <StatusBar style="dark" backgroundColor="#ffffff" />
              <AppStack />
              <DesktopSideNavigation />
            </View>
          </ScrollToTopProvider>
        </AppFeedbackProvider>
      </AuthGate>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});

function DesktopSideNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || !shouldShowDesktopSideNav(pathname)) {
    return null;
  }

  return <BottomTabBar variant="desktop" />;
}

function AppStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="appointments/new" options={{ gestureEnabled: false }} />
      <Stack.Screen name="naver-map-frame" options={{ animation: "none" }} />
    </Stack>
  );
}
