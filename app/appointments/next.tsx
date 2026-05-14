import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, Clock3, Gift, MapPin, NotepadText, Plus, RadioTower, UsersRound } from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { Avatar } from "../../src/components/Avatar";
import { IconTextRow, InfoCard } from "../../src/components/Cards";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { TabHero } from "../../src/components/TabHero";
import { apiGetAuthenticated } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import {
  createNextAppointmentViewModel,
  selectNextAppointment,
  type NextAppointmentCandidate
} from "../../src/appointments/nextAppointment";
import { colors } from "../../src/theme";

type ApiParticipant = {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
};

type ApiAppointment = NextAppointmentCandidate & {
  shareStartOffsetMinutes: number;
  participants: ApiParticipant[];
};

export default function NextAppointmentScreen() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [fabHovered, setFabHovered] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      return;
    }

    let mounted = true;
    setAppointmentsLoading(true);
    setAppointmentsError(null);

    apiGetAuthenticated<ApiAppointment[]>("/appointments/upcoming")
      .then((items) => {
        if (mounted) {
          setAppointments(items);
        }
      })
      .catch((error) => {
        if (mounted) {
          setAppointments([]);
          setAppointmentsError(error instanceof Error ? error.message : "다음 약속을 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (mounted) {
          setAppointmentsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const refreshNextAppointment = useCallback(async () => {
    if (!user || refreshing) {
      return;
    }

    setRefreshing(true);
    setAppointmentsError(null);
    try {
      setAppointments(await apiGetAuthenticated<ApiAppointment[]>("/appointments/upcoming"));
      setNow(new Date());
    } catch (error) {
      setAppointmentsError(error instanceof Error ? error.message : "?ㅼ쓬 ?쎌냽??遺덈윭?ㅼ? 紐삵뻽?댁슂.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, user]);

  const nextAppointment = useMemo(() => selectNextAppointment(appointments, now), [appointments, now]);
  const viewModel = useMemo(
    () => (nextAppointment ? createNextAppointmentViewModel(nextAppointment, now) : null),
    [nextAppointment, now]
  );

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppScreen withTabs refreshing={refreshing} onRefresh={refreshNextAppointment}>
        <TabHero title="다음 약속" subtitle="가장 가까운 일정" />

        {appointmentsLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : appointmentsError ? (
          <InfoCard style={styles.stateCard}>
            <Text style={styles.stateTitle}>불러오지 못했어요</Text>
            <Text style={styles.stateText}>{appointmentsError}</Text>
          </InfoCard>
        ) : viewModel ? (
          <>
            <InfoCard style={styles.focusCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardEyebrow}>NEXT</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {viewModel.title}
                  </Text>
                </View>
                {viewModel.roleLabel ? (
                  <View style={styles.rolePill}>
                    <Text style={styles.roleText}>{viewModel.roleLabel}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.countdownBand}>
                <Clock3 color={colors.primary} size={24} strokeWidth={2.4} />
                <Text style={styles.countdownText}>{viewModel.countdownLabel}</Text>
              </View>

              <View style={styles.rows}>
                <IconTextRow icon={CalendarDays}>{viewModel.scheduleLabel}</IconTextRow>
                <IconTextRow icon={MapPin}>{viewModel.place}</IconTextRow>
                <IconTextRow icon={RadioTower} tone={viewModel.isLocationSharingActive ? "primary" : "dark"}>
                  {viewModel.shareLabel}
                </IconTextRow>
                <ParticipantAvatarRow
                  avatars={viewModel.participantAvatars}
                  countLabel={viewModel.participantLabel}
                />
                {viewModel.hasPenalty ? <IconTextRow icon={Gift}>{viewModel.penaltyLabel}</IconTextRow> : null}
              </View>

              {viewModel.hasMemo ? (
                <View style={styles.memoBlock}>
                  <View style={styles.memoTitleRow}>
                    <NotepadText color={colors.primary} size={20} strokeWidth={2.3} />
                    <Text style={styles.memoTitle}>약속 메모</Text>
                  </View>
                  <Text style={styles.memoPreview} numberOfLines={2}>
                    {viewModel.memoPreview}
                  </Text>
                </View>
              ) : null}
            </InfoCard>

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push(`/appointments/${viewModel.id}`)}
                style={({ pressed }) => [styles.statusButton, pressed && styles.statusButtonPressed]}
              >
                <Text style={styles.statusButtonText}>{viewModel.actionLabel}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <InfoCard style={styles.stateCard}>
            <CalendarDays color={colors.primary} size={32} strokeWidth={2.3} />
            <Text style={styles.stateTitle}>다가오는 약속이 없어요</Text>
          </InfoCard>
        )}
      </AppScreen>
      <Pressable
        onPress={() => router.push("/appointments/new")}
        onHoverIn={() => setFabHovered(true)}
        onHoverOut={() => setFabHovered(false)}
        accessibilityRole="button"
        accessibilityLabel="새 약속 만들기"
        style={({ pressed }) => [styles.fab, fabHovered && styles.fabHovered, pressed && styles.fabPressed]}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={fabHovered || pressed ? ["#3390FF", "#1478FF"] : ["#2486FF", "#0F70F3"]}
            style={styles.fabCircle}
          >
            <Plus color="#FFFFFF" size={25} strokeWidth={2.5} />
          </LinearGradient>
        )}
      </Pressable>
      <BottomTabBar />
    </>
  );
}

function ParticipantAvatarRow({
  avatars,
  countLabel
}: {
  avatars: Array<{ id: string; name: string; avatarUrl?: string }>;
  countLabel: string;
}) {
  return (
    <View style={styles.participantRow}>
      <UsersRound color={colors.textMuted} size={22} strokeWidth={2.2} />
      <View style={styles.participantContent}>
        <View style={styles.participantAvatars}>
          {avatars.slice(0, 5).map((participant, index) => (
            <Avatar
              key={participant.id}
              uri={participant.avatarUrl}
              name={participant.name}
              size={34}
              overlap={index > 0}
            />
          ))}
        </View>
        <Text style={styles.participantCount}>{countLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  focusCard: {
    padding: 22
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  cardEyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 5
  },
  cardTitle: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900"
  },
  rolePill: {
    minHeight: 31,
    borderRadius: 8,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  countdownBand: {
    minHeight: 54,
    marginTop: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  countdownText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    flexShrink: 1
  },
  rows: {
    gap: 10,
    marginTop: 19
  },
  participantRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  participantContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center"
  },
  participantAvatars: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 2
  },
  participantCount: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12
  },
  memoBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8
  },
  memoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  memoTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  memoPreview: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600"
  },
  actions: {
    marginTop: 18
  },
  statusButton: {
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#CFE1FF",
    backgroundColor: "#F4F8FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#101828",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  statusButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  statusButtonText: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: "900"
  },
  fab: {
    position: "absolute",
    right: 26,
    bottom: 96,
    borderRadius: 27,
    backgroundColor: "#1478FF",
    shadowColor: "#0A4FAF",
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 12
  },
  fabHovered: {
    shadowOpacity: 0.42,
    shadowRadius: 24,
    transform: [{ translateY: -2 }, { scale: 1.03 }]
  },
  fabPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }]
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center"
  },
  stateBox: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center"
  },
  stateCard: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  stateTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center"
  },
  
});
