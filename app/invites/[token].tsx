import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays, Check, MapPin, MessageSquareText } from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { Avatar } from "../../src/components/Avatar";
import { PrimaryButton } from "../../src/components/Buttons";
import { Header, InfoCard } from "../../src/components/Cards";
import { FooterBar } from "../../src/components/FooterBar";
import { env } from "../../src/config/env";
import { apiPost } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppFeedback } from "../../src/feedback/AppFeedback";
import {
  buildInviteAcceptanceDetails,
  buildInviteAcceptanceTravelModeState,
  type InviteAcceptanceDetailRow
} from "../../src/invites/inviteAcceptance";
import { TravelModeChoiceGrid } from "../../src/travel/TravelModeChoiceGrid";
import { type TravelMode } from "../../src/travel/travelMode";
import { colors } from "../../src/theme";

type ApiInvite = {
  id: string;
  appointmentId: string;
  appointmentTitle: string;
  placeName?: string | null;
  scheduledAt?: string | null;
  memo?: string | null;
  inviterNickname?: string | null;
  inviterWaytId?: string | null;
  inviterAvatarUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
};

export default function InviteAcceptScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, updateProfile } = useAuth();
  const { showDialog, showToast } = useAppFeedback();
  const [invite, setInvite] = useState<ApiInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const travelModeState = buildInviteAcceptanceTravelModeState(user?.defaultTravelMode);
  const [travelMode, setTravelMode] = useState<TravelMode>(() => travelModeState.selectedTravelMode);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const shouldShowTravelModeQuestion = travelModeState.shouldShowTravelModeQuestion;
  const shouldAskDefaultSave = travelModeState.shouldAskDefaultSave;
  const invitePending = invite?.status === "PENDING";
  const inviteDetails = invite ? buildInviteAcceptanceDetails(invite) : null;
  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    const nextTravelModeState = buildInviteAcceptanceTravelModeState(user?.defaultTravelMode);
    setTravelMode(nextTravelModeState.selectedTravelMode);
    if (!nextTravelModeState.shouldAskDefaultSave) {
      setSaveAsDefault(false);
    }
  }, [user?.defaultTravelMode]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${env.apiBaseUrl}/invites/${encodeURIComponent(token)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Invite not found");
        }
        return response.json() as Promise<ApiInvite>;
      })
      .then((item) => {
        if (!cancelled) {
          setInvite(item);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showDialog({
            title: "초대를 찾을 수 없어요",
            message: error instanceof Error ? error.message : undefined,
            tone: "danger"
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showDialog, token]);

  const acceptInvite = useCallback(async () => {
    if (!invite || !user || accepting) {
      return;
    }

    setAccepting(true);
    try {
      if (shouldAskDefaultSave && saveAsDefault) {
        await updateProfile({
          defaultTravelMode: travelMode,
          travelModeOnboardingCompleted: true
        });
      }

      await apiPost<ApiInvite, { userId: string; travelMode: TravelMode; locationConsent: boolean }>(
        `/invites/${invite.id}/accept`,
        {
          userId: user.id,
          travelMode,
          locationConsent: true
        }
      );

      showToast({ title: "약속에 참여했어요." });

      router.replace(`/appointments/${invite.appointmentId}`);
    } catch (error) {
      const staleStatus = staleInviteStatusFromError(error);
      if (staleStatus) {
        setInvite((current) => current ? { ...current, status: staleStatus } : current);
        return;
      }

      showDialog({
        title: "초대 수락 실패",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setAccepting(false);
    }
  }, [accepting, invite, router, saveAsDefault, shouldAskDefaultSave, showDialog, showToast, travelMode, updateProfile, user]);

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      footer={
        <FooterBar>
          {invitePending ? (
            <PrimaryButton onPress={() => void acceptInvite()} disabled={accepting}>
              {accepting ? "참여 중" : "약속 참여하기"}
            </PrimaryButton>
          ) : (
            <PrimaryButton onPress={goHome}>확인</PrimaryButton>
          )}
        </FooterBar>
      }
    >
      <Header title="초대 수락" center back={invitePending ? () => router.back() : undefined} />
      <InfoCard style={styles.card}>
        <Text style={styles.eyebrow}>초대받은 약속</Text>
        <Text style={styles.title}>{invite?.appointmentTitle ?? "약속 정보 없음"}</Text>
        {inviteDetails ? (
          <>
            <View style={styles.inviteHeaderRow}>
              <Avatar
                uri={inviteDetails.inviterAvatarUrl ?? ""}
                name={inviteDetails.inviterLabel}
                accent={colors.primary}
                size={44}
              />
              <View style={styles.inviteHeaderText}>
                <Text style={styles.inviterLabel}>{inviteDetails.inviterLabel}</Text>
                {inviteDetails.inviterHandle ? (
                  <Text style={styles.inviterHandle}>{inviteDetails.inviterHandle}</Text>
                ) : null}
              </View>
            </View>
            {inviteDetails.rows.length > 0 ? (
              <View style={styles.detailList}>
                {inviteDetails.rows.map((row) => (
                  <View key={row.id} style={styles.detailRow}>
                    <View style={styles.detailIcon}>{renderInviteDetailIcon(row.id)}</View>
                    <View style={styles.detailTextBlock}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </InfoCard>
      {invitePending && shouldShowTravelModeQuestion ? (
        <InfoCard style={styles.cardGap}>
          <Text style={styles.sectionTitle}>이번 약속엔 어떻게 갈까요?</Text>
          <TravelModeChoiceGrid selected={travelMode} onSelect={setTravelMode} disabled={accepting} />
          {shouldAskDefaultSave ? (
            <Pressable
              onPress={() => setSaveAsDefault((current) => !current)}
              style={({ pressed }) => [styles.defaultRow, pressed && styles.pressed]}
            >
              <View style={[styles.checkboxBox, saveAsDefault && styles.checkboxBoxOn]}>
                {saveAsDefault ? <Check color="#FFFFFF" size={15} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.defaultText, saveAsDefault && styles.defaultTextOn]}>내 기본 이동수단으로 저장</Text>
            </Pressable>
          ) : null}
        </InfoCard>
      ) : !invitePending ? (
        <InfoCard style={styles.cardGap}>
          <Text style={styles.sectionTitle}>{inviteStatusMessage(invite?.status)}</Text>
        </InfoCard>
      ) : null}
    </AppScreen>
  );
}

function inviteStatusMessage(status?: ApiInvite["status"]) {
  if (status === "CANCELLED") {
    return "취소된 초대예요.";
  }
  if (status === "ACCEPTED") {
    return "이미 수락한 초대예요.";
  }
  if (status === "DECLINED") {
    return "거절한 초대예요.";
  }
  if (status === "EXPIRED") {
    return "만료된 초대예요.";
  }
  return "초대를 사용할 수 없어요.";
}

function staleInviteStatusFromError(error: unknown): ApiInvite["status"] | null {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("취소")) {
    return "CANCELLED";
  }
  if (message.includes("수락")) {
    return "ACCEPTED";
  }
  if (message.includes("거절")) {
    return "DECLINED";
  }
  if (message.includes("만료")) {
    return "EXPIRED";
  }
  return null;
}

function renderInviteDetailIcon(id: InviteAcceptanceDetailRow["id"]) {
  switch (id) {
    case "scheduledAt":
      return <CalendarDays color={colors.primary} size={18} strokeWidth={2.4} />;
    case "place":
      return <MapPin color={colors.primary} size={18} strokeWidth={2.4} />;
    case "memo":
      return <MessageSquareText color={colors.primary} size={18} strokeWidth={2.4} />;
  }
}

const styles = StyleSheet.create({
  stateBox: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center"
  },
  card: {
    marginTop: 16
  },
  cardGap: {
    marginTop: 18,
    gap: 14
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900"
  },
  inviteHeaderRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14
  },
  inviteHeaderText: {
    flex: 1,
    minWidth: 0
  },
  inviterLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  inviterHandle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2
  },
  detailList: {
    marginTop: 16,
    gap: 11
  },
  detailRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  detailTextBlock: {
    flex: 1,
    minWidth: 0
  },
  detailLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  defaultRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C8CDD6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  checkboxBoxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  defaultText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "800"
  },
  defaultTextOn: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.82
  }
});
