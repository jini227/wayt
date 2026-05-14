import { useCallback, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode, type Ref } from "react";
import { useFocusEffect, usePathname } from "expo-router";
import type { ScrollViewProps } from "react-native";
import { KeyboardAvoidingView, PanResponder, Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import {
  shouldCompleteDownwardDismissDrag,
  shouldStartDownwardDismissDrag
} from "../gestures/dismissDragGesture";
import { useScrollToTopRegistry } from "./ScrollToTopRegistry";
import { scrollVisibleContentToTop } from "./scrollToTop";

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
  onPullDownDismiss
}: AppScreenProps) {
  const pathname = usePathname();
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

  const body = noScroll ? (
    <View style={[styles.content, styles.noScrollContent, withTabs && styles.withTabs]}>{children}</View>
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
        withTabs ? styles.withTabs : undefined,
        footer ? styles.withFooter : undefined
      ]}
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
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
  withFooter: {
    paddingBottom: 112
  }
});
