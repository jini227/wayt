import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { BellRing, CheckCircle2, Clock3, RotateCcw, Sparkles, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";
import { apiGetAuthenticated, apiPatchAuthenticated } from "../src/api/client";
import { AppScreen } from "../src/components/AppScreen";
import { Header, InfoCard } from "../src/components/Cards";
import { useAppFeedback } from "../src/feedback/AppFeedback";
import { notificationGroups, type NotificationGroupId } from "../src/notifications/notificationCatalog";
import {
  buildDefaultNotificationPreferences,
  enabledNotificationCount,
  mergeServerNotificationPreferences,
  NOTIFICATION_RESET_DIALOG_CONFIRM_LABEL,
  NOTIFICATION_RESET_DIALOG_MESSAGE,
  NOTIFICATION_RESET_DIALOG_TITLE,
  notificationPreferencesPatchRequest,
  resetNotificationPreferences,
  toggleNotificationPreference,
  type NotificationPreferences,
  type NotificationPreferencesResponse
} from "../src/notifications/notificationPreferences";
import { colors } from "../src/theme";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

const groupMeta: Record<
  NotificationGroupId,
  {
    icon: ComponentType<IconProps>;
    accent: string;
    soft: string;
    badge: string;
  }
> = {
  current: {
    icon: CheckCircle2,
    accent: colors.success,
    soft: colors.successSoft,
    badge: "적용 중"
  },
  high: {
    icon: Zap,
    accent: colors.primary,
    soft: colors.primarySoft,
    badge: "권장"
  },
  medium: {
    icon: BellRing,
    accent: "#7C5CFF",
    soft: "#F1EEFF",
    badge: "추천"
  },
  later: {
    icon: Sparkles,
    accent: "#E37A00",
    soft: "#FFF5E8",
    badge: "후순위"
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { showDialog, showToast } = useAppFeedback();
  const defaultPreferences = useMemo(() => buildDefaultNotificationPreferences(notificationGroups), []);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [savingPreferenceId, setSavingPreferenceId] = useState<string | null>(null);
  const enabledCount = useMemo(() => enabledNotificationCount(preferences), [preferences]);

  useEffect(() => {
    let cancelled = false;

    apiGetAuthenticated<NotificationPreferencesResponse>("/me/notification-preferences")
      .then((response) => {
        if (!cancelled) {
          setPreferences(mergeServerNotificationPreferences(defaultPreferences, response));
          setPreferencesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreferences(defaultPreferences);
          setPreferencesLoaded(true);
          showDialog({
            title: "알림 설정을 불러오지 못했어요",
            message: "기본값으로 보여드릴게요. 다시 저장하면 서버에 반영됩니다.",
            tone: "warning"
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [defaultPreferences]);

  const savePreferences = async (nextPreferences: NotificationPreferences) => {
    const response = await apiPatchAuthenticated<NotificationPreferencesResponse, ReturnType<typeof notificationPreferencesPatchRequest>>(
      "/me/notification-preferences",
      notificationPreferencesPatchRequest(nextPreferences)
    );
    return mergeServerNotificationPreferences(defaultPreferences, response);
  };

  const updatePreference = async (notificationId: string) => {
    if (savingPreferenceId) {
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = toggleNotificationPreference(preferences, notificationId);
    setPreferences(nextPreferences);
    setSavingPreferenceId(notificationId);
    try {
      setPreferences(await savePreferences(nextPreferences));
      showToast({ title: "알림 설정을 저장했어요", tone: "success" });
    } catch {
      setPreferences(previousPreferences);
      showDialog({
        title: "알림 설정을 저장하지 못했어요",
        message: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
        tone: "danger"
      });
    } finally {
      setSavingPreferenceId(null);
    }
  };

  const resetToDefaults = async () => {
    if (savingPreferenceId) {
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = resetNotificationPreferences(defaultPreferences);
    setPreferences(nextPreferences);
    setSavingPreferenceId("reset");
    try {
      setPreferences(await savePreferences(nextPreferences));
      showToast({ title: "알림 설정을 초기화했어요", tone: "success" });
    } catch {
      setPreferences(previousPreferences);
      showDialog({
        title: "초기화하지 못했어요",
        message: "서버 저장에 실패해서 기존 설정으로 되돌렸습니다.",
        tone: "danger"
      });
    } finally {
      setSavingPreferenceId(null);
    }
  };

  const handleReset = () => {
    showDialog({
      title: NOTIFICATION_RESET_DIALOG_TITLE,
      message: NOTIFICATION_RESET_DIALOG_MESSAGE,
      tone: "warning",
      actions: [
        { label: "취소", role: "cancel" },
        { label: NOTIFICATION_RESET_DIALOG_CONFIRM_LABEL, role: "destructive", onPress: resetToDefaults }
      ]
    });
  };

  return (
    <AppScreen>
      <Header
        title="알림"
        center
        subtitle={preferencesLoaded ? `${enabledCount}개 받는 중` : "불러오는 중"}
        back={() => router.back()}
        action={
          <Pressable
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="알림 설정 기본값으로 초기화"
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <RotateCcw color={colors.primary} size={21} strokeWidth={2.4} />
          </Pressable>
        }
      />

      {notificationGroups.map((group) => {
        const meta = groupMeta[group.id];
        const GroupIcon = meta.icon;

        return (
          <InfoCard key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: meta.soft }]}>
                <GroupIcon color={meta.accent} size={22} strokeWidth={2.4} />
              </View>
              <View style={styles.groupText}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupCaption}>{group.caption}</Text>
              </View>
              <Text style={[styles.countPill, { color: meta.accent, backgroundColor: meta.soft }]}>
                {group.items.length}개
              </Text>
            </View>

            <View style={styles.list}>
              {group.items.map((item, index) => (
                <View key={item.id} style={[styles.row, index < group.items.length - 1 && styles.border]}>
                  <View style={styles.rowText}>
                    <View style={styles.titleLine}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.statusPill, { color: meta.accent, backgroundColor: meta.soft }]}>
                        {meta.badge}
                      </Text>
                    </View>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <View style={styles.timingLine}>
                      <Clock3 color={colors.textSubtle} size={15} strokeWidth={2.1} />
                      <Text style={styles.itemTiming}>{item.timing}</Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences[item.id] ?? false}
                    onValueChange={() => updatePreference(item.id)}
                    disabled={!preferencesLoaded || savingPreferenceId !== null}
                    trackColor={{ false: "#DDE1E8", true: colors.primarySoft }}
                    thumbColor={preferences[item.id] ? colors.primary : "#FFFFFF"}
                    ios_backgroundColor="#DDE1E8"
                  />
                </View>
              ))}
            </View>
          </InfoCard>
        );
      })}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    marginBottom: 18
  },
  groupHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  groupText: {
    flex: 1,
    minWidth: 0
  },
  groupTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  groupCaption: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4
  },
  countPill: {
    minWidth: 42,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900"
  },
  list: {
    marginTop: 14
  },
  row: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowText: {
    flex: 1,
    minWidth: 0
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  itemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    flex: 1
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "900"
  },
  itemDescription: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 7
  },
  timingLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7
  },
  itemTiming: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1
  },
  resetButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }]
  }
});
