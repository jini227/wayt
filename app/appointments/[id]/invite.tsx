import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronRight, Copy, Search, Share2, UserPlus, UsersRound } from "lucide-react-native";
import { AppScreen } from "../../../src/components/AppScreen";
import { Avatar } from "../../../src/components/Avatar";
import { Header, InfoCard } from "../../../src/components/Cards";
import { FooterBar } from "../../../src/components/FooterBar";
import { PrimaryButton } from "../../../src/components/Buttons";
import { ParticipantRow } from "../../../src/components/ParticipantRow";
import type { Participant } from "../../../src/data/mock";
import {
  buildAddressBookInviteRows,
  buildAddressBookInviteSections,
  buildCurrentParticipantRows,
  buildSentInviteRows,
  buildWaytIdSuggestionRows,
  getSelectedInviteFooterLabel,
  loadInviteScreenData,
  normalizeWaytIdInput,
  type AddressBookEntry,
  type AddressBookInviteRow,
  type InviteParticipant,
  type SentInvite,
  type SentInviteProfile,
  type WaytIdSuggestion
} from "../../../src/appointments/invite";
import { createAppointmentShareMessage, createAppointmentShareUrl } from "../../../src/appointments/appointmentShare";
import { apiGetAuthenticated, apiPostAuthenticated } from "../../../src/api/client";
import { useAuth } from "../../../src/auth/AuthContext";
import { env } from "../../../src/config/env";
import { useAppFeedback } from "../../../src/feedback/AppFeedback";
import { preloadKakaoAppointmentShare, shareAppointmentWithKakao } from "../../../src/appointments/kakaoAppointmentShare";
import { colors, spacing } from "../../../src/theme";

type ApiAppointment = {
  id: string;
  title: string;
  participants: InviteParticipant[];
};

type ApiInvite = SentInvite & {
  appointmentId: string;
  appointmentTitle: string;
  type: "LINK" | "WAYT_ID";
  token: string;
  url: string;
  createdAt: string;
};

export default function InviteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast, showDialog } = useAppFeedback();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<ApiAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [targetWaytId, setTargetWaytId] = useState("");
  const [idInviteLoading, setIdInviteLoading] = useState(false);
  const [sentInvites, setSentInvites] = useState<ApiInvite[]>([]);
  const [cancellingInviteIds, setCancellingInviteIds] = useState<Set<string>>(() => new Set());
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [addressBookLoading, setAddressBookLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addressBookMode, setAddressBookMode] = useState(false);
  const [addressBookQuery, setAddressBookQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedWaytIds, setSelectedWaytIds] = useState<Set<string>>(() => new Set());
  const [selectedInviteLoading, setSelectedInviteLoading] = useState(false);
  const [serverWaytIdSuggestions, setServerWaytIdSuggestions] = useState<WaytIdSuggestion[]>([]);
  const [sentInviteProfiles, setSentInviteProfiles] = useState<WaytIdSuggestion[]>([]);
  const suggestionCacheRef = useRef<Map<string, WaytIdSuggestion[]>>(new Map());
  const suggestionRequestRef = useRef(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("약속 정보를 찾지 못했어요.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSentInvites([]);
    setCancellingInviteIds(new Set());
    setSentInviteProfiles([]);

    loadInviteScreenData({
      fetchAppointment: () => apiGetAuthenticated<ApiAppointment>(`/appointments/${id}`),
      fetchInvites: () => apiGetAuthenticated<ApiInvite[]>(`/appointments/${id}/invites`)
    })
      .then(({ appointment: item, invites }) => {
        if (!cancelled) {
          setAppointment(item);
          setSentInvites(invites.filter((invite) => invite.type === "WAYT_ID"));
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setAppointment(null);
          setError(fetchError instanceof Error ? fetchError.message : "약속 정보를 불러오지 못했어요.");
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
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setAddressBookLoading(true);

    apiGetAuthenticated<AddressBookEntry[]>("/address-book")
      .then((items) => {
        if (!cancelled) {
          setAddressBook(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddressBook([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAddressBookLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshInviteScreen = useCallback(async () => {
    if (!id || refreshing) {
      return;
    }

    setRefreshing(true);
    setError(null);
    setAddressBookLoading(true);
    try {
      const [inviteDataResult, addressBookResult] = await Promise.allSettled([
        loadInviteScreenData({
          fetchAppointment: () => apiGetAuthenticated<ApiAppointment>(`/appointments/${id}`),
          fetchInvites: () => apiGetAuthenticated<ApiInvite[]>(`/appointments/${id}/invites`)
        }),
        apiGetAuthenticated<AddressBookEntry[]>("/address-book")
      ]);

      if (inviteDataResult.status === "fulfilled") {
        const { appointment: item, invites } = inviteDataResult.value;
        setAppointment(item);
        setSentInvites(invites.filter((invite) => invite.type === "WAYT_ID"));
      } else {
        const refreshError = inviteDataResult.reason;
        setError(refreshError instanceof Error ? refreshError.message : "초대 정보를 새로고침하지 못했어요.");
      }

      if (addressBookResult.status === "fulfilled") {
        setAddressBook(addressBookResult.value);
      } else {
        setAddressBook([]);
      }
    } finally {
      setAddressBookLoading(false);
      setRefreshing(false);
    }
  }, [id, refreshing]);

  useEffect(() => {
    const requestId = suggestionRequestRef.current + 1;
    suggestionRequestRef.current = requestId;

    const query = normalizeWaytIdInput(targetWaytId).toLowerCase();
    if (!suggestionsOpen || !query) {
      setServerWaytIdSuggestions([]);
      return;
    }

    const cached = suggestionCacheRef.current.get(query);
    if (cached) {
      setServerWaytIdSuggestions(cached);
      return;
    }

    const timeoutId = setTimeout(() => {
      apiGetAuthenticated<WaytIdSuggestion[]>(
        `/users/wayt-id-suggestions?query=${encodeURIComponent(query)}&limit=4`
      )
        .then((items) => {
          if (suggestionRequestRef.current !== requestId) {
            return;
          }

          if (suggestionCacheRef.current.size >= 30) {
            const firstKey = suggestionCacheRef.current.keys().next().value;
            if (firstKey) {
              suggestionCacheRef.current.delete(firstKey);
            }
          }
          suggestionCacheRef.current.set(query, items);
          setServerWaytIdSuggestions(items);
        })
        .catch(() => {
          if (suggestionRequestRef.current === requestId) {
            suggestionCacheRef.current.set(query, []);
            setServerWaytIdSuggestions([]);
          }
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [suggestionsOpen, targetWaytId]);

  const currentParticipantRows = useMemo(
    () =>
      buildCurrentParticipantRows({
        participants: appointment?.participants ?? []
      }),
    [appointment?.participants]
  );

  const addressBookRows = useMemo(
    () =>
      buildAddressBookInviteRows({
        addressBook,
        participants: appointment?.participants ?? [],
        sentInvites,
        selectedWaytIds
      }),
    [addressBook, appointment?.participants, selectedWaytIds, sentInvites]
  );

  const knownSentInviteProfiles = useMemo<SentInviteProfile[]>(
    () => [
      ...addressBookRows.map((row) => ({
        waytId: row.waytId,
        title: row.title,
        avatarUrl: row.avatarUrl
      })),
      ...serverWaytIdSuggestions.map((suggestion) => ({
        waytId: suggestion.waytId,
        title: suggestion.nickname,
        avatarUrl: suggestion.avatarUrl
      })),
      ...sentInviteProfiles.map((profile) => ({
        waytId: profile.waytId,
        title: profile.nickname,
        avatarUrl: profile.avatarUrl
      }))
    ],
    [addressBookRows, sentInviteProfiles, serverWaytIdSuggestions]
  );

  const sentInviteRows = useMemo(
    () =>
      buildSentInviteRows({
        participants: appointment?.participants ?? [],
        sentInvites,
        inviteProfiles: knownSentInviteProfiles,
        currentUserWaytId: user?.waytId
      }),
    [appointment?.participants, knownSentInviteProfiles, sentInvites, user?.waytId]
  );

  const selectedRows = useMemo(() => addressBookRows.filter((row) => row.selected), [addressBookRows]);
  const addressBookSections = useMemo(
    () =>
      buildAddressBookInviteSections({
        rows: addressBookRows,
        query: addressBookQuery
      }),
    [addressBookQuery, addressBookRows]
  );
  const suggestionRows = useMemo(
    () =>
      suggestionsOpen
        ? buildWaytIdSuggestionRows({
            addressBookRows,
            serverSuggestions: serverWaytIdSuggestions,
            participants: appointment?.participants ?? [],
            sentInvites,
            currentUserWaytId: user?.waytId,
            query: targetWaytId,
            limit: 4
          })
        : [],
    [addressBookRows, appointment?.participants, sentInvites, serverWaytIdSuggestions, suggestionsOpen, targetWaytId, user?.waytId]
  );
  const appointmentShareUrl = useMemo(
    () => appointment
      ? createAppointmentShareUrl({
        appointmentId: appointment.id,
        currentHref: typeof window === "undefined" ? undefined : window.location.href
      })
      : "",
    [appointment]
  );

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    void preloadKakaoAppointmentShare({ javascriptKey: env.kakaoJavascriptKey });
  }, []);

  useEffect(() => {
    const normalizedMyWaytId = normalizeWaytIdInput(user?.waytId ?? "").toLowerCase();
    const knownWaytIds = new Set(
      knownSentInviteProfiles.flatMap((profile) => {
        const waytId = normalizeWaytIdInput(profile.waytId).toLowerCase();
        return waytId ? [waytId] : [];
      })
    );
    const missingWaytIds = Array.from(new Set(
      sentInvites.flatMap((invite) => {
        const target = normalizeWaytIdInput(invite.targetWaytId ?? "").toLowerCase();
        if (
          !target ||
          invite.status !== "PENDING" ||
          target === normalizedMyWaytId ||
          invite.targetNickname?.trim() ||
          knownWaytIds.has(target)
        ) {
          return [];
        }
        return [target];
      })
    ));

    if (missingWaytIds.length === 0) {
      return;
    }

    let cancelled = false;
    Promise.all(
      missingWaytIds.map(async (waytId) => {
        const cached = suggestionCacheRef.current.get(waytId);
        const items = cached ?? await apiGetAuthenticated<WaytIdSuggestion[]>(
          `/users/wayt-id-suggestions?query=${encodeURIComponent(waytId)}&limit=1`
        );
        if (!cached) {
          if (suggestionCacheRef.current.size >= 30) {
            const firstKey = suggestionCacheRef.current.keys().next().value;
            if (firstKey) {
              suggestionCacheRef.current.delete(firstKey);
            }
          }
          suggestionCacheRef.current.set(waytId, items);
        }
        return items.find((item) => normalizeWaytIdInput(item.waytId).toLowerCase() === waytId) ?? null;
      })
    )
      .then((profiles) => {
        if (cancelled) {
          return;
        }
        const loadedProfiles = profiles.filter((profile): profile is WaytIdSuggestion => profile !== null);
        if (loadedProfiles.length === 0) {
          return;
        }
        setSentInviteProfiles((current) => {
          const seen = new Set(current.map((profile) => normalizeWaytIdInput(profile.waytId).toLowerCase()));
          const next = [...current];
          for (const profile of loadedProfiles) {
            const waytId = normalizeWaytIdInput(profile.waytId).toLowerCase();
            if (!seen.has(waytId)) {
              next.push(profile);
              seen.add(waytId);
            }
          }
          return next;
        });
      })
      .catch(() => {
        // The invite row can still fall back to the ID if profile lookup is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [knownSentInviteProfiles, sentInvites, user?.waytId]);

  const handleCopyLink = useCallback(async () => {
    try {
      if (!appointmentShareUrl) {
        throw new Error("약속 정보를 먼저 불러와 주세요.");
      }

      await Clipboard.setStringAsync(appointmentShareUrl);
      showToast({ title: "공유 링크를 복사했어요." });
    } catch (copyError) {
      showDialog({
        title: "링크를 만들지 못했어요.",
        message: copyError instanceof Error ? copyError.message : undefined,
        tone: "danger"
      });
    }
  }, [appointmentShareUrl, showDialog, showToast]);

  const handleShareLink = useCallback(async () => {
    if (!appointment || !appointmentShareUrl || shareLoading) {
      return;
    }

    setShareLoading(true);
    try {
      const message = createAppointmentShareMessage({
        appointmentTitle: appointment.title,
        url: appointmentShareUrl
      });

      if (Platform.OS === "web" && await shareAppointmentWithKakao({
        javascriptKey: env.kakaoJavascriptKey,
        appointmentTitle: appointment.title,
        url: appointmentShareUrl
      })) {
        return;
      }

      const webNavigator = typeof navigator === "undefined"
        ? null
        : navigator as Navigator & { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };

      if (Platform.OS === "web" && webNavigator?.share) {
        await webNavigator.share({
          title: appointment.title,
          text: message,
          url: appointmentShareUrl
        });
        return;
      }

      if (Platform.OS === "web") {
        showDialog({
          title: "카카오 공유를 열지 못했어요.",
          message: "왼쪽 링크 복사 버튼으로 공유 링크를 복사해 주세요.",
          tone: "warning"
        });
        return;
      }

      await Share.share({
        title: appointment.title,
        url: appointmentShareUrl,
        message
      });
    } catch (shareError) {
      showDialog({
        title: "공유하지 못했어요.",
        message: shareError instanceof Error ? shareError.message : undefined,
        tone: "danger"
      });
    } finally {
      setShareLoading(false);
    }
  }, [appointment, appointmentShareUrl, shareLoading, showDialog, showToast]);

  const addAddressBookEntry = useCallback(
    async (targetWaytId: string) => {
      const normalizedTargetWaytId = normalizeWaytIdInput(targetWaytId);
      const existing = addressBook.some((entry) => normalizeWaytIdInput(entry.user.waytId) === normalizedTargetWaytId);
      if (existing) {
        return;
      }

      const created = await apiPostAuthenticated<AddressBookEntry, { targetWaytId: string; displayName?: string }>(
        "/address-book",
        { targetWaytId: normalizedTargetWaytId }
      );
      setAddressBook((current) => [
        created,
        ...current.filter((entry) => normalizeWaytIdInput(entry.user.waytId) !== normalizedTargetWaytId)
      ]);
    },
    [addressBook]
  );

  const toggleAddressBookRow = useCallback((row: AddressBookInviteRow) => {
    if (row.disabled || selectedInviteLoading) {
      return;
    }

    setSelectedWaytIds((current) => {
      const next = new Set(current);
      if (next.has(row.waytId)) {
        next.delete(row.waytId);
      } else {
        next.add(row.waytId);
      }
      return next;
    });
  }, [selectedInviteLoading]);

  const handleSelectSuggestion = useCallback((row: AddressBookInviteRow) => {
    setTargetWaytId(row.waytId);
    setSuggestionsOpen(false);
  }, []);

  const handleInviteSelected = useCallback(async () => {
    if (!appointment || selectedRows.length === 0 || selectedInviteLoading) {
      return;
    }

    const normalizedMyWaytId = normalizeWaytIdInput(user?.waytId ?? "");
    if (!normalizedMyWaytId) {
      showDialog({ title: "로그인이 필요해요.", tone: "warning" });
      return;
    }

    setSelectedInviteLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) =>
          apiPostAuthenticated<ApiInvite, { inviterWaytId: string; targetWaytId: string }>(
            `/appointments/${appointment.id}/invites/by-wayt-id`,
            {
              inviterWaytId: normalizedMyWaytId,
              targetWaytId: row.waytId
            }
          )
        )
      );

      const fulfilled = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (fulfilled.length > 0) {
        setSentInvites((current) => {
          const invitedWaytIds = new Set(fulfilled.map((invite) => normalizeWaytIdInput(invite.targetWaytId ?? "")));
          return [
            ...fulfilled,
            ...current.filter((item) => !invitedWaytIds.has(normalizeWaytIdInput(item.targetWaytId ?? "")))
          ];
        });
        setSelectedWaytIds((current) => {
          const next = new Set(current);
          for (const invite of fulfilled) {
            next.delete(normalizeWaytIdInput(invite.targetWaytId ?? ""));
          }
          return next;
        });
      }

      const failedCount = results.length - fulfilled.length;
      if (failedCount === 0) {
        showToast({ title: `${fulfilled.length}명에게 초대를 보냈어요.` });
      } else if (fulfilled.length > 0) {
        showDialog({
          title: `${fulfilled.length}명 초대, ${failedCount}명 실패`,
          message: "실패한 사람은 잠시 뒤 다시 초대해 주세요.",
          tone: "warning"
        });
      } else {
        showDialog({
          title: "주소록 초대에 실패했어요.",
          message: "잠시 뒤 다시 시도해 주세요.",
          tone: "danger"
        });
      }
    } finally {
      setSelectedInviteLoading(false);
    }
  }, [appointment, selectedInviteLoading, selectedRows, showDialog, showToast, user?.waytId]);

  const handleInviteByWaytId = useCallback(async () => {
    if (!appointment || idInviteLoading) {
      return;
    }

    const normalizedTargetWaytId = normalizeWaytIdInput(targetWaytId);
    const normalizedMyWaytId = normalizeWaytIdInput(user?.waytId ?? "");

    if (!normalizedTargetWaytId) {
      showToast({ title: "초대할 아이디를 입력해 주세요.", tone: "warning" });
      return;
    }
    if (!normalizedMyWaytId) {
      showDialog({ title: "로그인이 필요해요.", tone: "warning" });
      return;
    }
    if (normalizedTargetWaytId === normalizedMyWaytId) {
      showToast({ title: "내 아이디는 초대할 수 없어요.", tone: "warning" });
      return;
    }
    if (appointment.participants.some((participant) =>
      (participant.membershipStatus ?? "ACTIVE") === "ACTIVE" &&
      normalizeWaytIdInput(participant.waytId) === normalizedTargetWaytId
    )) {
      showToast({ title: "이미 참가 중인 아이디예요.", tone: "warning" });
      return;
    }

    setIdInviteLoading(true);
    try {
      const invite = await apiPostAuthenticated<ApiInvite, { inviterWaytId: string; targetWaytId: string }>(
        `/appointments/${appointment.id}/invites/by-wayt-id`,
        {
          inviterWaytId: normalizedMyWaytId,
          targetWaytId: normalizedTargetWaytId
        }
      );
      setSentInvites((current) => [
        invite,
        ...current.filter((item) => normalizeWaytIdInput(item.targetWaytId ?? "") !== normalizedTargetWaytId)
      ]);
      setTargetWaytId("");
      const existsInAddressBook = addressBook.some((entry) => normalizeWaytIdInput(entry.user.waytId) === normalizedTargetWaytId);
      if (existsInAddressBook) {
        showToast({ title: `${normalizedTargetWaytId}님에게 초대를 보냈어요.` });
      } else {
        showDialog({
          title: `${normalizedTargetWaytId}님에게 초대를 보냈어요.`,
          message: "다음에 더 빨리 초대할 수 있게 주소록에 추가할까요?",
          tone: "success",
          actions: [
            { label: "나중에", role: "cancel" },
            {
              label: "추가",
              role: "primary",
              onPress: () => {
                void addAddressBookEntry(normalizedTargetWaytId)
                  .then(() => showToast({ title: "주소록에 추가했어요." }))
                  .catch((error) => {
                    showDialog({
                      title: "주소록에 추가하지 못했어요.",
                      message: error instanceof Error ? error.message : undefined,
                      tone: "danger"
                    });
                  });
              }
            }
          ]
        });
      }
    } catch (inviteError) {
      showDialog({
        title: "아이디 초대에 실패했어요.",
        message: inviteError instanceof Error ? inviteError.message : undefined,
        tone: "danger"
      });
    } finally {
      setIdInviteLoading(false);
    }
  }, [addAddressBookEntry, addressBook, appointment, idInviteLoading, showDialog, showToast, targetWaytId, user?.waytId]);

  const cancelInvite = useCallback(async (invite: ApiInvite) => {
    if (!appointment || cancellingInviteIds.has(invite.id)) {
      return;
    }

    setCancellingInviteIds((current) => new Set(current).add(invite.id));
    try {
      await apiPostAuthenticated<ApiInvite, Record<string, never>>(
        `/appointments/${appointment.id}/invites/${invite.id}/cancel`,
        {}
      );
      setSentInvites((current) => current.filter((item) => item.id !== invite.id));
      showToast({ title: "초대를 취소했어요." });
    } catch (cancelError) {
      showDialog({
        title: "초대를 취소하지 못했어요.",
        message: cancelError instanceof Error ? cancelError.message : undefined,
        tone: "danger"
      });
    } finally {
      setCancellingInviteIds((current) => {
        const next = new Set(current);
        next.delete(invite.id);
        return next;
      });
    }
  }, [appointment, cancellingInviteIds, showDialog, showToast]);

  const confirmCancelInvite = useCallback((invite: ApiInvite) => {
    const targetName = invite.targetNickname?.trim() || invite.targetWaytId || "초대받은 사람";
    showDialog({
      title: "초대를 취소할까요?",
      message: `${targetName}님에게 보낸 초대가 취소되고 알림이 가요.`,
      tone: "danger",
      actions: [
        { label: "아니요", role: "cancel" },
        { label: "취소", role: "destructive", onPress: () => void cancelInvite(invite) }
      ]
    });
  }, [cancelInvite, showDialog]);

  const footerLabel = getSelectedInviteFooterLabel(selectedRows.length);

  return (
    <AppScreen
      keyboardAvoiding
      keyboardShouldPersistTaps="handled"
      refreshing={refreshing}
      onRefresh={refreshInviteScreen}
      footer={
        addressBookMode && footerLabel ? (
          <FooterBar>
            <PrimaryButton onPress={handleInviteSelected} disabled={selectedInviteLoading}>
              {selectedInviteLoading ? "초대 보내는 중" : footerLabel}
            </PrimaryButton>
          </FooterBar>
        ) : undefined
      }
    >
      <Header
        title={addressBookMode ? "주소록" : "참가자 초대"}
        center
        back={addressBookMode ? () => setAddressBookMode(false) : () => router.back()}
      />

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error || !appointment ? (
        <Text style={styles.stateText}>{error ?? "약속 정보를 찾지 못했어요."}</Text>
      ) : addressBookMode ? (
        <InfoCard>
          <Text style={styles.cardTitle}>초대할 사람 선택</Text>
          <View style={styles.addressSearchBox}>
            <Search color="#8C929B" size={20} strokeWidth={2.2} />
            <TextInput
              value={addressBookQuery}
              onChangeText={setAddressBookQuery}
              placeholder="이름 또는 아이디 검색"
              placeholderTextColor="#B0B5BD"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
          {addressBookLoading ? (
            <View style={styles.addressBookState}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : addressBookSections.length > 0 ? (
            <View style={styles.addressBookList}>
              {addressBookSections.map((section, sectionIndex) => (
                <View key={section.title} style={sectionIndex > 0 && styles.addressSectionGap}>
                  <Text style={styles.addressSectionTitle}>{section.title}</Text>
                  {section.rows.map((row, index) => (
                    <AddressBookInviteRowItem
                      key={row.entryId}
                      row={row}
                      border={index < section.rows.length - 1}
                      onPress={() => toggleAddressBookRow(row)}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.addressBookEmpty}>
              <UsersRound color={colors.textSubtle} size={30} strokeWidth={2.1} />
              <Text style={styles.emptyText}>{addressBookQuery.trim() ? "검색 결과가 없어요." : "주소록에 저장된 사람이 없어요."}</Text>
            </View>
          )}
        </InfoCard>
      ) : (
        <>
          <InfoCard>
            <Text style={styles.cardTitle}>현재 참가자</Text>
            {currentParticipantRows.length > 0 ? (
              <View style={styles.participantList}>
                {currentParticipantRows.map((participant, index) => (
                  <ParticipantRow
                    key={participant.id}
                    participant={participant}
                    mode="invite"
                    showInviteStatus={false}
                    border={index < currentParticipantRows.length - 1}
                  />
                ))}
              </View>
            ) : null}
          </InfoCard>

          <InfoCard style={styles.cardGap}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, styles.headerCardTitle]}>아이디로 초대</Text>
              <Pressable
                onPress={() => setAddressBookMode(true)}
                accessibilityRole="button"
                accessibilityLabel="주소록 열기"
                style={({ pressed }) => [styles.addressToggle, pressed && styles.pressed]}
              >
                <UsersRound color={colors.primary} size={18} strokeWidth={2.3} />
                <Text style={styles.addressToggleText}>주소록</Text>
                <ChevronRight color={colors.primary} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View style={styles.inviteInputRow}>
              <View style={styles.searchBox}>
                <Search color="#8C929B" size={20} strokeWidth={2.2} />
                <TextInput
                  value={targetWaytId}
                  placeholder="아이디 입력"
                  placeholderTextColor="#B0B5BD"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="send"
                  onFocus={() => setSuggestionsOpen(true)}
                  onChangeText={(value) => {
                    setTargetWaytId(value);
                    setSuggestionsOpen(true);
                  }}
                  onSubmitEditing={handleInviteByWaytId}
                />
              </View>
              <Pressable
                onPress={handleInviteByWaytId}
                disabled={idInviteLoading}
                accessibilityRole="button"
                accessibilityLabel="아이디로 초대"
                style={({ pressed }) => [styles.inviteButton, pressed && !idInviteLoading && styles.pressed, idInviteLoading && styles.disabled]}
              >
                {idInviteLoading ? <ActivityIndicator color="#FFFFFF" /> : <UserPlus color="#FFFFFF" size={22} strokeWidth={2.5} />}
              </Pressable>
            </View>

            {suggestionRows.length > 0 ? (
              <View style={styles.suggestionList}>
                {suggestionRows.map((row, index) => (
                  <WaytIdSuggestionRow
                    key={row.entryId}
                    row={row}
                    border={index < suggestionRows.length - 1}
                    onPress={() => handleSelectSuggestion(row)}
                  />
                ))}
              </View>
            ) : null}

            {sentInviteRows.length > 0 ? (
              <View style={styles.inviteList}>
                {sentInviteRows.map((participant, index) => {
                  const invite = sentInvites.find((item) => item.id === participant.id);
                  return (
                    <SentInviteRow
                      key={participant.id}
                      participant={participant}
                      border={index < sentInviteRows.length - 1}
                      cancelling={cancellingInviteIds.has(participant.id)}
                      onCancel={invite && invite.status === "PENDING" ? () => confirmCancelInvite(invite) : undefined}
                    />
                  );
                })}
              </View>
            ) : null}

          </InfoCard>

          <InfoCard style={styles.cardGap}>
            <Text style={styles.cardTitle}>공유하기</Text>
            <View style={styles.linkActions}>
              <PrimaryButton icon={Copy} style={styles.linkAction} onPress={handleCopyLink} disabled={shareLoading}>
                {shareLoading ? "공유 준비 중" : "링크 복사"}
              </PrimaryButton>
              <Pressable
                onPress={handleShareLink}
                disabled={shareLoading}
                style={({ pressed }) => [styles.shareButton, pressed && !shareLoading && styles.pressed, shareLoading && styles.disabled]}
              >
                <Share2 color={colors.textMuted} size={21} strokeWidth={2.2} />
                <Text style={styles.shareText}>공유하기</Text>
              </Pressable>
            </View>
          </InfoCard>
        </>
      )}
    </AppScreen>
  );
}

function AddressBookInviteRowItem({
  row,
  border,
  onPress
}: {
  row: AddressBookInviteRow;
  border: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={row.disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: row.selected, disabled: row.disabled }}
      style={({ pressed }) => [styles.addressRow, border && styles.addressBorder, pressed && !row.disabled && styles.pressed, row.disabled && styles.rowDisabled]}
    >
      <Avatar uri={row.avatarUrl ?? ""} name={row.title} accent={row.selected ? colors.success : colors.primary} size={48} />
      <View style={styles.addressText}>
        <Text style={styles.addressName} numberOfLines={1}>{row.title}</Text>
        <Text style={styles.addressHandle} numberOfLines={1}>{row.subtitle}</Text>
      </View>
      <View style={[styles.selectBadge, row.selected && styles.selectBadgeActive, row.disabled && styles.selectBadgeDisabled]}>
        {row.selected ? <Check color="#FFFFFF" size={16} strokeWidth={3} /> : null}
        <Text style={[styles.selectBadgeText, row.selected && styles.selectBadgeTextActive, row.disabled && styles.selectBadgeTextDisabled]}>
          {row.statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function WaytIdSuggestionRow({
  row,
  border,
  onPress
}: {
  row: AddressBookInviteRow;
  border: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.title} 아이디 입력`}
      style={({ pressed }) => [styles.suggestionRow, border && styles.suggestionBorder, pressed && styles.pressed]}
    >
      <Avatar uri={row.avatarUrl ?? ""} name={row.title} accent={colors.primary} size={38} />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionName} numberOfLines={1}>{row.title}</Text>
        <Text style={styles.suggestionHandle} numberOfLines={1}>{row.waytId}</Text>
      </View>
      <Text style={styles.suggestionAction}>입력</Text>
    </Pressable>
  );
}

function SentInviteRow({
  participant,
  border,
  cancelling,
  onCancel
}: {
  participant: Participant;
  border: boolean;
  cancelling: boolean;
  onCancel?: () => void;
}) {
  return (
    <View style={[styles.sentInviteRow, border && styles.addressBorder]}>
      <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={48} />
      <View style={styles.sentInviteText}>
        <Text style={styles.sentInviteName} numberOfLines={1}>{participant.name}</Text>
        {participant.handle && participant.handle !== participant.name ? (
          <Text style={styles.addressHandle} numberOfLines={1}>{participant.handle}</Text>
        ) : null}
      </View>
      {onCancel ? (
        <Pressable
          onPress={onCancel}
          disabled={cancelling}
          accessibilityRole="button"
          accessibilityLabel={`${participant.name} 초대 취소`}
          style={({ pressed }) => [
            styles.cancelInviteButton,
            pressed && !cancelling && styles.pressed,
            cancelling && styles.disabled
          ]}
        >
          {cancelling ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <Text style={styles.cancelInviteText} numberOfLines={1} adjustsFontSizeToFit>
              취소
            </Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16
  },
  participantList: {
    marginTop: -4
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16
  },
  headerCardTitle: {
    flex: 1,
    marginBottom: 0
  },
  addressToggle: {
    minHeight: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CFE3FF",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5
  },
  addressToggleText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  linkActions: {
    flexDirection: "row",
    gap: 10
  },
  linkAction: {
    flex: 1
  },
  shareButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DADDE3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    ...spacing.softShadow
  },
  shareText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  cardGap: {
    marginTop: 20
  },
  addressBookState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center"
  },
  addressSearchBox: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 12
  },
  addressBookList: {
    marginTop: -4
  },
  addressSectionGap: {
    marginTop: 14
  },
  addressSectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4
  },
  addressBookEmpty: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  addressRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  addressBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowDisabled: {
    opacity: 0.6
  },
  addressText: {
    flex: 1,
    minWidth: 0
  },
  addressName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  sentInviteRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sentInviteText: {
    flex: 1,
    minWidth: 0
  },
  sentInviteName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  addressHandle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  selectBadge: {
    minWidth: 72,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5
  },
  selectBadgeActive: {
    borderColor: colors.success,
    backgroundColor: colors.success
  },
  selectBadgeDisabled: {
    backgroundColor: "#F3F4F6"
  },
  selectBadgeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  selectBadgeTextActive: {
    color: "#FFFFFF"
  },
  selectBadgeTextDisabled: {
    color: colors.textSubtle
  },
  inviteInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  searchBox: {
    minHeight: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DADDE3",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  input: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    paddingVertical: 0
  },
  inviteButton: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...spacing.buttonShadow
  },
  suggestionList: {
    marginTop: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    overflow: "hidden"
  },
  suggestionRow: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  suggestionText: {
    flex: 1,
    minWidth: 0
  },
  suggestionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  suggestionHandle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2
  },
  suggestionAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  inviteList: {
    marginTop: 16
  },
  cancelInviteButton: {
    minWidth: 68,
    minHeight: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FFD2CF",
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  cancelInviteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "900"
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
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }]
  }
});
