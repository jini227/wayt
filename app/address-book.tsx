import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Search, Trash2, UserPlus, UsersRound } from "lucide-react-native";
import { useRouter } from "expo-router";
import { AppScreen } from "../src/components/AppScreen";
import { Avatar } from "../src/components/Avatar";
import { Header, InfoCard } from "../src/components/Cards";
import { apiDeleteAuthenticated, apiGetAuthenticated, apiPostAuthenticated } from "../src/api/client";
import { buildAddressBookSections, filterAddressBookEntries } from "../src/addressBook/addressBook";
import { normalizeWaytIdInput, type AddressBookEntry } from "../src/appointments/invite";
import { useAppFeedback } from "../src/feedback/AppFeedback";
import { colors, spacing } from "../src/theme";

export default function AddressBookScreen() {
  const router = useRouter();
  const { showDialog, showToast } = useAppFeedback();
  const [entries, setEntries] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [targetWaytId, setTargetWaytId] = useState("");

  const loadAddressBook = useCallback(() => {
    let cancelled = false;
    setLoading(true);

    apiGetAuthenticated<AddressBookEntry[]>("/address-book")
      .then((items) => {
        if (!cancelled) {
          setEntries(items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showDialog({
            title: "주소록을 불러오지 못했어요.",
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
  }, [showDialog]);

  useEffect(() => loadAddressBook(), [loadAddressBook]);

  const filteredEntries = useMemo(() => filterAddressBookEntries(entries, query), [entries, query]);
  const addressBookSections = useMemo(() => buildAddressBookSections(filteredEntries), [filteredEntries]);

  const handleAdd = useCallback(async () => {
    const normalizedWaytId = normalizeWaytIdInput(targetWaytId);
    if (!normalizedWaytId) {
      showToast({ title: "추가할 아이디를 입력해 주세요.", tone: "warning" });
      return;
    }

    setSaving(true);
    try {
      const created = await apiPostAuthenticated<AddressBookEntry, { targetWaytId: string; displayName?: string }>(
        "/address-book",
        { targetWaytId: normalizedWaytId }
      );
      setEntries((current) => [created, ...current.filter((entry) => normalizeWaytIdInput(entry.user.waytId) !== normalizedWaytId)]);
      setTargetWaytId("");
      showToast({ title: "주소록에 추가했어요." });
    } catch (error) {
      showDialog({
        title: "주소록에 추가하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setSaving(false);
    }
  }, [showDialog, showToast, targetWaytId]);

  const confirmDelete = useCallback(
    (entry: AddressBookEntry) => {
      showDialog({
        title: "주소록에서 삭제할까요?",
        message: `${entry.displayName}님을 빠른 초대 목록에서 제거해요.`,
        tone: "danger",
        actions: [
          { label: "취소", role: "cancel" },
          {
            label: "삭제",
            role: "destructive",
            onPress: async () => {
              try {
                await apiDeleteAuthenticated(`/address-book/${entry.id}`);
                setEntries((current) => current.filter((item) => item.id !== entry.id));
                showToast({ title: "주소록에서 삭제했어요." });
              } catch (error) {
                showDialog({
                  title: "삭제하지 못했어요.",
                  message: error instanceof Error ? error.message : undefined,
                  tone: "danger"
                });
              }
            }
          }
        ]
      });
    },
    [showDialog, showToast]
  );

  return (
    <AppScreen>
      <Header title="주소록" center back={() => router.back()} />

      <InfoCard>
        <Text style={styles.cardTitle}>빠른 초대</Text>
        <View style={styles.addRow}>
          <View style={styles.inputBox}>
            <UserPlus color={colors.primary} size={20} strokeWidth={2.3} />
            <TextInput
              value={targetWaytId}
              onChangeText={setTargetWaytId}
              placeholder="아이디 입력"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              style={styles.input}
            />
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="주소록에 추가"
            style={({ pressed }) => [styles.addButton, pressed && !saving && styles.pressed, saving && styles.disabled]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <UserPlus color="#FFFFFF" size={21} strokeWidth={2.5} />}
          </Pressable>
        </View>
      </InfoCard>

      <InfoCard style={styles.cardGap}>
        <View style={styles.searchBox}>
          <Search color={colors.textSubtle} size={20} strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="이름 또는 아이디 검색"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : addressBookSections.length > 0 ? (
          <View style={styles.list}>
            {addressBookSections.map((section, sectionIndex) => (
              <View key={section.title} style={sectionIndex > 0 && styles.sectionGap}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.entries.map((entry, index) => (
                  <View key={entry.id} style={[styles.row, index < section.entries.length - 1 && styles.border]}>
                    <Avatar uri={entry.user.avatarUrl ?? ""} name={entry.displayName} accent={colors.primary} size={48} />
                    <View style={styles.rowText}>
                      <Text style={styles.name} numberOfLines={1}>{entry.displayName}</Text>
                      <Text style={styles.handle} numberOfLines={1}>{entry.user.waytId}</Text>
                    </View>
                    <Pressable
                      onPress={() => confirmDelete(entry)}
                      accessibilityRole="button"
                      accessibilityLabel={`${entry.displayName} 삭제`}
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                    >
                      <Trash2 color={colors.danger} size={20} strokeWidth={2.4} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <UsersRound color={colors.textSubtle} size={32} strokeWidth={2.1} />
            <Text style={styles.emptyTitle}>{query ? "검색 결과가 없어요." : "아직 저장된 사람이 없어요."}</Text>
          </View>
        )}
      </InfoCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  inputBox: {
    minHeight: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DADDE3",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1
  },
  input: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    paddingVertical: 0
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...spacing.buttonShadow
  },
  cardGap: {
    marginTop: 18
  },
  searchBox: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  list: {
    marginTop: 12
  },
  sectionGap: {
    marginTop: 14
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowText: {
    flex: 1,
    minWidth: 0
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  handle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  stateBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  emptyTitle: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  }
});
