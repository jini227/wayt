import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Clock3, MapPin } from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { Header, IconTextRow, InfoCard } from "../../src/components/Cards";
import { ParticipantRow } from "../../src/components/ParticipantRow";
import { apiGetAuthenticated } from "../../src/api/client";
import {
  createHistoryDetailViewModel,
  type ApiHistoryAppointment,
  type StatusLogTone
} from "../../src/history/historyDetailViewModel";
import { colors } from "../../src/theme";

const TEXT = {
  header: "\uC57D\uC18D \uAE30\uB85D",
  resultTitle: "\uB3C4\uCC29 \uACB0\uACFC",
  penaltyTitle: "\uBC8C\uCE59",
  memoTitle: "\uC57D\uC18D \uBA54\uBAA8",
  logTitle: "\uC0C1\uD0DC \uB85C\uADF8",
  emptyParticipants: "\uB3C4\uCC29 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.",
  emptyLogs: "\uC0C1\uD0DC \uAE30\uB85D\uC774 \uC5C6\uC5B4\uC694.",
  missingId: "\uD788\uC2A4\uD1A0\uB9AC \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694.",
  loadError: "\uD788\uC2A4\uD1A0\uB9AC \uC0C1\uC138\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694."
};

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const appointmentId = Array.isArray(id) ? id[0] : id;
  const [appointment, setAppointment] = useState<ApiHistoryAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!appointmentId) {
      setAppointment(null);
      setError(TEXT.missingId);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    apiGetAuthenticated<ApiHistoryAppointment>(`/appointments/${appointmentId}`)
      .then((item) => {
        if (mounted) {
          setAppointment(item);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setAppointment(null);
          setError(fetchError instanceof Error ? fetchError.message : TEXT.loadError);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  const refreshHistoryDetail = useCallback(async () => {
    if (!appointmentId || refreshing) {
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      setAppointment(await apiGetAuthenticated<ApiHistoryAppointment>(`/appointments/${appointmentId}`));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : TEXT.loadError);
    } finally {
      setRefreshing(false);
    }
  }, [appointmentId, refreshing]);

  const detail = useMemo(
    () => (appointment ? createHistoryDetailViewModel(appointment) : null),
    [appointment]
  );

  if (loading) {
    return (
      <AppScreen refreshing={refreshing} onRefresh={refreshHistoryDetail}>
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!detail || error) {
    return (
      <AppScreen refreshing={refreshing} onRefresh={refreshHistoryDetail}>
        <Header title={TEXT.header} center back={() => router.back()} />
        <Text style={styles.stateText}>{error ?? TEXT.missingId}</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshHistoryDetail}>
      <Header title={TEXT.header} center back={() => router.back()} />
      <InfoCard>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{detail.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{detail.roleLabel}</Text>
          </View>
        </View>
        <View style={styles.topRows}>
          <IconTextRow icon={Clock3}>{detail.fullTime}</IconTextRow>
          <IconTextRow icon={MapPin}>{detail.place}</IconTextRow>
        </View>
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>{TEXT.resultTitle}</Text>
        {detail.participants.length > 0 ? (
          detail.participants.map((participant, index) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              mode="result"
              border={index < detail.participants.length - 1}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>{TEXT.emptyParticipants}</Text>
        )}
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>{TEXT.penaltyTitle}</Text>
        <Text style={styles.penalty}>{detail.penalty}</Text>
        <Text style={styles.target}>{detail.penaltyTarget}</Text>
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>{TEXT.memoTitle}</Text>
        <Text style={styles.memo}>{detail.memo}</Text>
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>{TEXT.logTitle}</Text>
        {detail.statusLogs.length > 0 ? (
          detail.statusLogs.map((log, index) => {
            const logColor = statusLogColor(log.tone);
            return (
              <View key={log.id} style={[styles.logRow, index < detail.statusLogs.length - 1 && styles.logBorder]}>
                <Clock3 color={logColor} size={22} strokeWidth={2.2} />
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={styles.logText}>{log.text}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>{TEXT.emptyLogs}</Text>
        )}
      </InfoCard>
    </AppScreen>
  );
}

function statusLogColor(tone: StatusLogTone) {
  if (tone === "danger") {
    return colors.danger;
  }
  if (tone === "success") {
    return colors.success;
  }
  if (tone === "primary") {
    return colors.primary;
  }
  return colors.textMuted;
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    flex: 1
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  },
  topRows: {
    gap: 10,
    marginTop: 18
  },
  cardGap: {
    marginTop: 18
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16
  },
  penalty: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 10
  },
  target: {
    color: colors.textMuted,
    fontSize: 18
  },
  memo: {
    color: colors.textMuted,
    fontSize: 18,
    lineHeight: 31
  },
  logRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 16,
    minWidth: 84
  },
  logText: {
    color: colors.textMuted,
    fontSize: 16,
    flex: 1
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "600"
  },
  stateBox: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center"
  },
  stateText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 24
  }
});
