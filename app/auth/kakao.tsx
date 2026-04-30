import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../src/theme";

export default function KakaoAuthCallbackScreen() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  }
});
