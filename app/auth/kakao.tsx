import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme";

export default function KakaoAuthCallbackScreen() {
  const router = useRouter();
  const { completeKakaoSignIn, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    let mounted = true;

    async function finishSignIn() {
      try {
        if (typeof window === "undefined") {
          throw new Error("Kakao login callback is only available in the browser.");
        }

        await completeKakaoSignIn(window.location.href);
        router.replace("/");
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Kakao login failed");
        }
      }
    }

    finishSignIn();

    return () => {
      mounted = false;
    };
  }, [completeKakaoSignIn, loading, router]);

  return (
    <View style={styles.wrap}>
      {errorMessage ? (
        <Text style={styles.error}>{errorMessage}</Text>
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    paddingHorizontal: 24,
    textAlign: "center"
  }
});
