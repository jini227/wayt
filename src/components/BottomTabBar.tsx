import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors } from "../theme";
import { tabs } from "../data/mock";
import { getBottomTabPressAction, isBottomTabActive } from "./bottomTabNavigation";
import { useScrollToTopRegistry } from "./ScrollToTopRegistry";
import { DESKTOP_SIDEBAR_WIDTH, isDesktopWebLayout } from "./webDesktopLayout";

type BottomTabBarVariant = "mobile" | "desktop" | "all";

export function BottomTabBar({ variant = "mobile" }: { variant?: BottomTabBarVariant } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { fromTab } = useGlobalSearchParams<{ fromTab?: string | string[] }>();
  const { width } = useWindowDimensions();
  const desktopWeb = isDesktopWebLayout(width);
  const { requestScrollToTop, scrollToTop } = useScrollToTopRegistry();
  const sourceTabHref = getSourceTabHref(fromTab);

  const handleTabPress = (href: string) => {
    const action = getBottomTabPressAction(pathname, href);

    if (action.type === "navigate") {
      requestScrollToTop(action.scrollRoute);
      router.replace(action.target as never);
      return;
    }

    scrollToTop(pathname);
  };

  if (variant === "mobile" && desktopWeb) {
    return null;
  }

  if (variant === "desktop" && !desktopWeb) {
    return null;
  }

  return (
    <View style={[styles.wrap, desktopWeb && styles.desktopWrap]}>
      {desktopWeb ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="홈으로 이동"
          onPress={() => handleTabPress("/")}
          style={({ pressed }) => [styles.desktopBrand, pressed && styles.desktopBrandPressed]}
        >
          <View style={styles.desktopBrandTitleRow}>
            <Image source={require("../../assets/wayt-icon.png")} style={styles.desktopBrandIcon} />
            <Text style={styles.desktopLogo}>WAYT</Text>
          </View>
          <Text style={styles.desktopTagline}>약속 이동을 한눈에</Text>
        </Pressable>
      ) : null}
      {tabs.map((tab) => {
        const active = isBottomTabActive(pathname, tab.href, { sourceTabHref });
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => handleTabPress(tab.href)}
            style={({ pressed }) => [
              styles.item,
              desktopWeb && styles.desktopItem,
              desktopWeb && active && styles.desktopItemActive,
              pressed && styles.pressed
            ]}
          >
            <Icon color={active ? colors.primary : "#6F737A"} size={active ? 23 : 22} strokeWidth={2.25} />
            <Text style={[styles.label, desktopWeb && styles.desktopLabel, active && styles.active]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 74,
    paddingTop: 7,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
    backgroundColor: "rgba(255,255,255,0.98)",
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#101828",
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12
  },
  desktopWrap: {
    top: 0,
    right: undefined,
    width: DESKTOP_SIDEBAR_WIDTH,
    minHeight: "100%",
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: "#E7EAF0",
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    zIndex: 1000,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 8, height: 0 },
    elevation: 1000
  },
  desktopBrand: {
    paddingHorizontal: 8,
    paddingBottom: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5"
  },
  desktopBrandPressed: {
    opacity: 0.82
  },
  desktopBrandTitleRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  desktopBrandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8
  },
  desktopLogo: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0
  },
  desktopTagline: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5
  },
  item: {
    minWidth: 54,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  desktopItem: {
    width: "100%",
    height: 50,
    minWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 12,
    marginTop: 4
  },
  desktopItemActive: {
    backgroundColor: colors.primarySoft
  },
  label: {
    color: "#6F737A",
    fontSize: 11,
    fontWeight: "600"
  },
  desktopLabel: {
    fontSize: 15,
    fontWeight: "800"
  },
  active: {
    color: colors.primary,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }]
  }
});

function getSourceTabHref(fromTab?: string | string[]) {
  const value = Array.isArray(fromTab) ? fromTab[0] : fromTab;
  return value === "next" ? "/appointments/next" : null;
}
