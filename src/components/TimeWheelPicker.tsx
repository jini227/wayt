import { useEffect, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MINUTE_OPTIONS, pad } from "../appointments/scheduleTime";
import { colors } from "../theme";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const PERIOD_OPTIONS = ["오전", "오후"] as const;
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_HEIGHT = 158;

type TimePeriod = (typeof PERIOD_OPTIONS)[number];
type WheelValue = TimePeriod | number;

export function TimeWheelPicker({
  selectedTime,
  onSelectTime,
  normalizeTime = (time) => time,
  disabled = false,
  style
}: {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  normalizeTime?: (time: string) => string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const normalizedTime = normalizeTime(selectedTime ?? "19:00");
  const parts = timeParts(normalizedTime);

  const select = (next: Partial<{ period: TimePeriod; hour: number; minute: number }>) => {
    if (disabled) {
      return;
    }

    const period = next.period ?? parts.period;
    const hour = next.hour ?? parts.hour;
    const minute = next.minute ?? parts.minute;
    const hour24 = period === "오전" ? hour % 12 : (hour % 12) + 12;
    onSelectTime(normalizeTime(`${pad(hour24)}:${pad(minute)}`));
  };

  return (
    <View style={[styles.spinnerPanel, style, disabled && styles.disabled]}>
      <View style={styles.spinnerHighlight} />
      <SpinnerColumn
        options={PERIOD_OPTIONS}
        value={parts.period}
        onChange={(period) => select({ period })}
        disabled={disabled}
      />
      <SpinnerColumn
        options={HOUR_OPTIONS}
        value={parts.hour}
        onChange={(hour) => select({ hour })}
        disabled={disabled}
      />
      <SpinnerColumn
        options={MINUTE_OPTIONS}
        value={parts.minute}
        formatLabel={(minute) => pad(minute)}
        onChange={(minute) => select({ minute })}
        disabled={disabled}
      />
    </View>
  );
}

function SpinnerColumn<T extends WheelValue>({
  options,
  value,
  onChange,
  formatLabel = (option) => String(option),
  disabled
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (value: T) => string;
  disabled: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(options.indexOf(value), 0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (disabled) {
      return;
    }

    const nextIndex = Math.min(
      options.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT))
    );
    const nextValue = options[nextIndex];
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <View style={styles.spinnerColumn}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        scrollEnabled={!disabled}
        contentContainerStyle={styles.spinnerScrollContent}
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              disabled={disabled}
              style={({ pressed }) => [styles.spinnerScrollItem, pressed && styles.pressed]}
            >
              <Text style={[styles.spinnerTextMuted, selected && styles.spinnerTextSelected]}>
                {formatLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function timeParts(time: string | null): { period: TimePeriod; hour: number; minute: number } {
  if (!time) {
    return { period: "오후", hour: 7, minute: 0 };
  }

  const [hour24, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) {
    return { period: "오후", hour: 7, minute: 0 };
  }

  return {
    period: hour24 < 12 ? "오전" : "오후",
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute
  };
}

const styles = StyleSheet.create({
  spinnerPanel: {
    height: WHEEL_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  spinnerHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    top: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#F1F2F5"
  },
  spinnerColumn: {
    flex: 1,
    height: WHEEL_HEIGHT,
    alignItems: "center",
    zIndex: 1
  },
  spinnerScrollContent: {
    paddingVertical: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2
  },
  spinnerScrollItem: {
    height: WHEEL_ITEM_HEIGHT,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center"
  },
  spinnerTextMuted: {
    color: "#C1C6CE",
    fontSize: 20,
    fontWeight: "700"
  },
  spinnerTextSelected: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.72
  },
  disabled: {
    opacity: 0.62
  }
});
