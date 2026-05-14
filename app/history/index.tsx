import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Clock3, Gift, Search, UserRound, X } from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { BottomTabBar } from "../../src/components/BottomTabBar";
import { ChevronCard, IconTextRow } from "../../src/components/Cards";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { TabHero } from "../../src/components/TabHero";
import { withCountLabels } from "../../src/components/segmentedControlOptions";
import { apiGetAuthenticated } from "../../src/api/client";
import { appointmentRoleMark } from "../../src/appointments/appointmentRole";
import { formatPenaltyLabel } from "../../src/appointments/penalty";
import { colors } from "../../src/theme";
import { useAuth } from "../../src/auth/AuthContext";
import {
  filterHistoryArchiveItems,
  monthArchiveLabel,
  type HistoryArchiveScope
} from "../../src/history/historyArchive";

type ApiAppointment = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  penalty: string;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: Array<{
    id: string;
    name: string;
    waytId?: string | null;
    membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
    punctuality?: "ON_TIME" | "LATE";
    lateMinutes?: number;
  }>;
};

type HistoryItem = {
  id: string;
  title: string;
  groupTitle: string;
  meta: string;
  people: string;
  penalty: string;
  placeName: string;
  scheduledAt: string;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: ApiAppointment["participants"];
};

const ARCHIVE_SCOPES: HistoryArchiveScope[] = ["ALL", "MONTH"];

export default function HistoryScreen() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [filterIndex, setFilterIndex] = useState(0);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    let mounted = true;
    setHistoryLoading(true);
    setHistoryError(null);

    apiGetAuthenticated<ApiAppointment[]>("/appointments/history")
      .then((appointments) => {
        if (mounted) {
          setItems(appointments.map(mapHistoryItem));
        }
      })
      .catch((error) => {
        if (mounted) {
          setItems([]);
          setHistoryError(error instanceof Error ? error.message : "히스토리를 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (mounted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const refreshHistory = useCallback(async () => {
    if (!user || refreshing) {
      return;
    }

    setRefreshing(true);
    setHistoryError(null);
    try {
      const appointments = await apiGetAuthenticated<ApiAppointment[]>("/appointments/history");
      setItems(appointments.map(mapHistoryItem));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "히스토리를 새로고침하지 못했어요.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, user]);

  const archiveScope = ARCHIVE_SCOPES[filterIndex] ?? "ALL";
  const isMonthScope = archiveScope === "MONTH";
  const isSearching = query.trim().length > 0;
  const allFilteredItems = useMemo(
    () => filterHistoryArchiveItems(items, { scope: "ALL", visibleMonth, query }),
    [items, query, visibleMonth]
  );
  const monthFilteredItems = useMemo(
    () => filterHistoryArchiveItems(items, { scope: "MONTH", visibleMonth, query }),
    [items, query, visibleMonth]
  );
  const visibleItems = isMonthScope ? monthFilteredItems : allFilteredItems;
  const filterOptions = useMemo(
    () => withCountLabels(["\uC804\uCCB4", "\uC6D4\uBCC4"], [allFilteredItems.length, monthFilteredItems.length]),
    [allFilteredItems.length, monthFilteredItems.length]
  );
  const groups = useMemo(() => groupHistory(visibleItems), [visibleItems]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppScreen withTabs refreshing={refreshing} onRefresh={refreshHistory}>
        <TabHero title="히스토리" subtitle="지난 약속 기록" />
        <View style={styles.archiveTools}>
          <View style={styles.searchBox}>
            <Search color={colors.textSubtle} size={19} strokeWidth={2.3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="약속명, 장소, 참가자 검색"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="검색어 지우기"
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <X color={colors.textSubtle} size={18} strokeWidth={2.5} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <SegmentedControl options={filterOptions} selectedIndex={filterIndex} onChange={setFilterIndex} />
        {isMonthScope ? (
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => setVisibleMonth((month) => addMonths(month, -1))}
              accessibilityRole="button"
              accessibilityLabel="이전 달"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronLeft color={colors.textMuted} size={22} strokeWidth={2.5} />
            </Pressable>
            <View style={styles.monthCenter}>
              <Text style={styles.monthLabel}>{monthArchiveLabel(visibleMonth)}</Text>
            </View>
            <Pressable
              onPress={() => setVisibleMonth((month) => addMonths(month, 1))}
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
            >
              <ChevronRight color={colors.textMuted} size={22} strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : null}
        <View style={styles.groups}>
          {historyLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : historyError ? (
            <Text style={styles.stateText}>{historyError}</Text>
          ) : visibleItems.length === 0 ? (
            <Text style={styles.stateText}>
              {isSearching
                ? "검색 결과가 없어요."
                : isMonthScope
                  ? "이 달의 약속 기록이 없어요."
                  : "지난 약속 기록이 없어요."}
            </Text>
          ) : (
            groups.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.cards}>
                  {group.items.map((item) => (
                    <ChevronCard key={item.id} onPress={() => router.push(`/history/${item.id}`)}>
                      <View style={styles.historyHeader}>
                        <Clock3 color={colors.primary} size={24} strokeWidth={2.2} />
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.meta} numberOfLines={1}>
                        {item.meta}
                      </Text>
                      <View style={styles.iconRows}>
                        <IconTextRow icon={UserRound} tone="primary">
                          {item.people}
                        </IconTextRow>
                        <IconTextRow icon={Gift}>{item.penalty}</IconTextRow>
                      </View>
                    </ChevronCard>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </AppScreen>
      <BottomTabBar />
    </>
  );
}

function mapHistoryItem(appointment: ApiAppointment): HistoryItem {
  const lateCount = appointment.participants.filter((participant) =>
    (participant.membershipStatus ?? "ACTIVE") === "ACTIVE" &&
    participant.punctuality === "LATE"
  ).length;
  const groupTitle = groupTitleFor(appointment.scheduledAt);
  const roleMark = appointmentRoleMark(appointment.myRole);

  return {
    id: appointment.id,
    title: appointment.title,
    groupTitle,
    meta: [roleMark, formatSchedule(appointment.scheduledAt), appointment.placeName].filter(Boolean).join(" · "),
    people: lateCount > 0 ? `지각자 ${lateCount}명` : "지각자 없음",
    penalty: formatPenaltyLabel(appointment.penalty),
    placeName: appointment.placeName,
    scheduledAt: appointment.scheduledAt,
    memo: appointment.memo,
    myRole: appointment.myRole,
    participants: appointment.participants
  };
}

function groupHistory(items: HistoryItem[]) {
  return items.reduce<Array<{ title: string; items: HistoryItem[] }>>((groups, item) => {
    const existing = groups.find((group) => group.title === item.groupTitle);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ title: item.groupTitle, items: [item] });
    }
    return groups;
  }, []);
}

function groupTitleFor(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "지난 약속";
  }
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(date);
}

function formatSchedule(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

const styles = StyleSheet.create({
  archiveTools: {
    gap: 12,
    marginBottom: 14
  },
  monthRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12
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
  monthCenter: {
    flex: 1,
    alignItems: "center",
    minWidth: 0
  },
  monthLabel: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center"
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFFFFF"
  },
  searchInput: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    minWidth: 0,
    paddingVertical: 0
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F9"
  },
  groups: {
    gap: 22,
    marginTop: 18
  },
  group: {
    gap: 12
  },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "900"
  },
  cards: {
    gap: 14
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  itemTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    flex: 1
  },
  meta: {
    color: colors.textMuted,
    fontSize: 15,
    marginLeft: 36,
    marginTop: 8
  },
  iconRows: {
    gap: 8,
    marginTop: 14
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
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }]
  }
});
