import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { tabs } from "../data/mock";
import { getBottomTabPressAction, isBottomTabActive } from "./bottomTabNavigation";
import { useScrollToTopRegistry } from "./ScrollToTopRegistry";

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { requestScrollToTop, scrollToTop } = useScrollToTopRegistry();

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = isBottomTabActive(pathname, tab.href);
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const action = getBottomTabPressAction(pathname, tab.href);

              if (action.type === "navigate") {
                requestScrollToTop(action.scrollRoute);
                router.replace(action.target as never);
              } else {
                scrollToTop(pathname);
              }
            }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Icon color={active ? colors.primary : "#6F737A"} size={active ? 23 : 22} strokeWidth={2.25} />
            <Text style={[styles.label, active && styles.active]}>{tab.label}</Text>
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
  item: {
    minWidth: 54,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  label: {
    color: "#6F737A",
    fontSize: 11,
    fontWeight: "600"
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
