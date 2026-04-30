import type { ComponentType, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

export function PrimaryButton({
  children,
  icon: Icon,
  onPress,
  style,
  disabled
}: {
  children: ReactNode;
  icon?: ComponentType<IconProps>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primaryWrap, style, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <LinearGradient colors={["#2486FF", "#0F70F3"]} style={styles.primary}>
        {Icon ? <Icon color="#FFFFFF" size={22} strokeWidth={2.4} /> : null}
        <Text style={styles.primaryText}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function PillButton({
  children,
  active,
  onPress
}: {
  children: ReactNode;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: 13,
    ...spacing.buttonShadow
  },
  primary: {
    minHeight: 54,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.45
  },
  pill: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9DDE5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...spacing.buttonShadow
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600"
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800"
  }
});
