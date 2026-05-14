import { Platform } from "react-native";

export const DESKTOP_WEB_BREAKPOINT = 1024;
export const DESKTOP_SIDEBAR_WIDTH = 248;
export const DESKTOP_CONTENT_MAX_WIDTH = 1280;
export const DESKTOP_SINGLE_COLUMN_MAX_WIDTH = 1040;
export const DESKTOP_ASIDE_WIDTH = 332;

export function isDesktopWebLayout(width: number) {
  return Platform.OS === "web" && width >= DESKTOP_WEB_BREAKPOINT;
}

export function shouldShowDesktopSideNav(pathname: string) {
  return !(
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/naver-map-frame"
  );
}
