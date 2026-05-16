import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  Footprints,
  Gift,
  LogOut,
  LockKeyhole,
  LockKeyholeOpen,
  LocateFixed,
  MapPin,
  Maximize2,
  Navigation,
  PencilLine,
  Share2,
  X
} from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { InfoCard } from "../../src/components/Cards";
import { MapSurface, type MapMarker, type MapSurfaceProps } from "../../src/components/MapSurface";
import { ParticipantRow } from "../../src/components/ParticipantRow";
import { StatusButton } from "../../src/components/StatusButton";
import { TimeWheelPicker } from "../../src/components/TimeWheelPicker";
import {
  etaSourceKind,
  manualEtaInputValue,
  parseManualEtaInput,
  participantEtaSummary,
  participantEtaText,
  shouldPromptManualEtaAfterRoute,
  shouldShowManualEtaAction
} from "../../src/appointments/etaDisplay";
import { createAppointmentShareUrl } from "../../src/appointments/appointmentShare";
import {
  createLiveAppointmentSectionOrder,
  createMyTravelInfoDisplay,
  type LiveAppointmentSection
} from "../../src/appointments/liveAppointmentLayout";
import {
  locationPermissionNotice,
  participantLocationStatusTone,
  shouldRenderParticipantLocationMarker
} from "../../src/appointments/liveLocationSharing";
import { formatPenaltyLabel, isMeaningfulPenalty } from "../../src/appointments/penalty";
import { displayAppointmentMemo } from "../../src/appointments/liveAppointmentMemo";
import { createAppointmentMapMeta } from "../../src/appointments/liveAppointmentSchedule";
import {
  previewStatusLogs,
  shouldShowStatusLogSheetAction,
  statusLogCountLabel
} from "../../src/appointments/statusLogDisplay";
import { apiGetAuthenticated, apiGetOptionalAuthenticated, apiPatchAuthenticated, apiPostAuthenticated } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { useAppFeedback } from "../../src/feedback/AppFeedback";
import { TravelModeChoiceGrid } from "../../src/travel/TravelModeChoiceGrid";
import { openNaverRouteUrl } from "../../src/travel/naverRouteLinking";
import {
  buildNaverRouteUrl,
  initialTravelModeSelection,
  travelModeEtaHint,
  travelModeLabel,
  type ApiTravelMode,
  type TravelMode
} from "../../src/travel/travelMode";
import { colors, spacing } from "../../src/theme";

type ApiParticipant = {
  id: string;
  userId: string;
  name: string;
  waytId: string;
  avatarUrl?: string;
  role: "HOST" | "PARTICIPANT";
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
  leftAt?: string | null;
  removedAt?: string | null;
  removedByName?: string | null;
  status: ApiParticipantStatus;
  travelMode: ApiTravelMode;
  etaModeUsed: ApiTravelMode;
  etaMinutes: number | null;
  etaLabel: string | null;
  etaCalculatedAt: string | null;
  locationConsent: boolean;
  latestLatitude: number | null;
  latestLongitude: number | null;
  latestAccuracyMeters: number | null;
  latestLocationCapturedAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
  lateMinutes: number | null;
  manualEstimatedArrivalAt: string | null;
  manualEtaUpdatedAt: string | null;
};

type ApiParticipantStatus =
  | "BEFORE_LOCATION_SHARE"
  | "WAITING"
  | "NOT_STARTED"
  | "MOVING"
  | "NEAR_ARRIVAL"
  | "ARRIVED"
  | "LIKELY_LATE"
  | "LATE_CONFIRMED"
  | "LOCATION_OFF";

type ApiStatusLog = {
  id: string;
  participantId: string;
  participantName: string;
  message: string;
  createdAt: string;
};

type ApiAppointment = {
  id: string;
  title: string;
  placeName: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  locationShareStartsAt: string;
  shareStartOffsetMinutes: number;
  penalty: string;
  arrivalRadiusMeters: number;
  graceMinutes: number;
  memo?: string;
  completedAt: string | null;
  completionReason: "ALL_ARRIVED" | "HOST_FORCE" | null;
  myRole: "HOST" | "PARTICIPANT" | null;
  isParticipant: boolean;
  participants: ApiParticipant[];
  statusLogs: ApiStatusLog[];
};

type StatusButtonAction = "started" | "near" | "late" | "arrived";
type StatusAction = StatusButtonAction | "leave" | "remove";
type ApiStatusLogAction = "STARTED" | "NEAR" | "LATE";

const STATUS_LOG_ACTIONS: Record<Exclude<StatusButtonAction, "arrived">, ApiStatusLogAction> = {
  started: "STARTED",
  near: "NEAR",
  late: "LATE"
};
type LoadAppointmentOptions = { silent?: boolean };

async function loadAppointmentDetail(id: string) {
  try {
    return await apiGetAuthenticated<ApiAppointment>(`/appointments/${id}`);
  } catch {
    return apiGetOptionalAuthenticated<ApiAppointment>(`/appointments/${id}/public`);
  }
}

export default function LiveAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showDialog, showToast } = useAppFeedback();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<ApiAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<StatusAction | null>(null);
  const [travelModeLoading, setTravelModeLoading] = useState(false);
  const [manualEtaVisible, setManualEtaVisible] = useState(false);
  const [manualEtaInput, setManualEtaInput] = useState("");
  const [manualEtaLoading, setManualEtaLoading] = useState(false);
  const [statusLogSheetVisible, setStatusLogSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const locationSyncKeyRef = useRef<string | null>(null);
  const locationSettingsOpenedRef = useRef(false);
  const routePromptRef = useRef<{ appointmentId: string; openedAt: number; prompted: boolean } | null>(null);

  const showCompletionAlert = useCallback(() => {
    showDialog({
      title: "약속이 완료됐어요",
      message: "모든 참가자가 도착해서 히스토리에서 확인할 수 있어요.",
      tone: "success",
      actions: [
        { label: "홈으로", role: "secondary", onPress: () => router.replace("/") },
        { label: "히스토리 보기", role: "primary", onPress: () => router.replace("/history") }
      ]
    });
  }, [router, showDialog]);

  const loadAppointment = useCallback(async ({ silent = false }: LoadAppointmentOptions = {}) => {
    if (!id) {
      return;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const item = await loadAppointmentDetail(id);
      setAppointment(item);
      setError(null);
    } catch (fetchError) {
      if (!silent) {
        setAppointment(null);
      setError(fetchError instanceof Error ? fetchError.message : "약속 정보를 불러오지 못했어요.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  const refreshAppointment = useCallback(async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      await loadAppointment({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadAppointment, refreshing]);

  const myParticipant = useMemo(
    () => appointment?.participants.find((participant) => participant.userId === user?.id && isActiveParticipant(participant)) ?? null,
    [appointment, user?.id]
  );

  const activeParticipants = useMemo(
    () => appointment?.participants.filter(isActiveParticipant) ?? [],
    [appointment]
  );
  const displayParticipants = activeParticipants;
  const people = useMemo(() => displayParticipants.map(mapParticipant), [displayParticipants]);

  const participantMarkers = useMemo<MapMarker[]>(() => {
    if (!appointment) {
      return [];
    }

    return activeParticipants.flatMap((participant) => {
      if (!shouldRenderParticipantLocationMarker(participant)) {
        return [];
      }

      return [{
        id: participant.id,
        label: participant.name,
        latitude: participant.latestLatitude,
        longitude: participant.latestLongitude,
        avatarUrl: participant.avatarUrl,
        isCurrentUser: participant.userId === user?.id
      }];
    });
  }, [activeParticipants, appointment, user?.id]);

  useEffect(() => {
    if (!appointment || !myParticipant) {
      return;
    }

    const currentAppointment = appointment;
    const currentParticipant = myParticipant;
    if (!isLocationPublic(currentAppointment) || currentParticipant.arrivedAt) {
      return;
    }

    const syncKey = `${currentAppointment.id}:${currentParticipant.id}`;
    if (locationSyncKeyRef.current === syncKey) {
      return;
    }
    locationSyncKeyRef.current = syncKey;

    let cancelled = false;

    async function markCurrentLocationUnavailable(canAskAgain: boolean) {
      try {
        const updated = await apiPostAuthenticated<ApiAppointment, { participantId: string }>(
          `/appointments/${currentAppointment.id}/locations/unavailable`,
          { participantId: currentParticipant.id }
        );

        if (!cancelled) {
          setAppointment(updated);
        }
      } catch {
        // Permission guidance is still useful even if the status update fails.
      }

      if (cancelled) {
        return;
      }

      const notice = locationPermissionNotice(canAskAgain);
      showDialog({
        title: notice.title,
        message: notice.message,
        tone: "warning",
        actions: [
          { label: "나중에", role: "cancel" },
          {
            label: notice.primaryActionLabel,
            role: "primary",
            onPress: () => {
              locationSettingsOpenedRef.current = true;
              void Linking.openSettings();
            }
          }
        ]
      });
    }

    async function syncCurrentLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) {
          await markCurrentLocationUnavailable(permission.canAskAgain);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        const updated = await apiPostAuthenticated<ApiAppointment, {
          participantId: string;
          latitude: number;
          longitude: number;
          accuracyMeters: number;
          capturedAt: string;
        }>(`/appointments/${currentAppointment.id}/locations`, {
          participantId: currentParticipant.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy && position.coords.accuracy > 0 ? position.coords.accuracy : 50,
          capturedAt: new Date(position.timestamp).toISOString()
        });

        if (!cancelled) {
          setAppointment(updated);
          if (updated.completedAt && !currentAppointment.completedAt) {
            showCompletionAlert();
          }
        }
      } catch {
        locationSyncKeyRef.current = null;
      }
    }

    void syncCurrentLocation();

    return () => {
      cancelled = true;
    };
  }, [appointment, myParticipant, showCompletionAlert, showDialog]);

  const handleStatusPress = useCallback(async (action: StatusButtonAction) => {
    if (!appointment || !myParticipant || actionLoading) {
      return;
    }

    setActionLoading(action);
    try {
      if (action === "arrived") {
        const updated = await apiPostAuthenticated<ApiAppointment, { participantId: string; arrivedAt: string }>(
          `/appointments/${appointment.id}/manual-arrival`,
          {
            participantId: myParticipant.id,
            arrivedAt: new Date().toISOString()
          }
        );
        setAppointment(updated);
        if (updated.completedAt) {
          showCompletionAlert();
        }
        return;
      }

      const statusLogAction =
        action === "started"
          ? STATUS_LOG_ACTIONS.started
          : action === "near"
            ? STATUS_LOG_ACTIONS.near
            : STATUS_LOG_ACTIONS.late;

      await apiPostAuthenticated<ApiStatusLog, { participantId: string; action: ApiStatusLogAction }>(
        `/appointments/${appointment.id}/status-logs`,
        {
          participantId: myParticipant.id,
          action: statusLogAction
        }
      );
      const updated = await apiGetAuthenticated<ApiAppointment>(`/appointments/${appointment.id}`);
      setAppointment(updated);
    } catch (statusError) {
      showDialog({
        title: "상태 변경 실패",
        message: statusError instanceof Error ? statusError.message : "상태를 저장하지 못했어요.",
        tone: "danger"
      });
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, appointment, myParticipant, showCompletionAlert, showDialog]);

  const handleLeave = useCallback(() => {
    if (!appointment || !myParticipant || actionLoading) {
      return;
    }

    showDialog({
      title: "약속에서 나갈까요?",
      message: "나간 뒤에도 다시 초대받아 참여할 수 있어요.",
      tone: "warning",
      actions: [
        { label: "취소", role: "cancel" },
        {
          label: "나가기",
          role: "destructive",
          onPress: () => {
            setActionLoading("leave");
            void apiPostAuthenticated<ApiAppointment, Record<string, never>>(
              `/appointments/${appointment.id}/leave`,
              {}
            )
              .then(() => {
                showToast({ title: "약속에서 나갔어요." });
                router.replace("/");
              })
              .catch((leaveError) => {
                showDialog({
                  title: "나가기 실패",
                  message: leaveError instanceof Error ? leaveError.message : "약속에서 나가지 못했어요.",
                  tone: "danger"
                });
              })
              .finally(() => setActionLoading(null));
          }
        }
      ]
    });
  }, [actionLoading, appointment, myParticipant, router, showDialog, showToast]);

  const handleShareAppointment = useCallback(async () => {
    if (!appointment) {
      return;
    }

    const url = createAppointmentShareUrl({
      appointmentId: appointment.id,
      currentHref: typeof window === "undefined" ? undefined : window.location.href
    });

    try {
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(url);
        showToast({ title: "링크를 복사했어요." });
        return;
      }

      await Share.share({
        title: appointment.title,
        url,
        message: `${appointment.title}\n${url}`
      });
    } catch (shareError) {
      showDialog({
        title: "링크를 공유하지 못했어요.",
        message: shareError instanceof Error ? shareError.message : undefined,
        tone: "danger"
      });
    }
  }, [appointment, showDialog, showToast]);

  const handleRemoveParticipant = useCallback((participant: ApiParticipant) => {
    if (!appointment || !myParticipant || appointment.myRole !== "HOST" || participant.userId === user?.id || actionLoading) {
      return;
    }

    showDialog({
      title: `${participant.name}님을 삭제할까요?`,
      message: "차단은 아니어서 다시 초대할 수 있어요.",
      tone: "warning",
      actions: [
        { label: "취소", role: "cancel" },
        {
          label: "삭제",
          role: "destructive",
          onPress: () => {
            setActionLoading("remove");
            void apiPostAuthenticated<ApiAppointment, Record<string, never>>(
              `/appointments/${appointment.id}/participants/${participant.id}/remove`,
              {}
            )
              .then((updated) => {
                setAppointment(updated);
                showToast({ title: `${participant.name}님을 약속에서 삭제했어요.` });
              })
              .catch((removeError) => {
                showDialog({
                  title: "삭제 실패",
                  message: removeError instanceof Error ? removeError.message : "참가자를 삭제하지 못했어요.",
                  tone: "danger"
                });
              })
              .finally(() => setActionLoading(null));
          }
        }
      ]
    });
  }, [actionLoading, appointment, myParticipant, showDialog, showToast, user?.id]);

  const handleTravelModeChange = useCallback(async (mode: TravelMode) => {
    if (!appointment || !myParticipant || travelModeLoading || appointment.completedAt) {
      return;
    }

    setTravelModeLoading(true);
    try {
      const updated = await apiPatchAuthenticated<ApiAppointment, { participantId: string; travelMode: TravelMode }>(
        `/appointments/${appointment.id}/travel-mode`,
        {
          participantId: myParticipant.id,
          travelMode: mode
        }
      );
      setAppointment(updated);
      showToast({ title: `이동수단을 ${travelModeLabel(mode)}(으)로 바꿨어요.` });
    } catch (travelModeError) {
      showDialog({
        title: "이동수단 변경 실패",
        message: travelModeError instanceof Error ? travelModeError.message : undefined,
        tone: "danger"
      });
    } finally {
      setTravelModeLoading(false);
    }
  }, [appointment, myParticipant, showDialog, showToast, travelModeLoading]);

  const openManualEtaEditor = useCallback(() => {
    if (!myParticipant) {
      return;
    }

    const automaticEstimate =
      myParticipant.etaMinutes == null
        ? null
        : new Date(Date.now() + myParticipant.etaMinutes * 60 * 1000).toISOString();
    setManualEtaInput(manualEtaInputValue(myParticipant.manualEstimatedArrivalAt ?? automaticEstimate));
    setManualEtaVisible(true);
  }, [myParticipant]);

  const handleManualEtaSave = useCallback(async () => {
    if (!appointment || !myParticipant || manualEtaLoading) {
      return;
    }

    const estimatedArrivalAt = parseManualEtaInput(manualEtaInput);
    if (!estimatedArrivalAt) {
      showDialog({
        title: "시간 형식을 확인해 주세요",
        message: "18:42처럼 도착 예정 시간을 입력해 주세요.",
        tone: "warning"
      });
      return;
    }

    setManualEtaLoading(true);
    try {
      const updated = await apiPatchAuthenticated<ApiAppointment, { participantId: string; estimatedArrivalAt: string }>(
        `/appointments/${appointment.id}/manual-eta`,
        {
          participantId: myParticipant.id,
          estimatedArrivalAt: estimatedArrivalAt.toISOString()
        }
      );
      setAppointment(updated);
      setManualEtaVisible(false);
      showToast({ title: "도착예정시간을 공유했어요." });
    } catch (manualEtaError) {
      showDialog({
        title: "도착예정시간 저장 실패",
        message: manualEtaError instanceof Error ? manualEtaError.message : undefined,
        tone: "danger"
      });
    } finally {
      setManualEtaLoading(false);
    }
  }, [appointment, manualEtaInput, manualEtaLoading, myParticipant, showDialog, showToast]);

  const handleManualEtaClear = useCallback(async () => {
    if (!appointment || !myParticipant || manualEtaLoading) {
      return;
    }

    setManualEtaLoading(true);
    try {
      const updated = await apiPatchAuthenticated<ApiAppointment, { participantId: string; estimatedArrivalAt: null }>(
        `/appointments/${appointment.id}/manual-eta`,
        {
          participantId: myParticipant.id,
          estimatedArrivalAt: null
        }
      );
      setAppointment(updated);
      setManualEtaVisible(false);
      showToast({ title: "위치 기준 자동 계산으로 되돌렸어요." });
    } catch (manualEtaError) {
      showDialog({
        title: "도착예정시간 해제 실패",
        message: manualEtaError instanceof Error ? manualEtaError.message : undefined,
        tone: "danger"
      });
    } finally {
      setManualEtaLoading(false);
    }
  }, [appointment, manualEtaLoading, myParticipant, showDialog, showToast]);

  const handleOpenRoute = useCallback(async () => {
    if (!appointment || !myParticipant) {
      return;
    }

    const url = buildNaverRouteUrl({
      mode: myParticipant?.travelMode,
      destinationLatitude: appointment.latitude,
      destinationLongitude: appointment.longitude,
      destinationName: appointment.placeName
    });
    const storeUrl = Platform.select({
      ios: "http://itunes.apple.com/app/id311867728?mt=8",
      android: "market://details?id=com.nhn.android.nmap",
      default: "https://map.naver.com"
    });

    try {
      routePromptRef.current = {
        appointmentId: appointment.id,
        openedAt: Date.now(),
        prompted: false
      };
      await openNaverRouteUrl({ routeUrl: url, storeUrl, linking: Linking });
    } catch (routeError) {
      showDialog({
        title: "길찾기를 열 수 없어요",
        message: routeError instanceof Error ? routeError.message : "네이버 지도 앱 설치 상태를 확인해 주세요.",
        tone: "warning"
      });
    }
  }, [appointment, myParticipant, showDialog]);

  const handleCopyPlace = useCallback(async (placeCopyText: string) => {
    try {
      await Clipboard.setStringAsync(placeCopyText);
      showToast({ title: "주소를 복사했어요." });
    } catch (copyError) {
      showDialog({
        title: "주소를 복사하지 못했어요.",
        message: copyError instanceof Error ? copyError.message : undefined,
        tone: "danger"
      });
    }
  }, [showDialog, showToast]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && locationSettingsOpenedRef.current) {
        locationSettingsOpenedRef.current = false;
        locationSyncKeyRef.current = null;
        void loadAppointment({ silent: true });
      }

      const prompt = routePromptRef.current;
      if (
        state !== "active" ||
        !prompt ||
        prompt.prompted ||
        !appointment ||
        !myParticipant ||
        prompt.appointmentId !== appointment.id ||
        !shouldPromptManualEtaAfterRoute(myParticipant, appointment.completedAt !== null) ||
        Date.now() - prompt.openedAt > 30 * 60 * 1000
      ) {
        return;
      }

      prompt.prompted = true;
      showDialog({
        title: "도착예정시간을 수정하시겠습니까?",
        message: "길찾기에서 확인한 시간을 직접 공유할 수 있어요.",
        tone: "info",
        actions: [
          { label: "아니요", role: "cancel" },
          { label: "수정", role: "primary", onPress: openManualEtaEditor }
        ]
      });
    });

    return () => subscription.remove();
  }, [appointment, loadAppointment, myParticipant, openManualEtaEditor, showDialog]);

  if (loading) {
    return (
      <AppScreen refreshing={refreshing} onRefresh={refreshAppointment}>
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (!appointment || error) {
    return (
      <AppScreen refreshing={refreshing} onRefresh={refreshAppointment}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={34} strokeWidth={2.3} />
          </Pressable>
        </View>
        <Text style={styles.stateText}>{error ?? "약속 정보를 찾지 못했어요."}</Text>
      </AppScreen>
    );
  }

  const liveAppointment = appointment;
  const isParticipant = liveAppointment.isParticipant || Boolean(myParticipant);
  const locationSummary = locationShareSummary(liveAppointment);
  const LocationIcon = locationSummary.public ? LockKeyholeOpen : LockKeyhole;
  const hasPenalty = isMeaningfulPenalty(liveAppointment.penalty);
  const appointmentMemo = displayAppointmentMemo(liveAppointment.memo);
  const actionsDisabled = !myParticipant || actionLoading !== null || liveAppointment.completedAt !== null;
  const startedDisabled = actionsDisabled || myParticipant?.startedAt !== null;
  const manualEtaActionVisible = myParticipant ? shouldShowManualEtaAction(myParticipant) : false;
  const etaSummary = myParticipant ? participantEtaSummary(myParticipant) : null;
  const myTravelMode = initialTravelModeSelection(myParticipant?.travelMode);
  const myTravelModeLabel = travelModeLabel(myTravelMode);
  const myTravelInfoDisplay = etaSummary
    ? createMyTravelInfoDisplay({ etaSummary, travelModeLabel: myTravelModeLabel })
    : null;
  const statusLogPreview = previewStatusLogs(appointment.statusLogs);
  const showStatusLogSheetAction = shouldShowStatusLogSheetAction(appointment.statusLogs);
  const travelModeSubtitle = myParticipant
    ? travelModeEtaHint({
      mode: myParticipant.travelMode,
      locationPublic: locationSummary.public,
      hasEta: manualEtaActionVisible
    })
    : "";
  const meetingPlace = {
    latitude: liveAppointment.latitude,
    longitude: liveAppointment.longitude,
    label: liveAppointment.placeName
  };
  const mapMeta = createAppointmentMapMeta({
    scheduledAt: liveAppointment.scheduledAt,
    placeName: liveAppointment.placeName
  });
  const sectionOrder = createLiveAppointmentSectionOrder({
    hasMyParticipant: myParticipant !== null,
    isParticipant,
    hasMemo: appointmentMemo !== null,
    locationPublic: locationSummary.public
  });

  function renderSection(section: LiveAppointmentSection) {
    switch (section) {
      case "map":
        return (
          <ExpandableAppointmentMap
            key={section}
            meetingPlace={meetingPlace}
            radiusMeters={liveAppointment.arrivalRadiusMeters}
            participantMarkers={participantMarkers}
            title={liveAppointment.placeName}
            scheduleLabel={mapMeta.scheduleLabel}
            placeLabel={mapMeta.placeLabel}
            onCopyPlace={() => void handleCopyPlace(mapMeta.placeCopyText)}
          />
        );
      case "appointmentStatus":
        return (
          <InfoCard key={section} style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <LocationIcon
                color={locationSummary.public ? colors.primary : colors.textMuted}
                size={23}
                strokeWidth={2.4}
              />
              <Text
                style={[
                  styles.summaryText,
                  !locationSummary.public && styles.summaryMutedText
                ]}
                numberOfLines={1}
              >
                {locationSummary.label}
              </Text>
            </View>
            <View style={styles.summaryLine} />
            <View style={styles.summaryItem}>
              <Gift color={hasPenalty ? colors.primary : colors.textMuted} size={23} strokeWidth={2.4} />
              <Text
                style={[styles.summaryText, !hasPenalty && styles.summaryMutedText]}
                numberOfLines={1}
              >
                {formatPenaltyLabel(liveAppointment.penalty)}
              </Text>
            </View>
          </InfoCard>
        );
      case "participants":
        return (
          <InfoCard key={section} style={styles.peopleCard}>
            {displayParticipants.map((apiParticipant, index) => {
              const participant = people[index];
              if (!participant) {
                return null;
              }
              return (
                <ParticipantRow
                  key={participant.id}
                  participant={participant}
                  border={index < people.length - 1}
                  showLiveStatus={locationSummary.public || !isActiveParticipant(apiParticipant)}
                  onPress={
                    liveAppointment.myRole === "HOST" && apiParticipant.userId !== user?.id && isActiveParticipant(apiParticipant)
                      ? () => handleRemoveParticipant(apiParticipant)
                      : undefined
                  }
                />
              );
            })}
          </InfoCard>
        );
      case "myTravelInfo":
        if (!myParticipant) {
          return null;
        }

        return (
          <InfoCard key={section} style={styles.myTravelInfoCard}>
            <View style={styles.myTravelInfoHeader}>
              <Text style={styles.myTravelInfoTitle}>{myTravelInfoDisplay?.title ?? "내 이동 정보"}</Text>
              <Pressable
                onPress={() => void handleOpenRoute()}
                style={({ pressed }) => [styles.myTravelRouteButton, pressed && styles.buttonPressed]}
              >
                <Navigation color="#FFFFFF" size={17} strokeWidth={2.5} />
                <Text style={styles.routeButtonText}>길찾기</Text>
              </Pressable>
            </View>

            <View style={styles.myTravelEtaBlock}>
              <Text style={styles.myTravelEtaPrimary} numberOfLines={1}>
                {myTravelInfoDisplay?.etaPrimaryLabel ?? "도착예정 준비 중"}
              </Text>
              <Text style={styles.myTravelEtaDetail} numberOfLines={1}>
                {myTravelInfoDisplay?.etaDetailLabel ?? travelModeSubtitle}
              </Text>
            </View>

            <TravelModeChoiceGrid
              selected={myTravelMode}
              onSelect={(mode) => void handleTravelModeChange(mode)}
              disabled={travelModeLoading || liveAppointment.completedAt !== null}
              variant="segmented"
            />

            {etaSummary ? (
              <View style={styles.myTravelActions}>
                <Pressable
                  onPress={openManualEtaEditor}
                  disabled={!manualEtaActionVisible || manualEtaLoading || liveAppointment.completedAt !== null}
                  style={({ pressed }) => [
                    styles.myTravelActionButton,
                    pressed && styles.buttonPressed,
                    (!manualEtaActionVisible || manualEtaLoading || liveAppointment.completedAt !== null) && styles.disabledButton
                  ]}
                >
                  <PencilLine color={colors.primary} size={16} strokeWidth={2.5} />
                  <Text style={styles.myTravelActionText}>
                    {myTravelInfoDisplay?.primaryActionLabel ?? "도착예정 수정"}
                  </Text>
                </Pressable>
                {myParticipant.manualEstimatedArrivalAt ? (
                  <Pressable
                    onPress={() => void handleManualEtaClear()}
                    disabled={manualEtaLoading || liveAppointment.completedAt !== null}
                    style={({ pressed }) => [
                      styles.myTravelSecondaryActionButton,
                      pressed && styles.buttonPressed,
                      (manualEtaLoading || liveAppointment.completedAt !== null) && styles.disabledButton
                    ]}
                  >
                    <LocateFixed color={colors.textMuted} size={16} strokeWidth={2.5} />
                    <Text style={styles.myTravelSecondaryActionText}>위치 기준 자동 계산</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </InfoCard>
        );
      case "memo":
        if (!appointmentMemo) {
          return null;
        }

        return (
          <InfoCard key={section} style={styles.memoCard}>
            <Text style={styles.cardTitle}>약속 메모</Text>
            <Text style={styles.memoText}>{appointmentMemo}</Text>
          </InfoCard>
        );
      case "activityLog":
        return (
          <InfoCard key={section} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={[styles.cardTitle, styles.logTitle]}>최근 상태</Text>
              {showStatusLogSheetAction ? (
                <Pressable
                  onPress={() => setStatusLogSheetVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="전체 상태 기록 보기"
                  style={({ pressed }) => [styles.logHeaderAction, pressed && styles.buttonPressed]}
                >
                  <Text style={styles.logHeaderActionText}>{statusLogCountLabel(liveAppointment.statusLogs)}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.logList}>
              {liveAppointment.statusLogs.length > 0 ? (
                statusLogPreview.map((log) => <StatusLogRow key={log.id} log={log} />)
              ) : (
                <Text style={styles.emptyLog}>아직 상태 기록이 없어요</Text>
              )}
            </View>
          </InfoCard>
        );
      case "lockedNotice":
        return (
          <InfoCard key={section} style={styles.lockedCard}>
            <LockKeyhole color={colors.textMuted} size={20} strokeWidth={2.3} />
            <View style={styles.lockedTextBlock}>
              <Text style={styles.lockedTitle}>위치 공개 전입니다</Text>
              <Text style={styles.lockedText}>{formatShareOffset(liveAppointment.shareStartOffsetMinutes)} 상태 공유가 열려요</Text>
            </View>
          </InfoCard>
        );
      case "statusActions":
        return (
          <View key={section} style={styles.statusGrid}>
            <View style={styles.statusRow}>
              <StatusButton icon={Car} label="출발했어요" onPress={() => handleStatusPress("started")} disabled={startedDisabled} />
              <StatusButton icon={Footprints} label="거의 다 왔어요" onPress={() => handleStatusPress("near")} disabled={actionsDisabled} />
            </View>
            <View style={styles.statusRow}>
              <StatusButton icon={Clock3} label="조금 늦어요" tone="danger" onPress={() => handleStatusPress("late")} disabled={actionsDisabled} />
              <StatusButton icon={CheckCircle2} label="도착했어요" tone="success" onPress={() => handleStatusPress("arrived")} disabled={actionsDisabled} />
            </View>
          </View>
        );
    }
  }

  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={refreshAppointment}
      desktopAside={
        <AppointmentDesktopAside
          title={liveAppointment.title}
          scheduleLabel={mapMeta.scheduleLabel}
          placeLabel={mapMeta.placeLabel}
          locationLabel={locationSummary.label}
          locationPublic={locationSummary.public}
          penaltyLabel={formatPenaltyLabel(liveAppointment.penalty)}
          hasPenalty={hasPenalty}
          participantCount={displayParticipants.length}
          etaLabel={myTravelInfoDisplay?.etaPrimaryLabel ?? countdownValue(liveAppointment.scheduledAt)}
          canLeave={Boolean(myParticipant)}
          actionDisabled={actionLoading !== null}
          onShare={handleShareAppointment}
          onLeave={handleLeave}
        />
      }
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={34} strokeWidth={2.3} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title} numberOfLines={1}>{liveAppointment.title}</Text>
          <Text style={styles.subtitle}>
            {countdownPrefix(liveAppointment.scheduledAt)} <Text style={styles.blue}>{countdownValue(liveAppointment.scheduledAt)}</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          {myParticipant ? (
            <Pressable onPress={handleLeave} disabled={actionLoading !== null} style={styles.iconButton}>
              <LogOut color={colors.danger} size={21} strokeWidth={2.3} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => void handleShareAppointment()} style={styles.iconButton}>
            <Share2 color={colors.text} size={22} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {sectionOrder.map(renderSection)}
      <StatusLogSheet
        visible={statusLogSheetVisible}
        logs={liveAppointment.statusLogs}
        onClose={() => setStatusLogSheetVisible(false)}
      />
      <ManualEtaEditorModal
        visible={manualEtaVisible}
        value={manualEtaInput}
        hasManualEta={Boolean(myParticipant?.manualEstimatedArrivalAt)}
        saving={manualEtaLoading}
        onChange={setManualEtaInput}
        onClose={() => setManualEtaVisible(false)}
        onSave={() => void handleManualEtaSave()}
        onClear={() => void handleManualEtaClear()}
      />
    </AppScreen>
  );
}

function AppointmentDesktopAside({
  title,
  scheduleLabel,
  placeLabel,
  locationLabel,
  locationPublic,
  penaltyLabel,
  hasPenalty,
  participantCount,
  etaLabel,
  canLeave,
  actionDisabled,
  onShare,
  onLeave
}: {
  title: string;
  scheduleLabel: string;
  placeLabel: string;
  locationLabel: string;
  locationPublic: boolean;
  penaltyLabel: string;
  hasPenalty: boolean;
  participantCount: number;
  etaLabel: string;
  canLeave: boolean;
  actionDisabled: boolean;
  onShare: () => void;
  onLeave: () => void;
}) {
  return (
    <View style={styles.desktopAsideStack}>
      <View style={styles.desktopSummaryCard}>
        <Text style={styles.desktopSummaryEyebrow}>약속 상세</Text>
        <Text style={styles.desktopSummaryTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.desktopSummaryRows}>
          <DesktopSummaryRow icon={Clock3} label="시간" value={scheduleLabel} />
          <DesktopSummaryRow icon={MapPin} label="장소" value={placeLabel} />
          <DesktopSummaryRow icon={locationPublic ? LockKeyholeOpen : LockKeyhole} label="위치" value={locationLabel} />
          <DesktopSummaryRow icon={Gift} label="벌칙" value={hasPenalty ? penaltyLabel : "벌칙 없음"} />
        </View>
      </View>

      <View style={styles.desktopSummaryCard}>
        <Text style={styles.desktopSummaryEyebrow}>현재 상태</Text>
        <View style={styles.desktopStatusGrid}>
          <View style={styles.desktopStatusTile}>
            <Text style={styles.desktopStatusValue}>{participantCount}</Text>
            <Text style={styles.desktopStatusLabel}>참여자</Text>
          </View>
          <View style={styles.desktopStatusTile}>
            <Text style={styles.desktopStatusValue} numberOfLines={1}>{etaLabel}</Text>
            <Text style={styles.desktopStatusLabel}>내 이동</Text>
          </View>
        </View>
        <Pressable onPress={() => void onShare()} style={({ pressed }) => [styles.desktopInviteButton, pressed && styles.buttonPressed]}>
          <Share2 color="#FFFFFF" size={18} strokeWidth={2.5} />
          <Text style={styles.desktopInviteText}>링크 공유</Text>
        </Pressable>
        {canLeave ? (
          <Pressable
            onPress={onLeave}
            disabled={actionDisabled}
            style={({ pressed }) => [styles.desktopLeaveButton, pressed && !actionDisabled && styles.buttonPressed, actionDisabled && styles.disabledButton]}
          >
            <LogOut color={colors.danger} size={17} strokeWidth={2.4} />
            <Text style={styles.desktopLeaveText}>약속 나가기</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function DesktopSummaryRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.desktopSummaryRow}>
      <Icon color={colors.primary} size={17} strokeWidth={2.4} />
      <View style={styles.desktopSummaryRowText}>
        <Text style={styles.desktopSummaryLabel}>{label}</Text>
        <Text style={styles.desktopSummaryValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ExpandableAppointmentMap({
  meetingPlace,
  radiusMeters,
  participantMarkers,
  title,
  scheduleLabel,
  placeLabel,
  onCopyPlace
}: {
  meetingPlace: MapSurfaceProps["meetingPlace"];
  radiusMeters: number;
  participantMarkers: MapMarker[];
  title: string;
  scheduleLabel: string;
  placeLabel: string;
  onCopyPlace: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <View style={styles.mapGap}>
        <View style={styles.mapMetaPanel}>
          <View style={styles.mapMetaRow}>
            <Clock3 color={colors.textMuted} size={16} strokeWidth={2.1} />
            <Text style={styles.mapMetaText} numberOfLines={1}>
              {scheduleLabel}
            </Text>
          </View>
          <View style={styles.mapMetaRow}>
            <MapPin color={colors.textMuted} size={16} strokeWidth={2.1} />
            <Text
              style={[styles.mapMetaText, styles.mapMetaPlace]}
              numberOfLines={1}
            >
              {placeLabel}
            </Text>
            <Pressable
              onPress={onCopyPlace}
              accessibilityRole="button"
              accessibilityLabel="주소 복사"
              hitSlop={6}
              style={({ pressed }) => [styles.copyPlaceButton, pressed && styles.buttonPressed]}
            >
              <Copy color={colors.primary} size={15} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
        <MapSurface
          meetingPlace={meetingPlace}
          radiusMeters={radiusMeters}
          participantMarkers={participantMarkers}
        />
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityLabel="지도 크게 보기"
          style={({ pressed }) => [styles.expandMapButton, pressed && styles.buttonPressed]}
        >
          <Maximize2 color={colors.primary} size={17} strokeWidth={2.5} />
          <Text style={styles.expandMapText}>크게 보기</Text>
        </Pressable>
      </View>
      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={styles.fullMapScreen}>
          <View style={styles.fullMapHeader}>
            <Pressable
              onPress={() => setExpanded(false)}
              accessibilityLabel="전체 지도 닫기"
              style={styles.fullMapCloseButton}
            >
              <X color={colors.text} size={26} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.fullMapTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={() => setExpanded(false)} hitSlop={10}>
              <Text style={styles.fullMapDone}>완료</Text>
            </Pressable>
          </View>
          <View style={styles.fullMapBody}>
            <MapSurface
              meetingPlace={meetingPlace}
              radiusMeters={radiusMeters}
              participantMarkers={participantMarkers}
              variant="fill"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function StatusLogRow({ log }: { log: ApiStatusLog }) {
  return (
    <View style={styles.logRow}>
      <Clock3 color={statusLogIconColor(log.message)} size={22} strokeWidth={2.2} />
      <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
      <Text style={styles.logText}>{log.participantName} {log.message}</Text>
    </View>
  );
}

function StatusLogSheet({
  visible,
  logs,
  onClose
}: {
  visible: boolean;
  logs: ApiStatusLog[];
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.statusLogSheetOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="전체 상태 기록 닫기"
          onPress={onClose}
          style={styles.statusLogSheetBackdrop}
        />
        <View style={styles.statusLogSheet}>
          <View style={styles.statusLogSheetHandle} />
          <View style={styles.statusLogSheetHeader}>
            <View style={styles.statusLogSheetTitleBlock}>
              <Text style={styles.statusLogSheetTitle}>전체 상태</Text>
              <Text style={styles.statusLogSheetSubtitle}>{statusLogCountLabel(logs)}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.statusLogSheetCloseButton}>
              <X color={colors.textMuted} size={23} strokeWidth={2.5} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.statusLogSheetList}
            contentContainerStyle={styles.statusLogSheetContent}
            showsVerticalScrollIndicator
          >
            {logs.length > 0 ? (
              logs.map((log) => <StatusLogRow key={log.id} log={log} />)
            ) : (
              <Text style={styles.emptyLog}>아직 상태 기록이 없어요.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ManualEtaEditorModal({
  visible,
  value,
  hasManualEta,
  saving,
  onChange,
  onClose,
  onSave,
  onClear
}: {
  visible: boolean;
  value: string;
  hasManualEta: boolean;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.etaModalOverlay}>
        <View style={styles.etaModalSheet}>
          <View style={styles.etaModalHeader}>
            <Text style={styles.etaModalTitle}>도착예정시간 수정</Text>
            <Pressable onPress={onClose} disabled={saving} hitSlop={10}>
              <X color={colors.textMuted} size={22} strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.etaModalHint}>길찾기에서 확인한 도착 시간을 선택해 주세요.</Text>
          <TimeWheelPicker
            selectedTime={value}
            onSelectTime={onChange}
            disabled={saving}
            style={styles.etaTimeWheel}
          />
          <View style={styles.etaModalActions}>
            {hasManualEta ? (
              <Pressable
                onPress={onClear}
                disabled={saving}
                style={({ pressed }) => [styles.etaSecondaryAction, pressed && styles.buttonPressed, saving && styles.disabledButton]}
              >
                <LocateFixed color={colors.textMuted} size={17} strokeWidth={2.5} />
                <Text style={styles.etaSecondaryActionText}>위치 기준 자동 계산</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => [styles.etaPrimaryAction, pressed && styles.buttonPressed, saving && styles.disabledButton]}
            >
              <PencilLine color="#FFFFFF" size={17} strokeWidth={2.5} />
              <Text style={styles.etaPrimaryActionText}>{saving ? "저장 중" : "저장"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function isActiveParticipant(participant: ApiParticipant) {
  return (participant.membershipStatus ?? "ACTIVE") === "ACTIVE";
}

function mapParticipant(participant: ApiParticipant) {
  if (!isActiveParticipant(participant)) {
    const removed = participant.membershipStatus === "REMOVED";
    const label = removed ? "삭제됨" : "나감";
    return {
      id: participant.id,
      name: participant.name,
      handle: participant.waytId,
      avatar: participant.avatarUrl ?? "",
      accent: colors.textMuted,
      eta: label,
      status: removed && participant.removedByName ? `${participant.removedByName}님이 삭제` : label,
      statusTone: "muted" as const
    };
  }

  const statusTone = participantLocationStatusTone(participant);
  return {
    id: participant.id,
    name: participant.name,
    handle: participant.waytId,
    avatar: participant.avatarUrl ?? "",
    accent:
      statusTone === "success"
        ? colors.success
        : statusTone === "danger"
          ? colors.danger
          : statusTone === "muted"
            ? colors.textMuted
            : colors.primary,
    eta: participantEta(participant),
    etaSource: etaSourceKind(participant),
    travelMode: participant.travelMode,
    status: participantStatus(participant),
    statusTone,
    inviteStatus: participant.locationConsent ? "위치 동의 완료" as const : "참가 완료" as const
  };
}

function participantEta(participant: ApiParticipant) {
  if (participant.status === "LOCATION_OFF") {
    return "설정에서 권한 필요";
  }
  return participantEtaText(participant, statusText(participant.status));
}

function participantStatus(participant: ApiParticipant) {
  if (participant.arrivedAt) {
    return formatTime(participant.arrivedAt);
  }
  return statusText(participant.status);
}

function statusText(status: ApiParticipantStatus) {
  switch (status) {
    case "BEFORE_LOCATION_SHARE":
      return "위치 공개 전";
    case "WAITING":
    case "NOT_STARTED":
      return "대기 중";
    case "MOVING":
      return "가는 중";
    case "NEAR_ARRIVAL":
      return "거의 도착";
    case "ARRIVED":
      return "도착 완료";
    case "LIKELY_LATE":
      return "지각 예상";
    case "LATE_CONFIRMED":
      return "지각";
    case "LOCATION_OFF":
      return "위치 꺼짐";
  }
}

function locationShareSummary(appointment: ApiAppointment) {
  const isPublic = isLocationPublic(appointment);
  return {
    public: isPublic,
    label: isPublic ? "위치 공개 중" : "위치 미공개"
  };
}

function isLocationPublic(appointment: ApiAppointment) {
  return new Date(appointment.locationShareStartsAt).getTime() <= Date.now();
}

function countdownPrefix(value: string) {
  const scheduledAt = new Date(value);
  return scheduledAt.getTime() > Date.now() ? "약속까지" : "약속";
}

function countdownValue(value: string) {
  const scheduledAt = new Date(value);
  if (Number.isNaN(scheduledAt.getTime())) {
    return "";
  }
  if (scheduledAt.getTime() <= Date.now()) {
    return "진행 중";
  }
  return formatDuration(Date.now(), scheduledAt.getTime());
}

function formatShareOffset(minutes: number) {
  return `약속 ${formatOffset(minutes)} 전부터`;
}

function formatOffset(minutes: number) {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function formatDuration(from: number, to: number) {
  const minutes = Math.max(1, Math.ceil((to - from) / 60000));
  return formatOffset(minutes);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function statusLogIconColor(message: string) {
  if (message.includes("도착")) {
    return colors.success;
  }
  if (message.includes("늦")) {
    return colors.danger;
  }
  return colors.primary;
}

const styles = StyleSheet.create({
  desktopAsideStack: {
    gap: 18
  },
  desktopSummaryCard: {
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
  desktopSummaryEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8
  },
  desktopSummaryTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900"
  },
  desktopSummaryRows: {
    gap: 12,
    marginTop: 16
  },
  desktopSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  desktopSummaryRowText: {
    flex: 1,
    minWidth: 0
  },
  desktopSummaryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  desktopSummaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2
  },
  desktopStatusGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  desktopStatusTile: {
    flex: 1,
    minHeight: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF1F5",
    backgroundColor: "#F8FAFD",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  desktopStatusValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  },
  desktopStatusLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3
  },
  desktopInviteButton: {
    minHeight: 46,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  desktopInviteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  desktopLeaveButton: {
    minHeight: 44,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD1CD",
    backgroundColor: colors.dangerSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  desktopLeaveText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "900"
  },
  headerRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8ED",
    alignItems: "center",
    justifyContent: "center",
    ...spacing.shadow
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 2
  },
  blue: {
    color: colors.primary,
    fontWeight: "900"
  },
  mapGap: {
    marginTop: 8,
    position: "relative"
  },
  mapMetaPanel: {
    marginBottom: 10,
    gap: 1
  },
  mapMetaRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mapMetaText: {
    flex: 1,
    minWidth: 0,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500"
  },
  mapMetaPlace: {
    color: colors.textMuted
  },
  copyPlaceButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9E7FF",
    backgroundColor: "#F7FBFF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 2
  },
  expandMapButton: {
    position: "absolute",
    left: 12,
    bottom: 12,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(218, 222, 229, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 4
  },
  expandMapText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  buttonPressed: {
    opacity: 0.74
  },
  disabledButton: {
    opacity: 0.45
  },
  fullMapScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  fullMapHeader: {
    height: 96,
    paddingTop: 42,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  fullMapCloseButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  fullMapTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12
  },
  fullMapDone: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  fullMapBody: {
    flex: 1
  },
  summaryBar: {
    marginTop: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center"
  },
  summaryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    minWidth: 0
  },
  summaryTextBlock: {
    minWidth: 0,
    flexShrink: 1
  },
  summaryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  summaryMutedText: {
    color: colors.textMuted
  },
  summarySubText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  summaryLine: {
    width: 1,
    height: 26,
    backgroundColor: colors.border,
    marginHorizontal: 8
  },
  peopleCard: {
    marginTop: 16,
    paddingVertical: 8
  },
  myTravelInfoCard: {
    marginTop: 14,
    gap: 12,
    padding: 18
  },
  myTravelInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  myTravelInfoTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  myTravelRouteButton: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 11
  },
  myTravelEtaBlock: {
    minHeight: 66,
    borderRadius: 12,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  myTravelEtaPrimary: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  myTravelEtaDetail: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  myTravelActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  myTravelActionButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9E7FF",
    backgroundColor: "#F7FBFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 11,
    flexGrow: 1
  },
  myTravelSecondaryActionButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 11,
    flexGrow: 1
  },
  myTravelActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  myTravelSecondaryActionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  manualEtaCard: {
    marginTop: 14,
    gap: 14
  },
  manualEtaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  manualEtaTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  manualEtaTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  manualEtaSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  manualEtaBadge: {
    minHeight: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  manualEtaBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900"
  },
  manualEtaMetrics: {
    minHeight: 70,
    borderRadius: 14,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  manualEtaMetric: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  manualEtaMetricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  manualEtaMetricValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  manualEtaMetricDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.border,
    marginHorizontal: 12
  },
  travelModeCard: {
    marginTop: 16,
    gap: 14
  },
  travelModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  travelModeTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  travelModeSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  routeButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    ...spacing.buttonShadow
  },
  routeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900"
  },
  manualEtaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  manualEtaButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    flexGrow: 1
  },
  manualEtaPrimaryButton: {
    backgroundColor: colors.primarySoft,
    borderColor: "#CFE0FF"
  },
  manualEtaButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  manualEtaClearText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  memoCard: {
    marginTop: 16
  },
  memoText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "600"
  },
  logCard: {
    marginTop: 16
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18
  },
  logTitle: {
    marginBottom: 0,
    flex: 1
  },
  logHeaderAction: {
    minHeight: 34,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12
  },
  logHeaderActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 18
  },
  logList: {
    gap: 12
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 18,
    minWidth: 62
  },
  logText: {
    color: colors.textMuted,
    fontSize: 17,
    fontWeight: "500",
    flex: 1
  },
  emptyLog: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600"
  },
  statusLogSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(7, 7, 7, 0.34)"
  },
  statusLogSheetBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  statusLogSheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    ...spacing.shadow
  },
  statusLogSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D7DBE2",
    alignSelf: "center",
    marginBottom: 14
  },
  statusLogSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  statusLogSheetTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  statusLogSheetTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  statusLogSheetSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  statusLogSheetCloseButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  statusLogSheetList: {
    maxHeight: 420
  },
  statusLogSheetContent: {
    gap: 14,
    paddingBottom: 4
  },
  lockedCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  lockedTextBlock: {
    flex: 1,
    minWidth: 0
  },
  lockedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  lockedText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  etaModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 7, 0.34)",
    justifyContent: "flex-end",
    padding: 16
  },
  etaModalSheet: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    ...spacing.shadow
  },
  etaModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  etaModalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  etaModalHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 8
  },
  etaTimeWheel: {
    marginTop: 16
  },
  etaModalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16
  },
  etaPrimaryAction: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 18,
    ...spacing.buttonShadow
  },
  etaPrimaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  etaSecondaryAction: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E6E8ED",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    flexGrow: 1
  },
  etaSecondaryActionText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "900"
  },
  statusGrid: {
    gap: 16,
    marginTop: 20
  },
  statusRow: {
    flexDirection: "row",
    gap: 16
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
