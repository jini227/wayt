import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { usePreventRemove } from "@react-navigation/native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { useNavigation, useRouter } from "expo-router";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gift,
  LocateFixed,
  MapPin,
  Maximize2,
  Search,
  Ruler,
  Settings2,
  Star,
  Timer,
  X
} from "lucide-react-native";
import { AppScreen } from "../../src/components/AppScreen";
import { Header, InfoCard } from "../../src/components/Cards";
import { PrimaryButton } from "../../src/components/Buttons";
import { FooterBar } from "../../src/components/FooterBar";
import { isDesktopWebLayout } from "../../src/components/webDesktopLayout";
import { TimeWheelPicker } from "../../src/components/TimeWheelPicker";
import { createNaverMapFrameUrl } from "../../src/components/naverMapFrameUrl";
import { apiGetAuthenticated, apiPostAuthenticated } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import {
  availableTimesForDate,
  pad,
  scheduledAtFromSelection,
  validTimeForDate
} from "../../src/appointments/scheduleTime";
import {
  DEFAULT_SHARE_START_OFFSET_MINUTES,
  shouldConfirmAppointmentCreateExit,
  shouldPreventAppointmentCreateRemove
} from "../../src/appointments/newAppointmentDraft";
import {
  shouldDismissPickerDrag,
  shouldStartPickerDismissDrag
} from "../../src/appointments/pickerDismissGesture";
import {
  APPOINTMENT_MEMO_MAX_LENGTH,
  APPOINTMENT_PENALTY_MAX_LENGTH,
  APPOINTMENT_TITLE_MAX_LENGTH,
  validateAppointmentCreateText
} from "../../src/appointments/appointmentCreateValidation";
import { env } from "../../src/config/env";
import { useAppFeedback } from "../../src/feedback/AppFeedback";
import { TravelModeChoiceGrid } from "../../src/travel/TravelModeChoiceGrid";
import { initialTravelModeSelection, type TravelMode } from "../../src/travel/travelMode";
import {
  favoriteSavedPlaces,
  isSelectedSavedPlace,
  recentSavedPlaces,
  savedPlaceTitle,
  type SavedPlace
} from "../../src/places/savedPlaces";
import { defaultSavedPlaceLabel } from "../../src/places/savedPlaceEditing";
import { colors } from "../../src/theme";

const MAP_CENTER = { latitude: 37.557192, longitude: 126.924634 };
const SHARE_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360];
const RADIUS_OPTIONS = [10, 20, 30, 50, 75, 100];
const GRACE_OPTIONS = [0, 5, 10, 15, 20];
const SAVED_PLACE_LIMIT = 15;
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_HEIGHT = 158;

type AppointmentCreateRequest = {
  title: string;
  placeName: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  shareStartOffsetMinutes: number;
  penalty: string;
  arrivalRadiusMeters: number;
  graceMinutes: number;
  memo?: string;
  hostTravelMode: TravelMode;
};

type AppointmentCreateResponse = {
  id: string;
};

type ReverseGeocodeResponse = {
  displayName: string;
  roadAddress: string | null;
  jibunAddress: string | null;
  latitude: number;
  longitude: number;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type SelectedPlace = Coordinate & {
  address?: string;
};

type PlaceSearchResponse = {
  items: PlaceSearchResult[];
};

type PlaceSearchResult = {
  title: string;
  address: string | null;
  roadAddress: string | null;
  latitude: number;
  longitude: number;
  source: string;
};

type SavedPlaceCreateRequest = {
  label?: string;
  placeName: string;
  latitude: number;
  longitude: number;
  favorite: boolean;
};

type PickerMode = "date" | "time" | "share" | "radius" | "grace";
type PickerValue = number;
type SavedPlaceTab = "favorite" | "recent";

export default function NewAppointmentScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();
  const { showToast, showDialog } = useAppFeedback();
  const { width } = useWindowDimensions();
  const desktopWeb = isDesktopWebLayout(width);
  const scrollRef = useRef<ScrollView>(null);
  const submitInFlightRef = useRef(false);
  const pendingExitActionRef = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => startOfDay(now), [now]);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [title, setTitle] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinate>(MAP_CENTER);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [placeSearchMessage, setPlaceSearchMessage] = useState<string | null>(null);
  const [placeResolving, setPlaceResolving] = useState(false);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedPlacesLoading, setSavedPlacesLoading] = useState(false);
  const [savingPlace, setSavingPlace] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [shareStartOffsetMinutes, setShareStartOffsetMinutes] = useState(DEFAULT_SHARE_START_OFFSET_MINUTES);
  const [activePicker, setActivePicker] = useState<PickerMode | null>(null);
  const [penalty, setPenalty] = useState("");
  const [penaltyNone, setPenaltyNone] = useState(true);
  const [arrivalRadiusMeters, setArrivalRadiusMeters] = useState(20);
  const [graceMinutes, setGraceMinutes] = useState(0);
  const [memo, setMemo] = useState("");
  const [hostTravelMode, setHostTravelMode] = useState<TravelMode>(() => initialTravelModeSelection(user?.defaultTravelMode));
  const [saveHostTravelModeDefault, setSaveHostTravelModeDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exitConfirmationDisabled, setExitConfirmationDisabled] = useState(false);
  const [replaceAfterCreate, setReplaceAfterCreate] = useState(false);
  const appointmentDraft = useMemo(
    () => ({
      title,
      selectedPlace,
      selectedDate,
      selectedTime,
      shareStartOffsetMinutes,
      penalty,
      penaltyNone,
      arrivalRadiusMeters,
      graceMinutes,
      memo,
      placeQuery
    }),
    [
      arrivalRadiusMeters,
      graceMinutes,
      memo,
      penalty,
      penaltyNone,
      placeQuery,
      selectedDate,
      selectedPlace,
      selectedTime,
      shareStartOffsetMinutes,
      title
    ]
  );
  const shouldConfirmExit = shouldConfirmAppointmentCreateExit(appointmentDraft, saving, exitConfirmationDisabled);
  const shouldPreventRemove = shouldPreventAppointmentCreateRemove(appointmentDraft, saving, exitConfirmationDisabled);
  const recentPlaces = useMemo(() => recentSavedPlaces(savedPlaces).slice(0, SAVED_PLACE_LIMIT), [savedPlaces]);
  const favoritePlaces = useMemo(() => favoriteSavedPlaces(savedPlaces).slice(0, SAVED_PLACE_LIMIT), [savedPlaces]);
  const selectedSavedPlace = useMemo(
    () => savedPlaces.find((place) => isSelectedSavedPlace(place, selectedPlace)),
    [savedPlaces, selectedPlace]
  );
  const selectedPlaceFavorite = selectedSavedPlace?.favorite ?? false;
  const shouldAskHostTravelMode = !user?.defaultTravelMode;

  useEffect(() => {
    if (user?.defaultTravelMode) {
      setHostTravelMode(initialTravelModeSelection(user.defaultTravelMode));
      setSaveHostTravelModeDefault(false);
    }
  }, [user?.defaultTravelMode]);

  usePreventRemove(
    shouldPreventRemove,
    useCallback(
      ({ data }) => {
        if (!shouldConfirmExit) {
          showToast({ title: "약속을 만드는 중이에요.", tone: "warning" });
          return;
        }

        showDialog({
          title: "작성중인 내용이 있습니다. 나가시겠습니까?",
          message: "내용이 저장되지 않습니다.",
          tone: "warning",
          actions: [
            { label: "계속 작성", role: "cancel" },
            {
              label: "나가기",
              role: "destructive",
              onPress: () => {
                pendingExitActionRef.current = data.action;
                setExitConfirmationDisabled(true);
              }
            }
          ]
        });
      },
      [navigation, shouldConfirmExit, showDialog, showToast]
    )
  );

  useEffect(() => {
    if (!exitConfirmationDisabled) {
      return;
    }

    if (pendingExitActionRef.current) {
      const action = pendingExitActionRef.current;
      pendingExitActionRef.current = null;
      navigation.dispatch(action);
      return;
    }

    if (replaceAfterCreate) {
      router.replace("/");
    }
  }, [exitConfirmationDisabled, navigation, replaceAfterCreate, router]);

  useEffect(() => {
    let mounted = true;

    const centerOnCurrentLocation = async () => {
      const currentLocation = await getCurrentLocation(false);
      if (mounted && currentLocation) {
        setMapCenter(currentLocation);
      }
    };

    centerOnCurrentLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setSavedPlacesLoading(true);

    apiGetAuthenticated<SavedPlace[]>("/places")
      .then((items) => {
        if (mounted) {
          setSavedPlaces(items);
        }
      })
      .catch((error) => {
        if (mounted) {
          showDialog({
            title: "내 장소를 불러오지 못했어요.",
            message: error instanceof Error ? error.message : undefined,
            tone: "danger"
          });
        }
      })
      .finally(() => {
        if (mounted) {
          setSavedPlacesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [showDialog]);

  const handleTogglePenaltyNone = () => {
    if (penaltyNone) {
      setPenaltyNone(false);
      return;
    }

    if (penalty.trim()) {
      showDialog({
        title: "벌칙 내용을 지울까요?",
        message: "벌칙 없음으로 바꾸면 입력한 내용이 삭제돼요.",
        tone: "danger",
        actions: [
          { label: "취소", role: "cancel" },
          {
            label: "지우기",
            role: "destructive",
            onPress: () => {
              setPenalty("");
              setPenaltyNone(true);
            }
          }
        ]
      });
      return;
    }

    setPenaltyNone(true);
  };

  const focusMemo = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  };

  const handleCreate = async () => {
    if (saving || submitInFlightRef.current) {
      return;
    }

    if (!title.trim()) {
      showToast({ title: "약속 이름을 입력해 주세요.", tone: "warning" });
      return;
    }
    if (!selectedPlace) {
      showToast({ title: "만남 장소를 지도에서 선택해 주세요.", tone: "warning" });
      return;
    }
    if (!selectedPlace.address) {
      showToast({ title: "선택한 장소의 주소를 확인하지 못했어요.", message: "지도를 다시 눌러 주세요.", tone: "warning" });
      return;
    }
    const placeName = selectedPlace.address.trim();
    if (!placeName) {
      showToast({ title: "선택한 장소의 주소를 확인하지 못했어요.", message: "지도를 다시 눌러 주세요.", tone: "warning" });
      return;
    }
    const textValidation = validateAppointmentCreateText({
      title,
      placeName,
      penalty,
      penaltyNone,
      memo
    });
    if (textValidation) {
      showToast({ title: textValidation.message, tone: "warning" });
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast({ title: "날짜와 시간을 선택해 주세요.", tone: "warning" });
      return;
    }
    if (!penaltyNone && !penalty.trim()) {
      showToast({ title: "벌칙 내용을 입력하거나 벌칙 없음에 체크해 주세요.", tone: "warning" });
      return;
    }
    if (shouldWarnRecentPlacePrune(savedPlaces, selectedPlace)) {
      showToast({ title: "최근 장소가 15개를 넘어 가장 오래된 장소가 삭제돼요.", tone: "warning" });
    }
    const payload: AppointmentCreateRequest = {
      title: title.trim(),
      placeName,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      scheduledAt: scheduledAtFromSelection(selectedDate, selectedTime),
      shareStartOffsetMinutes,
      penalty: penaltyNone ? "" : penalty.trim(),
      arrivalRadiusMeters,
      graceMinutes,
      memo: memo.trim() || undefined,
      hostTravelMode
    };

    submitInFlightRef.current = true;
    setSaving(true);
    try {
      await apiPostAuthenticated<AppointmentCreateResponse, AppointmentCreateRequest>("/appointments", payload);
      if (shouldAskHostTravelMode && saveHostTravelModeDefault) {
        try {
          await updateProfile({
            defaultTravelMode: hostTravelMode,
            travelModeOnboardingCompleted: true
          });
        } catch {
          showToast({ title: "약속은 만들었지만 기본 이동수단 저장은 실패했어요.", tone: "warning" });
        }
      }
      setExitConfirmationDisabled(true);
      setReplaceAfterCreate(true);
    } catch (error) {
      submitInFlightRef.current = false;
      setSaving(false);
      showDialog({
        title: "약속을 만들지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    }
  };

  const handleSelectPlace = async (place: Coordinate) => {
    setPlaceResults([]);
    setMapCenter(place);
    setSelectedPlace(place);
    setPlaceResolving(true);
    try {
      const address = await apiGetAuthenticated<ReverseGeocodeResponse>(
        `/maps/reverse-geocode?lat=${encodeURIComponent(place.latitude)}&lng=${encodeURIComponent(place.longitude)}`
      );
      setSelectedPlace({
        latitude: place.latitude,
        longitude: place.longitude,
        address: address.displayName
      });
    } catch (error) {
      setSelectedPlace(place);
      showDialog({
        title: "주소를 불러오지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setPlaceResolving(false);
    }
  };

  const handleSearchPlaces = async () => {
    const query = placeQuery.trim();
    if (!query || placeSearching) {
      return;
    }

    setPlaceSearching(true);
    setPlaceSearchMessage(null);
    try {
      const result = await apiGetAuthenticated<PlaceSearchResponse>(
        `/maps/search?query=${encodeURIComponent(query)}&lat=${encodeURIComponent(mapCenter.latitude)}&lng=${encodeURIComponent(mapCenter.longitude)}`
      );
      setPlaceResults(result.items);
      if (result.items.length === 0) {
        setPlaceSearchMessage("검색 결과 없음");
      }
    } catch (error) {
      showDialog({
        title: "장소를 검색하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setPlaceSearching(false);
    }
  };

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    const displayName = placeDisplayName(place);
    const coordinate = { latitude: place.latitude, longitude: place.longitude };
    setMapCenter(coordinate);
    setSelectedPlace({
      ...coordinate,
      address: displayName
    });
    setPlaceQuery(displayName);
    setPlaceResults([]);
    setPlaceSearchMessage(null);
  };

  const handleSelectSavedPlace = (place: SavedPlace) => {
    const coordinate = { latitude: place.latitude, longitude: place.longitude };
    setMapCenter(coordinate);
    setSelectedPlace({
      ...coordinate,
      address: place.placeName
    });
    setPlaceQuery(savedPlaceTitle(place));
    setPlaceResults([]);
    setPlaceSearchMessage(null);
  };

  const handleSaveSelectedPlace = async () => {
    if (!selectedPlace?.address || savingPlace || selectedPlaceFavorite) {
      return;
    }

    const willPruneFavorite = favoritePlaces.length >= SAVED_PLACE_LIMIT;
    setSavingPlace(true);
    try {
      await apiPostAuthenticated<SavedPlace, SavedPlaceCreateRequest>("/places", {
        label: defaultSavedPlaceLabel(selectedPlace.address),
        placeName: selectedPlace.address,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        favorite: true
      });
      const nextPlaces = await apiGetAuthenticated<SavedPlace[]>("/places");
      setSavedPlaces(nextPlaces);
      showToast({
        title: willPruneFavorite
          ? "즐겨찾기 15개를 넘어 가장 오래된 즐겨찾기가 삭제됐어요."
          : "내 장소에 저장했어요.",
        tone: willPruneFavorite ? "warning" : "success"
      });
    } catch (error) {
      showDialog({
        title: "내 장소에 저장하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setSavingPlace(false);
    }
  };

  const handleManageSavedPlaces = () => {
    router.push("/places");
  };

  const handleUseCurrentLocation = async () => {
    if (locationLoading) {
      return;
    }

    setLocationLoading(true);
    try {
      const currentLocation = await getCurrentLocation(true, showDialog);
      if (currentLocation) {
        await handleSelectPlace(currentLocation);
      }
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <>
      <AppScreen
        keyboardAvoiding
        scrollRef={scrollRef}
        keyboardShouldPersistTaps="handled"
        footer={
          <FooterBar>
            <PrimaryButton onPress={handleCreate} disabled={saving}>{saving ? "만드는 중..." : "약속 만들기"}</PrimaryButton>
          </FooterBar>
        }
      >
      <Header title="약속 만들기" center back={() => router.back()} />

      <InfoCard style={styles.card}>
        <InputField
          label="약속 이름"
          icon={CalendarDays}
          value={title}
          onChangeText={setTitle}
          placeholder="예: 홍대 저녁 약속"
          maxLength={APPOINTMENT_TITLE_MAX_LENGTH}
        />
      </InfoCard>

      <InfoCard style={styles.cardGap}>
        <View style={styles.placeHeaderRow}>
          <SectionTitle icon={MapPin} title="만남 장소" />
          <SavedPlacePicker
            recentPlaces={recentPlaces}
            favoritePlaces={favoritePlaces}
            loading={savedPlacesLoading}
            selectedPlace={selectedPlace}
            onSelect={handleSelectSavedPlace}
            onManageSavedPlaces={handleManageSavedPlaces}
            style={styles.placeHeaderAction}
          />
        </View>
        <PlacePicker
          center={mapCenter}
          selectedPlace={selectedPlace}
          recentPlaces={recentPlaces}
          favoritePlaces={favoritePlaces}
          savedPlacesLoading={savedPlacesLoading}
          savingPlace={savingPlace}
          selectedPlaceFavorite={selectedPlaceFavorite}
          placeResolving={placeResolving}
          searchQuery={placeQuery}
          searchResults={placeResults}
          searchMessage={placeSearchMessage}
          searchLoading={placeSearching}
          locationLoading={locationLoading}
          onSearchQueryChange={setPlaceQuery}
          onSubmitSearch={handleSearchPlaces}
          onClearSearch={() => {
            setPlaceQuery("");
            setPlaceResults([]);
            setPlaceSearchMessage(null);
          }}
          onSelectSearchResult={handleSelectSearchResult}
          onUseCurrentLocation={handleUseCurrentLocation}
          onSaveSelectedPlace={handleSaveSelectedPlace}
          onSelectSavedPlace={handleSelectSavedPlace}
          onManageSavedPlaces={handleManageSavedPlaces}
          onSelect={handleSelectPlace}
        />
        <View style={styles.placeSelectionRow}>
          <Text
            style={[
              styles.placeSelectionText,
              selectedPlace?.address || placeResolving ? styles.selectionText : styles.placeholderText
            ]}
            numberOfLines={2}
          >
            {placeResolving ? "주소 확인 중..." : selectedPlace?.address ?? "지도를 눌러 만남 장소를 선택하세요"}
          </Text>
          {selectedPlace?.address ? (
            <SaveSelectedPlaceButton
              onPress={handleSaveSelectedPlace}
              saving={savingPlace}
              saved={selectedPlaceFavorite}
              resolving={placeResolving}
            />
          ) : null}
        </View>
      </InfoCard>

      <InfoCard style={styles.cardGap}>
        <View style={styles.settingRows}>
          <SettingRow
            icon={CalendarDays}
            label="날짜"
            value={selectedDate ? formatDateValue(selectedDate) : "날짜 선택"}
            active={activePicker === "date"}
            onPress={() => setActivePicker("date")}
          />
          <SettingRow
            icon={Clock3}
            label="시간"
            value={selectedTime ? formatTimeValue(selectedTime) : "시간 선택"}
            active={activePicker === "time"}
            onPress={() => {
              setSelectedTime((current) => validTimeForDate(selectedDate, current ?? "19:00", now));
              setActivePicker("time");
            }}
          />
          <SettingRow
            icon={Clock3}
            label="위치 공개"
            value={`${shareStartOffsetMinutes}분 전`}
            active={activePicker === "share"}
            onPress={() => setActivePicker("share")}
          />
          <SettingRow
            icon={Ruler}
            label="도착 반경(미터)"
            value={`${arrivalRadiusMeters}m`}
            active={activePicker === "radius"}
            onPress={() => setActivePicker("radius")}
          />
          <SettingRow
            icon={Timer}
            label="유예 시간(분)"
            value={`${graceMinutes}분`}
            active={activePicker === "grace"}
            onPress={() => setActivePicker("grace")}
            last
          />
        </View>
      </InfoCard>

      {shouldAskHostTravelMode ? (
        <InfoCard style={styles.cardGap}>
          <View style={styles.travelHeader}>
            <SectionTitle icon={MapPin} title="내 이동수단" />
            <Pressable
              onPress={() => setSaveHostTravelModeDefault((current) => !current)}
              style={({ pressed }) => [styles.checkboxButton, pressed && styles.pressed]}
            >
              <View style={[styles.checkboxBox, saveHostTravelModeDefault && styles.checkboxBoxOn]}>
                {saveHostTravelModeDefault ? <Check color="#FFFFFF" size={15} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.checkboxText, saveHostTravelModeDefault && styles.checkboxTextOn]}>기본으로 저장</Text>
            </Pressable>
          </View>
          <TravelModeChoiceGrid selected={hostTravelMode} onSelect={setHostTravelMode} disabled={saving} />
        </InfoCard>
      ) : null}

      <InfoCard style={styles.cardGap}>
        <View style={styles.penaltyHeader}>
          <SectionTitle icon={Gift} title="벌칙" />
          <Pressable onPress={handleTogglePenaltyNone} style={({ pressed }) => [styles.checkboxButton, pressed && styles.pressed]}>
            <View style={[styles.checkboxBox, penaltyNone && styles.checkboxBoxOn]}>
              {penaltyNone ? <Check color="#FFFFFF" size={15} strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.checkboxText, penaltyNone && styles.checkboxTextOn]}>벌칙 없음</Text>
          </Pressable>
        </View>
        {penaltyNone ? (
          <Text style={styles.penaltyHint}>벌칙 없이 약속을 만들어요.</Text>
        ) : (
          <TextInput
            value={penalty}
            onChangeText={setPenalty}
            placeholder="예: 지각자 커피 사기"
            placeholderTextColor="#B5BAC2"
            maxLength={APPOINTMENT_PENALTY_MAX_LENGTH}
            style={styles.input}
          />
        )}
      </InfoCard>

      <InfoCard style={styles.cardGap}>
        <Text style={styles.fieldLabel}>메모</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          onFocus={focusMemo}
          placeholder="예: 예약자명, 준비물"
          placeholderTextColor="#B5BAC2"
          maxLength={APPOINTMENT_MEMO_MAX_LENGTH}
          style={[styles.input, styles.memoInput]}
          multiline
          textAlignVertical="top"
        />
      </InfoCard>
      </AppScreen>
      <PickerModal
        activePicker={activePicker}
        desktopWeb={desktopWeb}
        now={now}
        today={today}
        visibleMonth={visibleMonth}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        shareStartOffsetMinutes={shareStartOffsetMinutes}
        arrivalRadiusMeters={arrivalRadiusMeters}
        graceMinutes={graceMinutes}
        onClose={() => setActivePicker(null)}
        onMonthChange={setVisibleMonth}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedTime((current) => current && validTimeForDate(date, current, now));
          setActivePicker(null);
        }}
        onSelectTime={setSelectedTime}
        onSelectShareStart={setShareStartOffsetMinutes}
        onSelectRadius={setArrivalRadiusMeters}
        onSelectGrace={setGraceMinutes}
      />
    </>
  );
}

function InputField({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  maxLength
}: {
  label: string;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Icon color={colors.primary} size={19} strokeWidth={2.2} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B5BAC2"
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

function SectionTitle({
  icon: Icon,
  title
}: {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  title: string;
}) {
  return (
    <View style={styles.labelRow}>
      <Icon color={colors.primary} size={19} strokeWidth={2.2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SaveSelectedPlaceButton({
  onPress,
  saving,
  saved,
  resolving,
  style
}: {
  onPress: () => void;
  saving: boolean;
  saved: boolean;
  resolving: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={saving || saved || resolving}
      accessibilityRole="button"
      accessibilityLabel={saved ? "저장된 장소" : "내 장소에 저장"}
      style={({ pressed }) => [
        styles.savePlaceButton,
        saved && styles.savePlaceButtonOn,
        style,
        pressed && !saving && !saved && styles.pressed,
        (saving || resolving) && styles.disabled
      ]}
    >
      {saving ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Star
          color={saved ? colors.primary : colors.textMuted}
          fill={saved ? colors.primary : "transparent"}
          size={20}
          strokeWidth={2.4}
        />
      )}
    </Pressable>
  );
}

function SavedPlacePicker({
  recentPlaces,
  favoritePlaces,
  loading,
  selectedPlace,
  onSelect,
  onManageSavedPlaces,
  style,
  buttonStyle
}: {
  recentPlaces: SavedPlace[];
  favoritePlaces: SavedPlace[];
  loading: boolean;
  selectedPlace: SelectedPlace | null;
  onSelect: (place: SavedPlace) => void;
  onManageSavedPlaces: () => void;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
}) {
  const [placesOpen, setPlacesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SavedPlaceTab>("favorite");
  const activePlaces = activeTab === "favorite" ? favoritePlaces : recentPlaces;
  const hasPlaces = favoritePlaces.length > 0 || recentPlaces.length > 0;

  const selectPlace = (place: SavedPlace) => {
    onSelect(place);
    setPlacesOpen(false);
  };

  const manageSavedPlaces = () => {
    setPlacesOpen(false);
    onManageSavedPlaces();
  };

  return (
    <View style={[styles.savedPlacesBlock, style]}>
      <Pressable
        onPress={() => setPlacesOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="내 장소 열기"
        style={({ pressed }) => [styles.openFavoritesButton, buttonStyle, pressed && styles.pressed]}
      >
        {loading && !hasPlaces ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Star color={colors.primary} fill={colors.primary} size={14} strokeWidth={2.4} />
        )}
        <Text style={styles.openFavoritesText}>내 장소</Text>
      </Pressable>
      <Modal transparent visible={placesOpen} animationType="fade" onRequestClose={() => setPlacesOpen(false)}>
        <View style={styles.favoriteModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPlacesOpen(false)} />
          <View style={styles.favoriteModalSheet}>
            <View style={styles.favoriteModalHeader}>
              <Text style={styles.favoriteModalTitle}>내 장소</Text>
              <View style={styles.favoriteModalHeaderActions}>
                <Pressable
                  onPress={manageSavedPlaces}
                  accessibilityRole="button"
                  accessibilityLabel="내 장소 관리"
                  style={({ pressed }) => [styles.managePlacesButton, pressed && styles.pressed]}
                >
                  <Settings2 color={colors.primary} size={15} strokeWidth={2.5} />
                  <Text style={styles.managePlacesText}>관리</Text>
                </Pressable>
                <Pressable onPress={() => setPlacesOpen(false)} hitSlop={10}>
                  <X color={colors.textMuted} size={22} strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>
            <View style={styles.savedPlaceTabs}>
              <Pressable
                onPress={() => setActiveTab("favorite")}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.savedPlaceTab,
                  activeTab === "favorite" && styles.savedPlaceTabOn,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.savedPlaceTabText, activeTab === "favorite" && styles.savedPlaceTabTextOn]}>
                  즐겨찾기
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("recent")}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.savedPlaceTab,
                  activeTab === "recent" && styles.savedPlaceTabOn,
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.savedPlaceTabText, activeTab === "recent" && styles.savedPlaceTabTextOn]}>
                  최근
                </Text>
              </Pressable>
            </View>
            {loading && !hasPlaces ? (
              <View style={styles.savedPlacesModalState}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : activePlaces.length > 0 ? (
              <ScrollView
                style={styles.favoritePlaceList}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {activePlaces.map((place, index) => {
                  const selected = isSelectedSavedPlace(place, selectedPlace);
                  return (
                    <Pressable
                      key={place.id}
                      onPress={() => selectPlace(place)}
                      accessibilityRole="button"
                      accessibilityLabel={`${savedPlaceTitle(place)} 선택`}
                      style={[
                        styles.favoritePlaceRow,
                        index < activePlaces.length - 1 && styles.favoritePlaceBorder
                      ]}
                    >
                      {activeTab === "favorite" ? (
                        <Star color={colors.primary} fill={colors.primary} size={18} strokeWidth={2.4} />
                      ) : (
                        <MapPin color={colors.primary} size={18} strokeWidth={2.4} />
                      )}
                      <View style={styles.favoritePlaceText}>
                        <Text style={styles.favoritePlaceTitle} numberOfLines={1}>{savedPlaceTitle(place)}</Text>
                        <Text style={styles.favoritePlaceAddress} numberOfLines={1}>{place.placeName}</Text>
                      </View>
                      {selected ? <Check color={colors.primary} size={20} strokeWidth={2.7} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.savedPlacesModalState}>
                <Text style={styles.savedPlacesModalEmptyText}>
                  {activeTab === "favorite" ? "즐겨찾기한 장소가 없어요." : "최근 기록이 없어요."}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SavedPlaceChip({
  place,
  selected,
  onPress
}: {
  place: SavedPlace;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${savedPlaceTitle(place)} 선택`}
      style={({ pressed }) => [
        styles.savedPlaceChip,
        selected && styles.savedPlaceChipSelected,
        pressed && styles.pressed
      ]}
    >
      <MapPin color={selected ? colors.primary : colors.textMuted} size={15} strokeWidth={2.4} />
      <Text
        style={[styles.savedPlaceChipText, selected && styles.savedPlaceChipTextSelected]}
        numberOfLines={1}
      >
        {savedPlaceTitle(place)}
      </Text>
    </Pressable>
  );
}

function shouldWarnRecentPlacePrune(places: readonly SavedPlace[], selectedPlace: SelectedPlace | null) {
  if (!selectedPlace?.address) {
    return false;
  }

  const matchingPlace = places.find((place) => isSelectedSavedPlace(place, selectedPlace));
  if (matchingPlace && matchingPlace.useCount > 0) {
    return false;
  }

  return recentSavedPlaces(places).length >= SAVED_PLACE_LIMIT;
}

function PlacePicker({
  center,
  selectedPlace,
  recentPlaces,
  favoritePlaces,
  savedPlacesLoading,
  savingPlace,
  selectedPlaceFavorite,
  placeResolving,
  searchQuery,
  searchResults,
  searchMessage,
  searchLoading,
  locationLoading,
  onSearchQueryChange,
  onSubmitSearch,
  onClearSearch,
  onSelectSearchResult,
  onUseCurrentLocation,
  onSaveSelectedPlace,
  onSelectSavedPlace,
  onManageSavedPlaces,
  onSelect
}: {
  center: Coordinate;
  selectedPlace: SelectedPlace | null;
  recentPlaces: SavedPlace[];
  favoritePlaces: SavedPlace[];
  savedPlacesLoading: boolean;
  savingPlace: boolean;
  selectedPlaceFavorite: boolean;
  placeResolving: boolean;
  searchQuery: string;
  searchResults: PlaceSearchResult[];
  searchMessage: string | null;
  searchLoading: boolean;
  locationLoading: boolean;
  onSearchQueryChange: (query: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
  onSelectSearchResult: (place: PlaceSearchResult) => void;
  onUseCurrentLocation: () => void;
  onSaveSelectedPlace: () => void;
  onSelectSavedPlace: (place: SavedPlace) => void;
  onManageSavedPlaces: () => void;
  onSelect: (place: Coordinate) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const renderSurface = ({
    searchAccessory,
    currentLocationButtonStyle,
    currentLocationIconSize
  }: {
    searchAccessory?: ReactNode;
    currentLocationButtonStyle?: StyleProp<ViewStyle>;
    currentLocationIconSize?: number;
  } = {}) => (
    <MapPickerSurface
      center={center}
      selectedPlace={selectedPlace}
      searchQuery={searchQuery}
      searchResults={searchResults}
      searchMessage={searchMessage}
      searchLoading={searchLoading}
      locationLoading={locationLoading}
      onSearchQueryChange={onSearchQueryChange}
      onSubmitSearch={onSubmitSearch}
      onClearSearch={onClearSearch}
      onSelectSearchResult={onSelectSearchResult}
      onUseCurrentLocation={onUseCurrentLocation}
      onSelect={onSelect}
      searchAccessory={searchAccessory}
      currentLocationButtonStyle={currentLocationButtonStyle}
      currentLocationIconSize={currentLocationIconSize}
    />
  );

  return (
      <>
      <View style={styles.mapWrap}>
        {renderSurface()}
        <Pressable onPress={() => setExpanded(true)} style={({ pressed }) => [styles.expandMapButton, pressed && styles.pressed]}>
          <Maximize2 color={colors.primary} size={17} strokeWidth={2.5} />
          <Text style={styles.expandMapText}>크게 보기</Text>
        </Pressable>
      </View>
      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={styles.fullMapScreen}>
          <View style={styles.fullMapHeader}>
            <Pressable onPress={() => setExpanded(false)} style={styles.fullMapCloseButton}>
              <X color={colors.text} size={26} strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.fullMapTitle}>만남 장소 선택</Text>
            <Pressable onPress={() => setExpanded(false)} hitSlop={10}>
              <Text style={styles.fullMapDone}>완료</Text>
            </Pressable>
          </View>
          <View style={styles.fullMapBody}>
            {renderSurface({
              searchAccessory: (
                <View style={styles.mapSearchPlaceActions}>
                  <SavedPlacePicker
                    recentPlaces={recentPlaces}
                    favoritePlaces={favoritePlaces}
                    loading={savedPlacesLoading}
                    selectedPlace={selectedPlace}
                    onSelect={onSelectSavedPlace}
                    onManageSavedPlaces={() => {
                      setExpanded(false);
                      onManageSavedPlaces();
                    }}
                    style={styles.mapSearchSavedPlaces}
                    buttonStyle={styles.mapSearchSavedPlacesButton}
                  />
                </View>
              ),
              currentLocationButtonStyle: styles.fullMapCurrentLocationButton,
              currentLocationIconSize: 26
            })}
            {selectedPlace?.address ? (
              <View style={styles.fullMapSavePlaceControl}>
                <SaveSelectedPlaceButton
                  onPress={onSaveSelectedPlace}
                  saving={savingPlace}
                  saved={selectedPlaceFavorite}
                  resolving={placeResolving}
                  style={styles.fullMapSavePlaceButton}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

function MapPickerSurface({
  center,
  selectedPlace,
  searchQuery,
  searchResults,
  searchMessage,
  searchLoading,
  locationLoading,
  onSearchQueryChange,
  onSubmitSearch,
  onClearSearch,
  onSelectSearchResult,
  onUseCurrentLocation,
  onSelect,
  searchAccessory,
  currentLocationButtonStyle,
  currentLocationIconSize = 21
}: {
  center: Coordinate;
  selectedPlace: SelectedPlace | null;
  searchQuery: string;
  searchResults: PlaceSearchResult[];
  searchMessage: string | null;
  searchLoading: boolean;
  locationLoading: boolean;
  onSearchQueryChange: (query: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
  onSelectSearchResult: (place: PlaceSearchResult) => void;
  onUseCurrentLocation: () => void;
  onSelect: (place: Coordinate) => void;
  searchAccessory?: ReactNode;
  currentLocationButtonStyle?: StyleProp<ViewStyle>;
  currentLocationIconSize?: number;
}) {
  const mapHtml = useMemo(() => placePickerHtml(selectedPlace, center), [
    center.latitude,
    center.longitude,
    selectedPlace?.latitude,
    selectedPlace?.longitude
  ]);
  const frameUrl = useMemo(
    () =>
      createNaverMapFrameUrl({
        mode: "picker",
        center,
        selectedPlace
      }),
    [center.latitude, center.longitude, selectedPlace?.latitude, selectedPlace?.longitude]
  );
  const mapSource = useMemo(() => ({ html: mapHtml, baseUrl: "http://localhost:8083" }), [mapHtml]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return undefined;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = parseMapMessage(event.data);
      if (data) {
        onSelect(data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onSelect]);

  return (
    <View style={styles.mapSurface}>
      {Platform.OS === "web" ? (
        <WebPlacePickerFrame src={frameUrl} />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={mapSource}
          javaScriptEnabled
          domStorageEnabled
          onMessage={(event) => {
            const data = parseMapMessage(event.nativeEvent.data);
            if (data) {
              onSelect(data);
            }
          }}
          style={styles.map}
        />
      )}
      <View style={styles.mapSearchOverlay}>
        <View style={styles.mapSearchRow}>
          <View style={styles.mapSearchBox}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.4} />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              onSubmitEditing={onSubmitSearch}
              returnKeyType="search"
              placeholder="장소나 주소 검색"
              placeholderTextColor="#9BA1AA"
              style={styles.mapSearchInput}
            />
            {searchQuery ? (
              <Pressable onPress={onClearSearch} hitSlop={8}>
                <X color={colors.textMuted} size={17} strokeWidth={2.6} />
              </Pressable>
            ) : null}
            <Pressable onPress={onSubmitSearch} style={({ pressed }) => [styles.mapSearchButton, pressed && styles.pressed]}>
              <Text style={styles.mapSearchButtonText}>{searchLoading ? "..." : "검색"}</Text>
            </Pressable>
          </View>
          {searchAccessory ? <View style={styles.mapSearchAccessory}>{searchAccessory}</View> : null}
        </View>
        {searchResults.length > 0 ? (
          <ScrollView style={styles.mapSearchResults} keyboardShouldPersistTaps="handled">
            {searchResults.map((result, index) => (
              <Pressable
                key={`${result.latitude}-${result.longitude}-${index}`}
                onPress={() => onSelectSearchResult(result)}
                style={({ pressed }) => [styles.mapSearchResultRow, pressed && styles.pressed]}
              >
                <Text style={styles.mapSearchResultTitle} numberOfLines={1}>
                  {result.title}
                </Text>
                <Text style={styles.mapSearchResultAddress} numberOfLines={1}>
                  {result.address ?? result.roadAddress ?? "주소 정보 없음"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        {searchMessage ? (
          <View style={styles.mapSearchMessage}>
            <Text style={styles.mapSearchMessageText}>{searchMessage}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onUseCurrentLocation}
        style={({ pressed }) => [styles.currentLocationButton, currentLocationButtonStyle, pressed && styles.pressed]}
      >
        <LocateFixed color={locationLoading ? colors.textMuted : colors.primary} size={currentLocationIconSize} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function WebPlacePickerFrame({ src }: { src: string }) {
  return createElement("iframe", {
    src,
    title: "Meeting place map",
    style: webMapFrameStyle
  });
}

function parseMapMessage(data: unknown): Coordinate | null {
  try {
    const payload = typeof data === "string" ? JSON.parse(data) : data;
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const message = payload as { type?: unknown; latitude?: unknown; longitude?: unknown };
    if (message.type !== "wayt-place-picker-select") {
      return null;
    }
    if (typeof message.latitude !== "number" || typeof message.longitude !== "number") {
      return null;
    }

    return {
      latitude: message.latitude,
      longitude: message.longitude
    };
  } catch {
    return null;
  }
}

function CalendarPicker({
  desktopWeb,
  now,
  today,
  visibleMonth,
  selectedDate,
  onMonthChange,
  onSelectDate
}: {
  desktopWeb: boolean;
  now: Date;
  today: Date;
  visibleMonth: Date;
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const days = calendarDays(visibleMonth);
  return (
    <View style={[styles.calendar, desktopWeb ? styles.desktopCalendar : null]}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={() => onMonthChange(addMonths(visibleMonth, -1))} style={styles.monthButton}>
          <ChevronLeft color={colors.textMuted} size={20} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
        </Text>
        <Pressable onPress={() => onMonthChange(addMonths(visibleMonth, 1))} style={styles.monthButton}>
          <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.3} />
        </Pressable>
      </View>
      <View style={styles.weekHeader}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <Text key={day} style={styles.weekText}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.dayGrid}>
        {days.map((date, index) => {
          const inMonth = date.getMonth() === visibleMonth.getMonth();
          const disabled = !selectableDate(date, today, now);
          const selected = selectedDate ? sameDay(date, selectedDate) : false;
          return (
            <Pressable
              key={`${date.toISOString()}-${index}`}
              onPress={() => !disabled && onSelectDate(date)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.dayCell,
                desktopWeb ? styles.desktopDayCell : null,
                !inMonth && styles.mutedDay,
                disabled && styles.disabledDay,
                pressed && !disabled && styles.pressed
              ]}
            >
              <View style={[styles.dayInner, selected && styles.selectedDay]}>
                <Text style={[styles.dayText, !inMonth && styles.mutedDayText, selected && styles.selectedDayText]}>
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PickerModal({
  activePicker,
  desktopWeb,
  now,
  today,
  visibleMonth,
  selectedDate,
  selectedTime,
  shareStartOffsetMinutes,
  arrivalRadiusMeters,
  graceMinutes,
  onClose,
  onMonthChange,
  onSelectDate,
  onSelectTime,
  onSelectShareStart,
  onSelectRadius,
  onSelectGrace
}: {
  activePicker: PickerMode | null;
  desktopWeb: boolean;
  now: Date;
  today: Date;
  visibleMonth: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  shareStartOffsetMinutes: number | null;
  arrivalRadiusMeters: number;
  graceMinutes: number;
  onClose: () => void;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  onSelectShareStart: (minutes: number) => void;
  onSelectRadius: (meters: number) => void;
  onSelectGrace: (minutes: number) => void;
}) {
  const pickerDismissPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          activePicker === "date" && shouldStartPickerDismissDrag(gestureState),
        onPanResponderRelease: (_, gestureState) => {
          if (activePicker === "date" && shouldDismissPickerDrag(gestureState)) {
            onClose();
          }
        }
      }),
    [activePicker, onClose]
  );
  const modalSheetPanHandlers = activePicker === "date" ? pickerDismissPanResponder.panHandlers : {};

  return (
    <Modal transparent visible={activePicker !== null} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, desktopWeb ? styles.desktopModalOverlay : null]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, desktopWeb ? styles.desktopModalSheet : null]} {...modalSheetPanHandlers}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activePicker ? pickerTitle(activePicker) : ""}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.modalDone}>완료</Text>
            </Pressable>
          </View>
          {activePicker ? (
            <SchedulePickerPanel
              activePicker={activePicker}
              desktopWeb={desktopWeb}
              now={now}
              today={today}
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              shareStartOffsetMinutes={shareStartOffsetMinutes}
              arrivalRadiusMeters={arrivalRadiusMeters}
              graceMinutes={graceMinutes}
              onMonthChange={onMonthChange}
              onSelectDate={onSelectDate}
              onSelectTime={onSelectTime}
              onSelectShareStart={onSelectShareStart}
              onSelectRadius={onSelectRadius}
              onSelectGrace={onSelectGrace}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function SchedulePickerPanel({
  activePicker,
  desktopWeb,
  now,
  today,
  visibleMonth,
  selectedDate,
  selectedTime,
  shareStartOffsetMinutes,
  arrivalRadiusMeters,
  graceMinutes,
  onMonthChange,
  onSelectDate,
  onSelectTime,
  onSelectShareStart,
  onSelectRadius,
  onSelectGrace
}: {
  activePicker: PickerMode;
  desktopWeb: boolean;
  now: Date;
  today: Date;
  visibleMonth: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  shareStartOffsetMinutes: number | null;
  arrivalRadiusMeters: number;
  graceMinutes: number;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  onSelectShareStart: (minutes: number) => void;
  onSelectRadius: (meters: number) => void;
  onSelectGrace: (minutes: number) => void;
}) {
  return (
    <View style={styles.pickerPanel}>
      {activePicker === "date" ? (
        <CalendarPicker
          desktopWeb={desktopWeb}
          now={now}
          today={today}
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          onMonthChange={onMonthChange}
          onSelectDate={onSelectDate}
        />
      ) : null}
      {activePicker === "time" ? (
        <TimeWheelPicker
          selectedTime={selectedTime}
          normalizeTime={(time) => validTimeForDate(selectedDate, time, now)}
          onSelectTime={onSelectTime}
        />
      ) : null}
      {activePicker === "share" ? (
        <OptionWheel
          options={SHARE_OPTIONS}
          selectedValue={shareStartOffsetMinutes}
          onSelect={onSelectShareStart}
          formatLabel={(value) => `${value}분 전`}
        />
      ) : null}
      {activePicker === "radius" ? (
        <OptionWheel
          options={RADIUS_OPTIONS}
          selectedValue={arrivalRadiusMeters}
          onSelect={onSelectRadius}
          formatLabel={(value) => `${value}m`}
        />
      ) : null}
      {activePicker === "grace" ? (
        <OptionWheel
          options={GRACE_OPTIONS}
          selectedValue={graceMinutes}
          onSelect={onSelectGrace}
          formatLabel={(value) => `${value}분`}
        />
      ) : null}
    </View>
  );
}

function OptionWheel<T extends number>({
  options,
  selectedValue,
  onSelect,
  formatLabel
}: {
  options: T[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  formatLabel: (value: T) => string;
}) {
  const value = selectedValue ?? options[0];

  return (
    <View style={styles.singleSpinnerPanel}>
      <View style={styles.spinnerHighlight} />
      <SpinnerColumn
        options={options}
        value={value}
        onChange={onSelect}
        formatLabel={formatLabel}
      />
    </View>
  );
}

function SpinnerColumn<T extends PickerValue>({
  options,
  value,
  onChange,
  formatLabel = (option) => String(option)
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (value: T) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(options.indexOf(value), 0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });
  }, [selectedIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.min(
      options.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT))
    );
    const nextValue = options[nextIndex];
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <View style={styles.spinnerColumn}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={styles.spinnerScrollContent}
      >
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={String(option)}
              onPress={() => onChange(option)}
              style={({ pressed }) => [styles.spinnerScrollItem, pressed && styles.pressed]}
            >
              <Text style={[styles.spinnerTextMuted, selected && styles.spinnerTextSelected]}>
                {formatLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  active,
  onPress,
  last
}: {
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, !last && styles.settingBorder, pressed && styles.pressed]}
    >
      <Icon color={active ? colors.primary : colors.textMuted} size={21} strokeWidth={2.2} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={[styles.settingValue, active && styles.settingValueActive]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

function ChoiceGrid<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  formatLabel = (value) => String(value),
  columns
}: {
  options: T[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
  columns: number;
}) {
  return (
    <View style={styles.choiceGrid}>
      {options.map((option) => {
        const selected = option === selectedValue;
        return (
          <Pressable
            key={String(option)}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.choice,
              { width: `${100 / columns - 1.5}%` },
              selected && styles.selectedChoice,
              pressed && styles.pressed
            ]}
          >
            <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{formatLabel(option)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function placePickerHtml(selectedPlace: SelectedPlace | null, centerPoint: Coordinate) {
  const selectedScript = selectedPlace
    ? `setMarker(new naver.maps.LatLng(${selectedPlace.latitude}, ${selectedPlace.longitude}), false);`
    : "";
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #f7f6f2; }
      .label {
        padding: 5px 10px;
        border-radius: 999px;
        background: #fff;
        color: #111;
        font: 800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,.16);
        white-space: nowrap;
      }
    </style>
    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${env.naverMapsNcpKeyId}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const center = new naver.maps.LatLng(${centerPoint.latitude}, ${centerPoint.longitude});
      const map = new naver.maps.Map("map", {
        center,
        zoom: 15,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false
      });
      let marker = null;

      function setMarker(position, notify) {
        if (marker) {
          marker.setMap(null);
        }
        marker = new naver.maps.Marker({
          position,
          map,
          icon: {
            content: '<div class="label">만남 장소</div>',
            anchor: new naver.maps.Point(34, 18)
          }
        });
        map.panTo(position);
        if (notify) {
          const payload = {
            type: "wayt-place-picker-select",
            latitude: position.lat(),
            longitude: position.lng()
          };
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          } else if (window.parent) {
            window.parent.postMessage(payload, "*");
          }
        }
      }

      naver.maps.Event.addListener(map, "click", function(event) {
        setMarker(event.coord, true);
      });

      ${selectedScript}
    </script>
  </body>
</html>`;
}

async function getCurrentLocation(
  showAlert: boolean,
  showDialog?: (request: { title: string; message?: string; tone?: "warning" | "danger" }) => void
): Promise<Coordinate | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      if (showAlert) {
        showDialog?.({
          title: "위치 권한이 필요해요.",
          message: "현재 위치로 지도를 이동하려면 위치 권한을 허용해 주세요.",
          tone: "warning"
        });
      }
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (error) {
    if (showAlert) {
      showDialog?.({
        title: "현재 위치를 가져오지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    }
    return null;
  }
}

function placeDisplayName(place: PlaceSearchResult) {
  return place.title || place.roadAddress || place.address || "선택한 장소";
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function selectableDate(date: Date, today: Date, now: Date) {
  if (date < today) {
    return false;
  }
  if (!sameDay(date, today)) {
    return true;
  }
  return availableTimesForDate(date, now).length > 0;
}

function pickerTitle(mode: PickerMode) {
  switch (mode) {
    case "date":
      return "날짜 선택";
    case "time":
      return "시간 선택";
    case "share":
      return "위치 공개 시작";
    case "radius":
      return "도착 반경(미터)";
    case "grace":
      return "유예 시간(분)";
  }
}

function formatDateValue(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function formatTimeValue(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${pad(minute)}`;
}

const styles = StyleSheet.create({
  card: {
    gap: 14
  },
  cardGap: {
    marginTop: 18,
    gap: 14
  },
  penaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  travelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  checkboxButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C7CED8",
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxBoxOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  checkboxText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  checkboxTextOn: {
    color: colors.primary
  },
  penaltyHint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  field: {
    gap: 8
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  placeHeaderRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  placeHeaderAction: {
    marginLeft: "auto"
  },
  savedPlacesLoading: {
    minHeight: 38,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  savedPlacesBlock: {
    gap: 8
  },
  savedPlacesHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  savedPlacesLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  openFavoritesButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B9D9FF",
    backgroundColor: "#F0F7FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10
  },
  openFavoritesText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  savedPlaceList: {
    gap: 8,
    paddingRight: 4
  },
  savedPlaceChip: {
    height: 38,
    maxWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11
  },
  savedPlaceChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#F0F7FF"
  },
  savedPlaceChipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
    maxWidth: 132
  },
  savedPlaceChipTextSelected: {
    color: colors.primary
  },
  savedPlacesEmptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  favoriteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 7, 0.28)",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 18
  },
  favoriteModalSheet: {
    height: 480,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12
  },
  favoriteModalHeader: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  favoriteModalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  favoriteModalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  managePlacesButton: {
    minHeight: 30,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9
  },
  managePlacesText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  savedPlaceTabs: {
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F6F9",
    flexDirection: "row",
    padding: 3,
    marginBottom: 8
  },
  savedPlaceTab: {
    flex: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  savedPlaceTabOn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  savedPlaceTabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  savedPlaceTabTextOn: {
    color: colors.primary
  },
  favoritePlaceList: {
    flex: 1
  },
  savedPlacesModalState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  savedPlacesModalEmptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  favoritePlaceRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10
  },
  favoritePlaceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  favoritePlaceText: {
    flex: 1,
    minWidth: 0
  },
  favoritePlaceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  favoritePlaceAddress: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 13
  },
  memoInput: {
    minHeight: 96,
    paddingTop: 12
  },
  mapWrap: {
    height: 310,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E7ED",
    backgroundColor: "#F7F6F2"
  },
  mapSurface: {
    flex: 1,
    backgroundColor: "#F7F6F2"
  },
  map: {
    flex: 1,
    backgroundColor: "#F7F6F2"
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
    gap: 8,
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
    minWidth: 0,
    textAlign: "center"
  },
  fullMapDone: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  fullMapBody: {
    flex: 1
  },
  mapSearchOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 5,
    gap: 8
  },
  mapSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  mapSearchBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(218, 222, 229, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  mapSearchAccessory: {
    flexShrink: 0
  },
  mapSearchPlaceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  mapSearchSavedPlaces: {
    flexShrink: 0
  },
  mapSearchSavedPlacesButton: {
    height: 42
  },
  mapSearchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0
  },
  mapSearchButton: {
    minWidth: 48,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  mapSearchButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  mapSearchResults: {
    maxHeight: 138,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(218, 222, 229, 0.92)",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  mapSearchResultRow: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
    gap: 3
  },
  mapSearchResultTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  mapSearchResultAddress: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  mapSearchMessage: {
    minHeight: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(218, 222, 229, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7
  },
  mapSearchMessageText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  currentLocationButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(218, 222, 229, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 4
  },
  fullMapCurrentLocationButton: {
    right: 18,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 18,
    zIndex: 6
  },
  fullMapSavePlaceControl: {
    position: "absolute",
    right: 18,
    bottom: 154,
    zIndex: 7
  },
  fullMapSavePlaceButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.13,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  placeholderText: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: "700"
  },
  placeSelectionRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  placeSelectionText: {
    flex: 1,
    minWidth: 0
  },
  selectionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  savePlaceButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  savePlaceButtonOn: {
    borderColor: "#B9D9FF",
    backgroundColor: "#F0F7FF"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 7, 0.28)",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 18
  },
  desktopModalOverlay: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  modalSheet: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12
  },
  desktopModalSheet: {
    width: 440,
    maxWidth: "100%",
    alignSelf: "center",
    borderRadius: 22,
    padding: 18,
    transform: [{ translateX: 260 }]
  },
  modalHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  modalDone: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  pickerPanel: {
    minHeight: 168,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center"
  },
  settingRows: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  settingRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    flex: 1
  },
  settingValue: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "52%",
    textAlign: "right"
  },
  settingValueActive: {
    color: colors.primary
  },
  calendar: {
    gap: 10
  },
  desktopCalendar: {
    gap: 12
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  monthButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  monthTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  weekHeader: {
    flexDirection: "row"
  },
  weekText: {
    width: `${100 / 7}%`,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10
  },
  desktopDayCell: {
    height: 44,
    aspectRatio: undefined
  },
  dayInner: {
    width: 42,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  dayText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  mutedDay: {
    opacity: 0.35
  },
  mutedDayText: {
    color: colors.textMuted
  },
  disabledDay: {
    opacity: 0.18
  },
  selectedDay: {
    backgroundColor: colors.primary
  },
  selectedDayText: {
    color: "#FFFFFF"
  },
  spinnerPanel: {
    height: WHEEL_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  spinnerHighlight: {
    position: "absolute",
    left: 16,
    right: 16,
    top: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#F1F2F5"
  },
  singleSpinnerPanel: {
    height: WHEEL_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  spinnerColumn: {
    flex: 1,
    height: WHEEL_HEIGHT,
    alignItems: "center",
    zIndex: 1
  },
  spinnerScrollContent: {
    paddingVertical: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2
  },
  spinnerScrollItem: {
    height: WHEEL_ITEM_HEIGHT,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center"
  },
  spinnerTextMuted: {
    color: "#C1C6CE",
    fontSize: 20,
    fontWeight: "700"
  },
  spinnerTextSelected: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "900"
  },
  optionPanel: {
    minHeight: 174,
    justifyContent: "center"
  },
  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  choice: {
    minHeight: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6
  },
  selectedChoice: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  selectedChoiceText: {
    color: "#FFFFFF"
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.48
  }
});

const webMapFrameStyle = {
  width: "100%",
  height: "100%",
  border: 0,
  display: "block",
  backgroundColor: "#F7F6F2"
};
