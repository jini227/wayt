import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, Inbox, MapPin, X } from "lucide-react-native";
import { apiGetAuthenticated, apiPostAuthenticated } from "../../src/api/client";
import { Avatar } from "../../src/components/Avatar";
import { PrimaryButton } from "../../src/components/Buttons";
import { Header, InfoCard } from "../../src/components/Cards";
import { AppScreen } from "../../src/components/AppScreen";
import { useAppFeedback } from "../../src/feedback/AppFeedback";
import {
  buildReceivedInviteRows,
  type ReceivedInvite,
  type ReceivedInviteRow
} from "../../src/invites/receivedInvites";
import { colors, spacing } from "../../src/theme";

export default function ReceivedInvitesScreen() {
  const router = useRouter();
  const { showDialog, showToast } = useAppFeedback();
  const [invites, setInvites] = useState<ReceivedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(() => buildReceivedInviteRows(invites), [invites]);

  const loadInvites = useCallback(({ silent = false }: { silent?: boolean } = {}) => {
    let cancelled = false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    apiGetAuthenticated<ReceivedInvite[]>("/me/invites")
      .then((items) => {
        if (!cancelled) {
          setInvites(items);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setInvites([]);
          setError(fetchError instanceof Error ? fetchError.message : "받은 초대를 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(loadInvites, [loadInvites]);

  const refreshInvites = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      setInvites(await apiGetAuthenticated<ReceivedInvite[]>("/me/invites"));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "받은 초대를 불러오지 못했어요.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  const declineInvite = useCallback(async (row: ReceivedInviteRow) => {
    if (decliningId) {
      return;
    }

    setDecliningId(row.id);
    try {
      await apiPostAuthenticated<unknown, Record<string, never>>(`/invites/${row.id}/decline`, {});
      setInvites((current) => current.filter((invite) => invite.id !== row.id));
      showToast({ title: "초대를 거절했어요.", tone: "success" });
    } catch (declineError) {
      showDialog({
        title: "초대를 거절하지 못했어요.",
        message: declineError instanceof Error ? declineError.message : undefined,
        tone: "danger"
      });
      void refreshInvites();
    } finally {
      setDecliningId(null);
    }
  }, [decliningId, refreshInvites, showDialog, showToast]);

  const confirmDecline = useCallback((row: ReceivedInviteRow) => {
    showDialog({
      title: "초대를 거절할까요?",
      message: row.title,
      tone: "danger",
      actions: [
        { label: "취소", role: "cancel" },
        { label: "거절", role: "destructive", onPress: () => void declineInvite(row) }
      ]
    });
  }, [declineInvite, showDialog]);

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshInvites}>
      <Header title="받은 초대" center back={() => router.back()} />

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Inbox color={colors.textSubtle} size={32} strokeWidth={2.2} />
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={() => loadInvites()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryText}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.stateBox}>
          <Inbox color={colors.textSubtle} size={34} strokeWidth={2.2} />
          <Text style={styles.stateText}>받은 초대가 없어요.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <InfoCard key={row.id} style={styles.inviteCard}>
              <View style={styles.inviteHeader}>
                <Avatar uri={row.inviterAvatarUrl ?? ""} name={row.inviterLabel} accent={colors.primary} size={48} />
                <View style={styles.inviteText}>
                  <Text style={styles.inviterLabel}>{row.inviterLabel}</Text>
                  <Text style={styles.inviterHandle}>{row.inviterHandle}</Text>
                </View>
                {row.isPast ? <Text style={styles.pastPill}>지난 약속</Text> : null}
              </View>

              <Text style={styles.title}>{row.title}</Text>
              <View style={styles.metaList}>
                <View style={styles.metaRow}>
                  <CalendarDays color={colors.primary} size={18} strokeWidth={2.2} />
                  <Text style={styles.metaText}>{row.scheduleLabel}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MapPin color={colors.primary} size={18} strokeWidth={2.2} />
                  <Text style={styles.metaText}>{row.place}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <PrimaryButton style={styles.joinButton} onPress={() => router.push(row.route as never)}>
                  참여하기
                </PrimaryButton>
                <Pressable
                  onPress={() => confirmDecline(row)}
                  disabled={decliningId === row.id}
                  accessibilityRole="button"
                  accessibilityLabel="초대 거절"
                  style={({ pressed }) => [
                    styles.declineButton,
                    pressed && decliningId !== row.id && styles.pressed,
                    decliningId === row.id && styles.disabled
                  ]}
                >
                  {decliningId === row.id ? (
                    <ActivityIndicator color={colors.danger} />
                  ) : (
                    <>
                      <X color={colors.danger} size={19} strokeWidth={2.6} />
                      <Text style={styles.declineText}>거절</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </InfoCard>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14
  },
  inviteCard: {
    gap: 14
  },
  inviteHeader: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  inviteText: {
    flex: 1,
    minWidth: 0
  },
  inviterLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  inviterHandle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  pastPill: {
    color: colors.textMuted,
    backgroundColor: "#F3F4F6",
    borderRadius: 9,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900"
  },
  metaList: {
    gap: 8
  },
  metaRow: {
    minHeight: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    flexShrink: 1
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2
  },
  joinButton: {
    flex: 1
  },
  declineButton: {
    minWidth: 86,
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FFD1CD",
    backgroundColor: colors.dangerSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5
  },
  declineText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "900"
  },
  stateBox: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",
    textAlign: "center"
  },
  retryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE3FF",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    ...spacing.softShadow
  },
  retryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
