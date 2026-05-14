import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen } from "../src/components/AppScreen";
import { useAuth } from "../src/auth/AuthContext";
import { colors, spacing } from "../src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { loading, signInWithKakao } = useAuth();

  const handleLogin = async () => {
    const signedIn = await signInWithKakao();
    if (signedIn) {
      router.replace("/");
    }
  };

  return (
    <AppScreen noScroll>
      <View style={styles.screen}>
        <View style={styles.brandBlock}>
          <Image source={require("../assets/wayt-splash.png")} style={styles.brandImage} resizeMode="contain" />
          <Text style={styles.logo}>가는중</Text>
          <Text style={styles.title}>약속까지 가는 길을{"\n"}함께 확인해요</Text>
          <Text style={styles.subtitle}>친구들의 출발, 이동, 도착 상태를{"\n"}함께 확인해요.</Text>
        </View>

        <View style={styles.actionBlock}>
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [styles.button, pressed && !loading && styles.pressed, loading && styles.disabled]}
          >
            {loading ? <ActivityIndicator color="#191600" /> : <Text style={styles.buttonText}>카카오로 계속하기</Text>}
          </Pressable>
          <Text style={styles.helper}>로그인하면 약속 초대와 도착 알림을 받을 수 있어요.</Text>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    gap: 44,
    paddingBottom: 22
  },
  brandBlock: {
    alignItems: "center"
  },
  brandImage: {
    width: 188,
    height: 188,
    marginBottom: 22
  },
  logo: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 14
  },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: "center"
  },
  actionBlock: {
    gap: 14
  },
  button: {
    height: 62,
    borderRadius: 16,
    backgroundColor: "#FEE500",
    alignItems: "center",
    justifyContent: "center",
    ...spacing.shadow
  },
  buttonText: {
    color: "#191600",
    fontSize: 18,
    fontWeight: "900"
  },
  helper: {
    color: colors.textSubtle,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.7
  }
});
