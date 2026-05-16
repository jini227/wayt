import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { DESKTOP_SINGLE_COLUMN_MAX_WIDTH, isDesktopWebLayout } from "./webDesktopLayout";

export function FooterBar({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const desktopWeb = isDesktopWebLayout(width);

  return <View style={[styles.footer, desktopWeb && styles.desktopFooter]}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "#DADDE3",
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10
  },
  desktopFooter: {
    position: "relative",
    width: "100%",
    maxWidth: DESKTOP_SINGLE_COLUMN_MAX_WIDTH,
    alignSelf: "flex-start",
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 26,
    borderTopWidth: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0
  }
});
