import { useCallback, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode, type Ref } from "react";
import { useFocusEffect, usePathname } from "expo-router";
import type { ScrollViewProps } from "react-native";
import { KeyboardAvoidingView, PanResponder, Platform, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import {
  shouldCompleteDownwardDismissDrag,
  shouldStartDownwardDismissDrag
} from "../gestures/dismissDragGesture";
import { useScrollToTopRegistry } from "./ScrollToTopRegistry";
import { scrollVisibleContentToTop } from "./scrollToTop";
import {
  DESKTOP_ASIDE_WIDTH,
  DESKTOP_CONTENT_MAX_WIDTH,
  DESKTOP_SIDEBAR_WIDTH,
  DESKTOP_SINGLE_COLUMN_MAX_WIDTH,
  isDesktopWebLayout,
  shouldShowDesktopSideNav
} from "./webDesktopLayout";

type AppScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  withTabs?: boolean;
  noScroll?: boolean;
  scrollRef?: Ref<ScrollView>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
  keyboardAvoiding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPullDownDismiss?: () => void;
  desktopAside?: ReactNode;
};

export function AppScreen({
  children,
  footer,
  withTabs,
  noScroll,
  scrollRef,
  keyboardShouldPersistTaps,
  keyboardAvoiding,
  refreshing,
  onRefresh,
  onPullDownDismiss,
  desktopAside
}: AppScreenProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const desktopWeb = isDesktopWebLayout(width);
  const desktopSidebar = Boolean(desktopWeb && shouldShowDesktopSideNav(pathname));
  const internalScrollRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef(0);
  const { consumeScrollToTopRequest, registerScrollToTop } = useScrollToTopRegistry();
  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      internalScrollRef.current = node;
      assignScrollRef(scrollRef, node);
    },
    [scrollRef]
  );
  const pullDownDismissPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Boolean(
            onPullDownDismiss &&
              scrollYRef.current <= 0 &&
              shouldStartDownwardDismissDrag(gestureState)
          ),
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Boolean(
            onPullDownDismiss &&
              scrollYRef.current <= 0 &&
              shouldStartDownwardDismissDrag(gestureState)
          ),
        onPanResponderRelease: (_, gestureState) => {
          if (
            onPullDownDismiss &&
            scrollYRef.current <= 0 &&
            shouldCompleteDownwardDismissDrag(gestureState)
          ) {
            onPullDownDismiss();
          }
        }
      }),
    [onPullDownDismiss]
  );
  const pullDownDismissHandlers = onPullDownDismiss ? pullDownDismissPanResponder.panHandlers : {};

  useEffect(() => {
    if (noScroll || !withTabs) {
      return undefined;
    }

    return registerScrollToTop(pathname, () => {
      scrollVisibleContentToTop({
        currentY: scrollYRef.current,
        scrollable: internalScrollRef.current
      });
    });
  }, [noScroll, pathname, registerScrollToTop, withTabs]);

  useFocusEffect(
    useCallback(() => {
      if (noScroll || !withTabs) {
        return undefined;
      }

      const scrollIfRequested = () => {
        consumeScrollToTopRequest(pathname);
      };
      const frame = scheduleScrollToTop(scrollIfRequested);
      const timeout = setTimeout(scrollIfRequested, 80);

      return () => {
        cancelScheduledScrollToTop(frame);
        clearTimeout(timeout);
      };
    }, [consumeScrollToTopRequest, noScroll, pathname, withTabs])
  );

  const content = desktopWeb ? (
    <View style={[styles.desktopGrid, !desktopAside && styles.desktopGridSingle]}>
      <View style={styles.desktopMain}>{children}</View>
      {desktopAside ? <View style={styles.desktopAside}>{desktopAside}</View> : null}
    </View>
  ) : (
    children
  );

  const body = noScroll ? (
    <View
      style={[
        styles.content,
        styles.noScrollContent,
        withTabs && (desktopWeb ? styles.withDesktopTabs : styles.withTabs),
        desktopWeb && styles.desktopContent
      ]}
    >
      {content}
    </View>
  ) : (
    <ScrollView
      {...pullDownDismissHandlers}
      ref={setScrollRef}
      onScroll={(event) => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={
        onRefresh ? (
          onPullDownDismiss ? undefined : (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          )
        ) : undefined
      }
      contentContainerStyle={[
        styles.content,
        withTabs ? (desktopWeb ? styles.withDesktopTabs : styles.withTabs) : undefined,
        desktopWeb && styles.desktopContent,
        footer ? (desktopWeb ? styles.withDesktopFooter : styles.withFooter) : undefined
      ]}
    >
      {content}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, desktopWeb && styles.desktopPage, desktopSidebar && styles.desktopSafe]} edges={["top", "left", "right"]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
      {footer}
    </SafeAreaView>
  );
}

function scheduleScrollToTop(scrollToTop: () => void) {
  if (typeof requestAnimationFrame !== "function") {
    return { type: "timeout" as const, handle: setTimeout(scrollToTop, 0) };
  }

  return { type: "frame" as const, handle: requestAnimationFrame(scrollToTop) };
}

function cancelScheduledScrollToTop(schedule: ReturnType<typeof scheduleScrollToTop>) {
  if (schedule.type === "frame" && typeof cancelAnimationFrame === "function") {
    const handle = schedule.handle;
    cancelAnimationFrame(handle);
  } else {
    clearTimeout(schedule.handle);
  }
}

function assignScrollRef(ref: Ref<ScrollView> | undefined, value: ScrollView | null) {
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  (ref as MutableRefObject<ScrollView | null>).current = value;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  desktopPage: {
    backgroundColor: "#F6F8FB"
  },
  desktopSafe: {
    paddingLeft: DESKTOP_SIDEBAR_WIDTH
  },
  body: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 22,
    paddingBottom: 34
  },
  noScrollContent: {
    flex: 1
  },
  withTabs: {
    paddingBottom: 112
  },
  withDesktopTabs: {
    paddingBottom: 48
  },
  withFooter: {
    paddingBottom: 112
  },
  withDesktopFooter: {
    paddingBottom: 24
  },
  desktopContent: {
    paddingHorizontal: 40,
    paddingTop: 34
  },
  desktopGrid: {
    width: "100%",
    maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24
  },
  desktopGridSingle: {
    maxWidth: DESKTOP_SINGLE_COLUMN_MAX_WIDTH
  },
  desktopMain: {
    flex: 1,
    minWidth: 0
  },
  desktopAside: {
    width: DESKTOP_ASIDE_WIDTH,
    flexShrink: 0
  }
});
