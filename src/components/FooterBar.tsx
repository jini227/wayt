import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export function FooterBar({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
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
  }
});
