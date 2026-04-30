import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UsersRound } from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { Header, InfoCard } from "../../src/components/Cards";
import { apiGetAuthenticated } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import {
  appointmentIndicator,
  appointmentsForCalendarDate,
  buildCalendarMonth,
  calendarDateKey,
  calendarGridDateRange,
  calendarMonthLabel
} from "../../src/appointments/appointmentCalendar";
import { appointmentRoleMark } from "../../src/appointments/appointmentRole";
import { colors, spacing } from "../../src/theme";

type ApiParticipant = {
  id: string;
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
};

type ApiAppointment = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  completedAt?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: ApiParticipant[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function AppointmentCalendarScreen() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(() => calendarDateKey(new Date()));
  const visibleDateRange = useMemo(() => calendarGridDateRange(visibleMonth), [visibleMonth]);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      return;
    }

    let mounted = true;
    setAppointmentsLoading(true);
    setAppointmentsError(null);

    apiGetAuthenticated<ApiAppointment[]>(
      `/appointments?scope=all&from=${encodeURIComponent(visibleDateRange.from)}&to=${encodeURIComponent(visibleDateRange.to)}`
    )
      .then((items) => {
        if (mounted) {
          setAppointments(items);
        }
      })
      .catch((error) => {
        if (mounted) {
          setAppointments([]);
          setAppointmentsError(error instanceof Error ? error.message : "약속 달력을 불러오지 못했어요.");
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
  }, [user, visibleDateRange.from, visibleDateRange.to]);

  const refreshCalendar = useCallback(async () => {
    if (!user || refreshing) {
      return;
    }

    setRefreshing(true);
    setAppointmentsError(null);
    try {
      setAppointments(await apiGetAuthenticated<ApiAppointment[]>(
        `/appointments?scope=all&from=${encodeURIComponent(visibleDateRange.from)}&to=${encodeURIComponent(visibleDateRange.to)}`
      ));
    } catch (error) {
      setAppointmentsError(error instanceof Error ? error.message : "?쎌냽 ?щ젰??遺덈윭?ㅼ? 紐삵뻽?댁슂.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, user, visibleDateRange.from, visibleDateRange.to]);

  const calendarMonth = useMemo(() => buildCalendarMonth(visibleMonth, appointments), [appointments, visibleMonth]);
  const selectedAppointments = useMemo(
    () => appointmentsForCalendarDate(appointments, selectedDateKey),
    [appointments, selectedDateKey]
  );
  const selectedDateLabel = useMemo(() => formatSelectedDateLabel(selectedDateKey), [selectedDateKey]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const moveToToday = () => {
    const today = new Date();
    setVisibleMonth(startOfMonth(today));
    setSelectedDateKey(calendarDateKey(today));
  };

  const selectDay = (dateKey: string, isCurrentMonth: boolean) => {
    setSelectedDateKey(dateKey);
    if (!isCurrentMonth) {
      setVisibleMonth(startOfMonth(dateFromKey(dateKey)));
    }
  };

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshCalendar}>
      <Header
        title="약속 달력"
        center
        back={() => router.back()}
        action={
          <Pressable
            onPress={moveToToday}
            accessibilityRole="button"
            accessibilityLabel="오늘로 이동"
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}
          >
            <Text style={styles.todayText}>오늘</Text>
          </Pressable>
        }
      />

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
        >
          <ChevronLeft color={colors.textMuted} size={22} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.monthTitle}>{calendarMonthLabel(visibleMonth)}</Text>
        <Pressable
          onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
        >
          <ChevronRight color={colors.textMuted} size={22} strokeWidth={2.5} />
        </Pressable>
      </View>

      <InfoCard style={styles.calendarCard}>
        {appointmentsLoading ? (
          <View style={styles.calendarState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : appointmentsError ? (
          <View style={styles.calendarState}>
            <Text style={styles.stateText}>{appointmentsError}</Text>
          </View>
        ) : (
          <>
            <View style={styles.weekHeader}>
              {WEEKDAYS.map((weekday, index) => (
                <Text key={weekday} style={[styles.weekdayText, index === 0 && styles.sundayText]}>
                  {weekday}
                </Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {calendarMonth.weeks.flat().map((day) => {
                const selected = day.key === selectedDateKey;
                const today = day.key === calendarDateKey(new Date());
                const indicator = appointmentIndicator(day.appointmentCount);
                return (
                  <Pressable
                    key={day.key}
                    onPress={() => selectDay(day.key, day.isCurrentMonth)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatSelectedDateLabel(day.key)} 약속 ${day.appointmentCount}개`}
                    style={({ pressed }) => [
                      styles.dayCell,
                      selected && styles.selectedDayCell,
                      pressed && styles.pressed
                    ]}
                  >
                    <View style={[styles.dayNumberWrap, today && styles.todayDayWrap, selected && styles.selectedDayWrap]}>
                      <Text
                        style={[
                          styles.dayNumber,
                          !day.isCurrentMonth && styles.outsideDayNumber,
                          selected && styles.selectedDayNumber
                        ]}
                      >
                        {day.dayNumber}
                      </Text>
                    </View>
                    <View style={styles.indicatorRow}>
                      {indicator === "count" ? (
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{day.appointmentCount > 99 ? "99+" : day.appointmentCount}</Text>
                        </View>
                      ) : indicator === "none" ? null : (
                        Array.from({ length: indicator === "single" ? 1 : day.appointmentCount }).map((_, index) => (
                          <View key={index} style={[styles.dot, selected && styles.selectedDot]} />
                        ))
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </InfoCard>

      <View style={styles.selectedSection}>
        <View style={styles.selectedHeader}>
          <View>
            <Text style={styles.selectedTitle}>{selectedDateLabel}</Text>
            <Text style={styles.selectedSubtitle}>약속 {selectedAppointments.length}개</Text>
          </View>
          <CalendarDays color={colors.primary} size={24} strokeWidth={2.4} />
        </View>

        {selectedAppointments.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>이 날은 약속이 없어요.</Text>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {selectedAppointments.map((appointment) => {
              const roleMark = appointmentRoleMark(appointment.myRole);
              return (
                <Pressable
                  key={appointment.id}
                  onPress={() => router.push(`/appointments/${appointment.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${appointment.title} 상세 보기`}
                  style={({ pressed }) => [styles.appointmentCard, pressed && styles.pressed]}
                >
                  <View style={styles.appointmentIcon}>
                    <Clock3 color={colors.primary} size={21} strokeWidth={2.4} />
                  </View>
                  <View style={styles.appointmentText}>
                    <Text style={styles.appointmentTime}>{formatTime(appointment.scheduledAt)}</Text>
                    <Text style={styles.appointmentTitle} numberOfLines={1}>
                      {appointment.title}
                    </Text>
                    <View style={styles.appointmentMetaRow}>
                      <MapPin color={colors.textSubtle} size={15} strokeWidth={2.3} />
                      <Text style={styles.appointmentMeta} numberOfLines={1}>
                        {appointment.placeName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appointmentSide}>
                    {roleMark ? <Text style={styles.rolePill}>{roleMark}</Text> : null}
                    <View style={styles.peoplePill}>
                      <UsersRound color={colors.textMuted} size={14} strokeWidth={2.3} />
                      <Text style={styles.peopleText}>{activeParticipantCount(appointment.participants)}</Text>
                    </View>
                  </View>
                  <ChevronRight color={colors.textSubtle} size={22} strokeWidth={2.3} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </AppScreen>
  );
}

function activeParticipantCount(participants: readonly ApiParticipant[]) {
  return participants.filter((participant) => (participant.membershipStatus ?? "ACTIVE") === "ACTIVE").length;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatSelectedDateLabel(key: string) {
  const date = dateFromKey(key);
  if (Number.isNaN(date.getTime())) {
    return "선택한 날짜";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

const styles = StyleSheet.create({
  todayButton: {
    minHeight: 36,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CFE1FF",
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13
  },
  todayText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  monthRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  monthTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    flex: 1
  },
  calendarCard: {
    padding: 16
  },
  calendarState: {
    minHeight: 348,
    alignItems: "center",
    justifyContent: "center"
  },
  weekHeader: {
    height: 28,
    flexDirection: "row",
    alignItems: "center"
  },
  weekdayText: {
    width: `${100 / 7}%`,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center"
  },
  sundayText: {
    color: colors.danger
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12
  },
  selectedDayCell: {
    backgroundColor: "#F7FAFF"
  },
  dayNumberWrap: {
    width: 31,
    height: 29,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  todayDayWrap: {
    borderWidth: 1,
    borderColor: "#B8D8FF"
  },
  selectedDayWrap: {
    borderWidth: 0,
    backgroundColor: colors.primary
  },
  dayNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  outsideDayNumber: {
    color: colors.textSubtle,
    opacity: 0.44
  },
  selectedDayNumber: {
    color: "#FFFFFF",
    opacity: 1
  },
  indicatorRow: {
    height: 14,
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  selectedDot: {
    backgroundColor: colors.primaryDark
  },
  countBadge: {
    minWidth: 18,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  selectedSection: {
    marginTop: 22
  },
  selectedHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  selectedTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  selectedSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  emptyDay: {
    minHeight: 108,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyDayText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700"
  },
  appointmentList: {
    gap: 12,
    marginTop: 12
  },
  appointmentCard: {
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F1F4",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...spacing.softShadow
  },
  appointmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  appointmentText: {
    flex: 1,
    minWidth: 0
  },
  appointmentTime: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  appointmentTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 3
  },
  appointmentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5
  },
  appointmentMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    minWidth: 0
  },
  appointmentSide: {
    alignItems: "flex-end",
    gap: 7
  },
  rolePill: {
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: colors.primary,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  peoplePill: {
    minHeight: 24,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7
  },
  peopleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900"
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  }
});
