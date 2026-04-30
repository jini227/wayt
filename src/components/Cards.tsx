import type { ComponentType, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing } from "../theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

export function InfoCard({
  children,
  style
}: {
  children: ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function IconTextRow({
  icon: Icon,
  children,
  tone = "dark",
  right
}: {
  icon: ComponentType<IconProps>;
  children: ReactNode;
  tone?: "dark" | "primary";
  right?: ReactNode;
}) {
  const color = tone === "primary" ? colors.primary : colors.textMuted;
  return (
    <View style={styles.iconRow}>
      <Icon color={color} size={22} strokeWidth={2.2} />
      <Text style={[styles.iconText, tone === "primary" && styles.primaryText]}>{children}</Text>
      {right ? <View style={styles.iconRight}>{right}</View> : null}
    </View>
  );
}

export function FieldRow({
  label,
  value,
  icon: Icon,
  border = true
}: {
  label: string;
  value: string;
  icon?: ComponentType<IconProps>;
  border?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, border && styles.fieldBorder]}>
      <View>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      {Icon ? <Icon color={colors.primary} size={26} strokeWidth={2.2} /> : null}
    </View>
  );
}

export function SettingRow({
  icon: Icon,
  label,
  value,
  chevron
}: {
  icon: ComponentType<IconProps>;
  label: string;
  value: string;
  chevron?: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <Icon color={colors.primary} size={24} strokeWidth={2.2} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
      {chevron ? <ChevronRight color={colors.textSubtle} size={24} strokeWidth={2.2} /> : null}
    </View>
  );
}

export function Header({
  title,
  center,
  subtitle,
  back,
  action
}: {
  title: string;
  center?: boolean;
  subtitle?: string;
  back?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={[styles.header, center && styles.headerCenter]}>
      {back ? (
        <Pressable onPress={back} hitSlop={10} style={styles.backButton}>
          <ChevronRight color={colors.text} size={36} strokeWidth={2.5} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>
      ) : null}
      <View style={center ? styles.centerTitleWrap : undefined}>
        <Text style={[styles.headerTitle, center && styles.centerTitle]}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

export function ChevronCard({
  children,
  onPress
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.chevronCard, pressed && styles.pressed]}>
      <View style={{ flex: 1 }}>{children}</View>
      <ChevronRight color="#A3A7AF" size={24} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: "#F0F1F4",
    padding: 24,
    ...spacing.shadow
  },
  chevronCard: {
    flexDirection: "row",
    alignItems: "center"
  },
  pressed: {
    opacity: 0.86
  },
  iconRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1
  },
  primaryText: {
    color: colors.primary,
    fontWeight: "700"
  },
  iconRight: {
    marginLeft: "auto"
  },
  fieldRow: {
    minHeight: 80,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 9
  },
  fieldValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  settingRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600"
  },
  settingValue: {
    color: colors.textMuted,
    fontSize: 15,
    marginLeft: "auto"
  },
  header: {
    minHeight: 58,
    marginBottom: 22,
    justifyContent: "center"
  },
  headerCenter: {
    alignItems: "center"
  },
  headerTitle: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0
  },
  centerTitleWrap: {
    alignItems: "center"
  },
  centerTitle: {
    fontSize: 23,
    fontWeight: "800"
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 22,
    marginTop: 10
  },
  backButton: {
    position: "absolute",
    left: -8,
    top: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  },
  headerAction: {
    position: "absolute",
    right: 0,
    top: 8
  }
});
