import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "./AuthContext";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    const authPath = pathname.startsWith("/auth");
    const onboardingPath = pathname === "/onboarding/travel-mode";
    const publicAppointmentPath = /^\/appointments\/[0-9a-fA-F-]{36}$/.test(pathname);
    if (!user && pathname !== "/login" && !authPath && !publicAppointmentPath) {
      router.replace("/login");
    }
    if (user && pathname === "/login") {
      router.replace("/");
    }
    if (user && !user.travelModeOnboardingCompleted && !onboardingPath && !authPath) {
      router.replace("/onboarding/travel-mode");
    }
    if (user && user.travelModeOnboardingCompleted && onboardingPath) {
      router.replace("/");
    }
  }, [loading, pathname, router, user]);

  return children;
}
