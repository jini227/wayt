import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { ArrowRight, CalendarDays, Clock3, Inbox, MapPin, Plus, UsersRound } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AppScreen } from "../src/components/AppScreen";
import { AppointmentCard, type AppointmentCardData } from "../src/components/AppointmentCard";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { SegmentedControl } from "../src/components/SegmentedControl";
import { TabHero } from "../src/components/TabHero";
import { withCountLabels } from "../src/components/segmentedControlOptions";
import { apiGetAuthenticated } from "../src/api/client";
import { filterHomeAppointments, type HomeAppointmentLike } from "../src/appointments/homeAppointments";
import { formatAppointmentScheduleLabel } from "../src/appointments/liveAppointmentSchedule";
import { formatPenaltyLabel, isMeaningfulPenalty } from "../src/appointments/penalty";
import { receivedInviteSummaryLabel, type ReceivedInvite } from "../src/invites/receivedInvites";
import { colors } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";
import { isDesktopWebLayout } from "../src/components/webDesktopLayout";

type ApiParticipant = {
  id: string;
  userId: string;
  name: string;
  waytId: string;
  avatarUrl?: string;
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
  status?: "ARRIVED" | "LATE_CONFIRMED" | "LIKELY_LATE" | "MOVING" | "NEAR_ARRIVAL" | string;
  arrivedAt?: string | null;
};

type ApiAppointment = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  locationShareStartsAt: string;
  shareStartOffsetMinutes: number;
  penalty: string;
  completedAt?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: ApiParticipant[];
};

type HomeAppointmentCardData = AppointmentCardData & HomeAppointmentLike;

export default function HomeScreen() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const { width } = useWindowDimensions();
  const desktopWeb = isDesktopWebLayout(width);
  const [filterIndex, setFilterIndex] = useState(0);
  const [fabHovered, setFabHovered] = useState(false);
  const [calendarFabHovered, setCalendarFabHovered] = useState(false);
  const [appointments, setAppointments] = useState<HomeAppointmentCardData[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [receivedInviteCount, setReceivedInviteCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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
          setAppointments(items.map((item) => mapAppointment(item, user.id)));
        }
      })
      .catch((error) => {
        if (mounted) {
          setAppointments([]);
          setAppointmentsError(error instanceof Error ? error.message : "약속 목록을 불러오지 못했어요.");
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

  useFocusEffect(useCallback(() => {
    if (!user) {
      setReceivedInviteCount(0);
      return undefined;
    }

    let cancelled = false;
    apiGetAuthenticated<ReceivedInvite[]>("/me/invites")
      .then((items) => {
        if (!cancelled) {
          setReceivedInviteCount(items.filter((invite) => invite.status === "PENDING").length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReceivedInviteCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]));

  const refreshHome = useCallback(async () => {
    if (!user || refreshing) {
      return;
    }

    setRefreshing(true);
    setAppointmentsError(null);
    try {
      const [appointmentItems, inviteItems] = await Promise.all([
        apiGetAuthenticated<ApiAppointment[]>("/appointments/upcoming"),
        apiGetAuthenticated<ReceivedInvite[]>("/me/invites")
      ]);
      setAppointments(appointmentItems.map((item) => mapAppointment(item, user.id)));
      setReceivedInviteCount(inviteItems.filter((invite) => invite.status === "PENDING").length);
    } catch (error) {
      setAppointmentsError(error instanceof Error ? error.message : "?쎌냽 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?댁슂.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, user]);

  const todayAppointments = useMemo(() => filterHomeAppointments(appointments, 1), [appointments]);
  const visibleAppointments = filterIndex === 1 ? todayAppointments : appointments;
  const filterOptions = useMemo(
    () => withCountLabels(["\uC804\uCCB4", "\uC624\uB298"], [appointments.length, todayAppointments.length]),
    [appointments.length, todayAppointments.length]
  );
  const receivedInviteSummary = receivedInviteSummaryLabel(receivedInviteCount);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppScreen
        withTabs
        refreshing={refreshing}
        onRefresh={refreshHome}
        desktopAside={
          <HomeDesktopAside
            appointment={appointments[0] ?? null}
            totalCount={appointments.length}
            todayCount={todayAppointments.length}
            inviteSummary={receivedInviteSummary}
            onCreate={() => router.push("/appointments/new")}
            onOpenCalendar={() => router.push("/appointments/calendar")}
            onOpenAppointment={(appointmentId) => router.push(`/appointments/${appointmentId}`)}
          />
        }
      >
        <TabHero title="가는중" subtitle="다가오는 약속" />
        {receivedInviteSummary ? (
          <Pressable
            onPress={() => router.push("/invites")}
            accessibilityRole="button"
            accessibilityLabel="받은 초대 목록 보기"
            style={({ pressed }) => [styles.inviteBanner, pressed && styles.pressed]}
          >
            <View style={styles.inviteIcon}>
              <Inbox color={colors.primary} size={21} strokeWidth={2.5} />
            </View>
            <Text style={styles.inviteBannerText}>{receivedInviteSummary}</Text>
            <Text style={styles.inviteBannerAction}>확인하기</Text>
          </Pressable>
        ) : null}
        <SegmentedControl
          options={filterOptions}
          selectedIndex={filterIndex}
          onChange={setFilterIndex}
        />
        <View style={styles.list}>
          {appointmentsLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : appointmentsError ? (
            <Text style={styles.stateText}>{appointmentsError}</Text>
          ) : visibleAppointments.length === 0 ? (
            <Text style={styles.stateText}>
              {filterIndex === 1 ? "오늘 예정된 약속이 없어요." : "참여 중인 약속이 없어요."}
            </Text>
          ) : (
            visibleAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onPress={() => router.push(`/appointments/${appointment.id}`)}
              />
            ))
          )}
        </View>
      </AppScreen>
      {!desktopWeb ? (
        <>
          <Pressable
            onPress={() => router.push("/appointments/calendar")}
            onHoverIn={() => setCalendarFabHovered(true)}
            onHoverOut={() => setCalendarFabHovered(false)}
            accessibilityRole="button"
            accessibilityLabel="약속 달력 보기"
            style={({ pressed }) => [
              styles.fab,
              styles.calendarFab,
              calendarFabHovered && styles.calendarFabHovered,
              pressed && styles.calendarFabPressed
            ]}
          >
            {({ pressed }) => (
              <View style={[styles.calendarFabCircle, (calendarFabHovered || pressed) && styles.calendarFabCircleActive]}>
                <CalendarDays color={calendarFabHovered || pressed ? "#FFFFFF" : colors.primary} size={23} strokeWidth={2.5} />
              </View>
            )}
          </Pressable>
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
        </>
      ) : null}
      <BottomTabBar />
    </>
  );
}

function HomeDesktopAside({
  appointment,
  totalCount,
  todayCount,
  inviteSummary,
  onCreate,
  onOpenCalendar,
  onOpenAppointment
}: {
  appointment: HomeAppointmentCardData | null;
  totalCount: number;
  todayCount: number;
  inviteSummary: string | null;
  onCreate: () => void;
  onOpenCalendar: () => void;
  onOpenAppointment: (appointmentId: string) => void;
}) {
  return (
    <View style={styles.desktopAsideStack}>
      <View style={styles.desktopPanel}>
        <Text style={styles.desktopPanelTitle}>오늘의 약속</Text>
        <View style={styles.desktopMetricRow}>
          <View style={styles.desktopMetric}>
            <Text style={styles.desktopMetricValue}>{todayCount}</Text>
            <Text style={styles.desktopMetricLabel}>오늘</Text>
          </View>
          <View style={styles.desktopMetric}>
            <Text style={styles.desktopMetricValue}>{totalCount}</Text>
            <Text style={styles.desktopMetricLabel}>전체</Text>
          </View>
        </View>
        {appointment ? (
          <Pressable
            onPress={() => onOpenAppointment(appointment.id)}
            style={({ pressed }) => [styles.desktopNextCard, pressed && styles.pressed]}
          >
            <View style={styles.desktopNextTop}>
              <Text style={styles.desktopNextTitle} numberOfLines={1}>{appointment.title}</Text>
              <ArrowRight color={colors.primary} size={18} strokeWidth={2.6} />
            </View>
            <View style={styles.desktopInfoRows}>
              <DesktopInfoRow icon={Clock3} text={appointment.timeLabel} />
              <DesktopInfoRow icon={MapPin} text={appointment.place} />
              <DesktopInfoRow icon={UsersRound} text={`${appointment.peopleCount}명 참여`} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.desktopEmptyCard}>
            <Text style={styles.desktopEmptyText}>다가오는 약속이 없어요.</Text>
          </View>
        )}
      </View>

      <View style={styles.desktopPanel}>
        <Text style={styles.desktopPanelTitle}>빠른 작업</Text>
        <Pressable onPress={onCreate} style={({ pressed }) => [styles.desktopPrimaryAction, pressed && styles.pressed]}>
          <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
          <Text style={styles.desktopPrimaryActionText}>새 약속 만들기</Text>
        </Pressable>
        <Pressable onPress={onOpenCalendar} style={({ pressed }) => [styles.desktopSecondaryAction, pressed && styles.pressed]}>
          <CalendarDays color={colors.primary} size={18} strokeWidth={2.5} />
          <Text style={styles.desktopSecondaryActionText}>달력 보기</Text>
        </Pressable>
        {inviteSummary ? (
          <View style={styles.desktopNotice}>
            <Inbox color={colors.primary} size={17} strokeWidth={2.4} />
            <Text style={styles.desktopNoticeText}>{inviteSummary}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function DesktopInfoRow({
  icon: Icon,
  text
}: {
  icon: typeof Clock3;
  text: string;
}) {
  return (
    <View style={styles.desktopInfoRow}>
      <Icon color={colors.textMuted} size={16} strokeWidth={2.3} />
      <Text style={styles.desktopInfoText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function mapAppointment(appointment: ApiAppointment, userId: string): HomeAppointmentCardData {
  const share = shareInfo(appointment.locationShareStartsAt);
  const activeParticipants = appointment.participants.filter(isActiveParticipant);
  const myParticipant = activeParticipants.find((participant) => participant.userId === userId);
  const hasPenalty = isMeaningfulPenalty(appointment.penalty);

  return {
    id: appointment.id,
    scheduledAt: appointment.scheduledAt,
    completedAt: appointment.completedAt ?? null,
    title: appointment.title,
    role: appointment.myRole === "HOST" ? "방장" : "참가자",
    timeLabel: formatSchedule(appointment.scheduledAt),
    place: appointment.placeName,
    shareStart: share.label,
    shareStatus: share.status,
    penalty: hasPenalty ? formatPenaltyLabel(appointment.penalty) : undefined,
    hasPenalty,
    myArrived: myParticipant?.status === "ARRIVED" || myParticipant?.arrivedAt != null,
    peopleCount: activeParticipants.length,
    avatarPeople: activeParticipants.map((participant) => ({
      id: participant.userId,
      name: participant.name,
      avatarUrl: participant.avatarUrl,
      accent: participant.status === "ARRIVED" || participant.arrivedAt ? colors.success : colors.primary
    }))
  };
}

function isActiveParticipant(participant: ApiParticipant) {
  return (participant.membershipStatus ?? "ACTIVE") === "ACTIVE";
}

function shareInfo(value: string) {
  const startsAt = new Date(value);
  if (startsAt.getTime() <= Date.now()) {
    return { status: "public" as const, label: "위치 공개 중" };
  }
  return { status: "private" as const, label: `${formatDuration(Date.now(), startsAt.getTime())} 후 공개` };
}

function formatSchedule(value: string) {
  return formatAppointmentScheduleLabel(value);
}

function formatDuration(from: number, to: number) {
  const minutes = Math.max(1, Math.ceil((to - from) / 60000));
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
    marginTop: 16
  },
  desktopAsideStack: {
    gap: 18
  },
  desktopPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7EBF2",
    backgroundColor: "#FFFFFF",
    padding: 18,
    shadowColor: "#101828",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  desktopPanelTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  desktopMetricRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  desktopMetric: {
    flex: 1,
    minHeight: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF1F5",
    backgroundColor: "#F8FAFD",
    justifyContent: "center",
    paddingHorizontal: 13
  },
  desktopMetricValue: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: "900"
  },
  desktopMetricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  desktopNextCard: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E7FF",
    backgroundColor: "#F7FBFF",
    padding: 14
  },
  desktopNextTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  desktopNextTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
    minWidth: 0
  },
  desktopInfoRows: {
    gap: 8,
    marginTop: 12
  },
  desktopInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  desktopInfoText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    minWidth: 0
  },
  desktopEmptyCard: {
    minHeight: 76,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    alignItems: "center",
    justifyContent: "center",
    padding: 12
  },
  desktopEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  desktopPrimaryAction: {
    minHeight: 46,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  desktopPrimaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  desktopSecondaryAction: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9E7FF",
    backgroundColor: "#F7FBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  desktopSecondaryActionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  desktopNotice: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  desktopNoticeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    flex: 1
  },
  inviteBanner: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFE3FF",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  inviteIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  inviteBannerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    flex: 1
  },
  inviteBannerAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  stateBox: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center"
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 48
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
  calendarFab: {
    bottom: 164,
    backgroundColor: "#FFFFFF",
    shadowColor: "#101828",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8
  },
  calendarFabHovered: {
    shadowOpacity: 0.2,
    shadowRadius: 20,
    transform: [{ translateY: -2 }, { scale: 1.03 }]
  },
  calendarFabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }]
  },
  calendarFabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#CFE1FF",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  calendarFabCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
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
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center"
  }
});
