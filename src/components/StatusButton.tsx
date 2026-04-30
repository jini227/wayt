import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing } from "../theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

export function StatusButton({
  icon: Icon,
  label,
  tone = "primary",
  compact,
  onPress,
  disabled
}: {
  icon: ComponentType<IconProps>;
  label: string;
  tone?: "primary" | "danger" | "success";
  compact?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const color = tone === "danger" ? colors.danger : tone === "success" ? colors.success : colors.primary;
  const bg = tone === "danger" ? colors.dangerSoft : tone === "success" ? colors.successSoft : "#F5F9FF";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        { borderColor: `${color}33`, backgroundColor: bg },
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Icon color={color} size={compact ? 17 : 23} strokeWidth={2.4} />
      <Text style={[styles.label, compact && styles.compactLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    ...spacing.softShadow
  },
  compact: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flex: 0
  },
  label: {
    fontSize: 16,
    fontWeight: "800"
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: "800"
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86
  },
  disabled: {
    opacity: 0.58
  }
});
