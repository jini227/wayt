import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bike, BusFront, Car, CircleOff, Footprints } from "lucide-react-native";
import { colors, spacing } from "../theme";
import { TRAVEL_MODE_OPTIONS, type TravelMode } from "./travelMode";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

const icons: Record<TravelMode, ComponentType<IconProps>> = {
  TRANSIT: BusFront,
  CAR: Car,
  WALK: Footprints,
  BICYCLE: Bike
};

export function TravelModeChoiceGrid({
  selected,
  onSelect,
  includeSkip,
  onSkip,
  disabled,
  variant = "grid"
}: {
  selected: TravelMode | null;
  onSelect: (mode: TravelMode) => void;
  includeSkip?: boolean;
  onSkip?: () => void;
  disabled?: boolean;
  variant?: "grid" | "segmented";
}) {
  const segmented = variant === "segmented";

  return (
    <View style={[styles.grid, segmented && styles.segmentedGrid]}>
      {TRAVEL_MODE_OPTIONS.map((option) => {
        const active = option.value === selected;
        const Icon = icons[option.value];
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              segmented && styles.segmentedOption,
              active && styles.optionActive,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled
            ]}
          >
            <Icon color={active ? colors.primary : colors.textMuted} size={22} strokeWidth={2.4} />
            <Text
              style={[styles.optionText, segmented && styles.segmentedOptionText, active && styles.optionTextActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
      {includeSkip ? (
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          style={({ pressed }) => [
            styles.option,
            styles.skipOption,
            segmented && styles.segmentedSkipOption,
            selected === null && styles.optionActive,
            pressed && !disabled && styles.pressed,
            disabled && styles.disabled
          ]}
        >
          <CircleOff color={selected === null ? colors.primary : colors.textMuted} size={22} strokeWidth={2.4} />
          <Text style={[styles.optionText, selected === null && styles.optionTextActive]}>지금은 선택 안 함</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  segmentedGrid: {
    flexWrap: "nowrap",
    gap: 6
  },
  option: {
    minHeight: 48,
    minWidth: 0,
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    ...spacing.softShadow
  },
  segmentedOption: {
    minHeight: 56,
    minWidth: 0,
    flex: 1,
    flexGrow: 1,
    borderRadius: 10,
    flexDirection: "column",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 7,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },
  optionActive: {
    borderColor: "#CFE1FF",
    backgroundColor: colors.primarySoft
  },
  skipOption: {
    minWidth: "100%",
    flexGrow: 1
  },
  segmentedSkipOption: {
    minWidth: 0
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "800"
  },
  segmentedOptionText: {
    fontSize: 12,
    maxWidth: "100%"
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.5
  }
});
