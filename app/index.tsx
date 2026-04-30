import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays, Inbox, Plus } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AppScreen } from "../src/components/AppScreen";
import { AppointmentCard, type AppointmentCardData } from "../src/components/AppointmentCard";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { SegmentedControl } from "../src/components/SegmentedControl";
import { withCountLabels } from "../src/components/segmentedControlOptions";
import { apiGetAuthenticated } from "../src/api/client";
import { filterHomeAppointments, type HomeAppointmentLike } from "../src/appointments/homeAppointments";
import { formatAppointmentScheduleLabel } from "../src/appointments/liveAppointmentSchedule";
import { formatPenaltyLabel, isMeaningfulPenalty } from "../src/appointments/penalty";
import { receivedInviteSummaryLabel, type ReceivedInvite } from "../src/invites/receivedInvites";
import { colors } from "../src/theme";
import { useAuth } from "../src/auth/AuthContext";

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
      <AppScreen withTabs refreshing={refreshing} onRefresh={refreshHome}>
        <View style={styles.hero}>
          <Text style={styles.title}>가는중</Text>
          <Text style={styles.subtitle}>다가오는 약속</Text>
        </View>
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
      <BottomTabBar />
    </>
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
  hero: {
    marginBottom: 18
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6
  },
  list: {
    gap: 14,
    marginTop: 16
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
