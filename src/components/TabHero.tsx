import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function TabHero({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: 18
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6
  }
});
