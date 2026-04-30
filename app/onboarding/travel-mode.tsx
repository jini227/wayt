import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen } from "../../src/components/AppScreen";
import { PrimaryButton } from "../../src/components/Buttons";
import { FooterBar } from "../../src/components/FooterBar";
import { TravelModeChoiceGrid } from "../../src/travel/TravelModeChoiceGrid";
import { initialTravelModeSelection, type TravelMode } from "../../src/travel/travelMode";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppFeedback } from "../../src/feedback/AppFeedback";
import { colors } from "../../src/theme";

export default function TravelModeOnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { showDialog } = useAppFeedback();
  const [selectedMode, setSelectedMode] = useState<TravelMode>(() => initialTravelModeSelection(user?.defaultTravelMode));
  const [saving, setSaving] = useState(false);

  const save = async (mode: TravelMode | null) => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        defaultTravelMode: mode,
        travelModeOnboardingCompleted: true
      });
      router.replace("/");
    } catch (error) {
      showDialog({
        title: "설정 저장 실패",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      footer={
        <FooterBar>
          <PrimaryButton onPress={() => void save(selectedMode)} disabled={saving}>
            {saving ? "저장 중" : "선택 완료"}
          </PrimaryButton>
        </FooterBar>
      }
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Wayt 시작하기</Text>
        <Text style={styles.title}>주로 어떻게 이동하세요?</Text>
        <Text style={styles.subtitle}>
          약속마다 도착 시간을 더 자연스럽게 계산할 수 있게 기본 이동수단으로 저장해둘게요.
        </Text>
      </View>
      <TravelModeChoiceGrid
        selected={selectedMode}
        onSelect={setSelectedMode}
        includeSkip
        onSkip={() => void save(null)}
        disabled={saving}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 52,
    marginBottom: 28
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12
  },
  title: {
    color: colors.text,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 14
  }
});
