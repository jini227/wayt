import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, MapPin, Pencil, Star, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { AppScreen } from "../src/components/AppScreen";
import { Header, InfoCard } from "../src/components/Cards";
import { apiGetAuthenticated, apiPatchAuthenticated } from "../src/api/client";
import { useAppFeedback } from "../src/feedback/AppFeedback";
import {
  favoriteSavedPlaces,
  recentSavedPlaces,
  savedPlaceMetaLabel,
  savedPlaceTitle,
  sortSavedPlacesForPicker,
  type SavedPlace
} from "../src/places/savedPlaces";
import {
  SAVED_PLACE_LABEL_MAX_LENGTH,
  canSaveSavedPlaceLabel,
  savedPlaceEditDraft,
  savedPlaceLabelUpdateRequest
} from "../src/places/savedPlaceEditing";
import { colors } from "../src/theme";

type SavedPlaceUpdateRequest = {
  label?: string;
  favorite?: boolean;
};

const SAVED_PLACE_LIMIT = 15;
const PLACE_ROW_ACTION_BUTTON_SIZE = 34;
const PLACE_ROW_ACTION_ICON_SIZE = 14;

export default function PlacesScreen() {
  const router = useRouter();
  const { showDialog, showToast } = useAppFeedback();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [editingPlaceKey, setEditingPlaceKey] = useState<string | null>(null);

  const favoritePlaces = useMemo(() => favoriteSavedPlaces(places), [places]);
  const recentPlaces = useMemo(() => recentSavedPlaces(places), [places]);
  const otherPlaces = useMemo(
    () => sortSavedPlacesForPicker(places).filter((place) => !place.favorite && place.useCount === 0),
    [places]
  );

  const loadPlaces = useCallback(() => {
    let cancelled = false;
    setLoading(true);

    apiGetAuthenticated<SavedPlace[]>("/places")
      .then((items) => {
        if (!cancelled) {
          setPlaces(items);
          setLabelDrafts(draftsFor(items));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          showDialog({
            title: "내 장소를 불러오지 못했어요.",
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

  useEffect(() => loadPlaces(), [loadPlaces]);

  const updatePlace = useCallback(
    async (place: SavedPlace, changes: SavedPlaceUpdateRequest, toastTitle: string) => {
      if (savingPlaceId) {
        return false;
      }

      const label = (changes.label ?? savedPlaceTitle(place)).trim();
      if (!label) {
        showToast({ title: "장소 이름을 입력해 주세요.", tone: "warning" });
        return false;
      }

      const willPruneFavorite = changes.favorite === true && !place.favorite && favoritePlaces.length >= SAVED_PLACE_LIMIT;
      setSavingPlaceId(place.id);
      try {
        const updated = await apiPatchAuthenticated<SavedPlace, SavedPlaceUpdateRequest>(`/places/${place.id}`, {
          label,
          favorite: changes.favorite ?? place.favorite
        });
        if (willPruneFavorite) {
          const nextPlaces = await apiGetAuthenticated<SavedPlace[]>("/places");
          setPlaces(nextPlaces);
          setLabelDrafts(draftsFor(nextPlaces));
          showToast({ title: "즐겨찾기 15개를 넘어 가장 오래된 즐겨찾기가 삭제됐어요.", tone: "warning" });
        } else {
          setPlaces((current) => current.map((item) => item.id === updated.id ? updated : item));
          setLabelDrafts((current) => ({ ...current, [updated.id]: savedPlaceTitle(updated) }));
          showToast({ title: toastTitle });
        }
        return true;
      } catch (error) {
        showDialog({
          title: "내 장소를 저장하지 못했어요.",
          message: error instanceof Error ? error.message : undefined,
          tone: "danger"
        });
        return false;
      } finally {
        setSavingPlaceId(null);
      }
    },
    [favoritePlaces.length, savingPlaceId, showDialog, showToast]
  );

  const startEditingPlace = useCallback((place: SavedPlace, rowKey: string) => {
    setEditingPlaceKey(rowKey);
    setLabelDrafts((current) => ({ ...current, [place.id]: savedPlaceEditDraft(place) }));
  }, []);

  const cancelEditingPlace = useCallback((place: SavedPlace) => {
    setEditingPlaceKey(null);
    setLabelDrafts((current) => ({ ...current, [place.id]: savedPlaceEditDraft(place) }));
  }, []);

  const savePlaceLabel = useCallback(
    async (place: SavedPlace) => {
      const draft = labelDrafts[place.id] ?? savedPlaceEditDraft(place);
      const request = savedPlaceLabelUpdateRequest(place, draft);
      if (!request) {
        if (!draft.trim()) {
          showToast({ title: "장소 이름을 입력해 주세요.", tone: "warning" });
        }
        return;
      }

      const saved = await updatePlace(place, request, "장소 이름을 저장했어요.");
      if (saved) {
        setEditingPlaceKey(null);
      }
    },
    [labelDrafts, showToast, updatePlace]
  );

  return (
    <AppScreen keyboardAvoiding keyboardShouldPersistTaps="handled">
      <Header title="내 장소" center back={() => router.back()} />

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : places.length === 0 ? (
        <InfoCard>
          <View style={styles.emptyBox}>
            <MapPin color={colors.textSubtle} size={34} strokeWidth={2.2} />
            <Text style={styles.emptyTitle}>저장된 장소가 없어요.</Text>
            <Text style={styles.emptyText}>약속 만들기에서 장소를 고르고 별표를 누르면 여기에 모여요.</Text>
          </View>
        </InfoCard>
      ) : (
        <>
          <PlaceSection
            sectionKey="favorite"
            title="즐겨찾기"
            places={favoritePlaces}
            labelDrafts={labelDrafts}
            savingPlaceId={savingPlaceId}
            editingPlaceKey={editingPlaceKey}
            emptyText="즐겨찾는 장소가 없어요."
            onChangeLabel={(place, label) => setLabelDrafts((current) => ({ ...current, [place.id]: label }))}
            onStartEditing={startEditingPlace}
            onCancelEditing={cancelEditingPlace}
            onSaveLabel={savePlaceLabel}
            onToggleFavorite={(place) =>
              updatePlace(
                place,
                { favorite: !place.favorite },
                place.favorite ? "즐겨찾기를 해제했어요." : "즐겨찾기에 추가했어요."
              )
            }
          />
          <PlaceSection
            sectionKey="recent"
            title="최근 사용"
            places={recentPlaces}
            labelDrafts={labelDrafts}
            savingPlaceId={savingPlaceId}
            editingPlaceKey={editingPlaceKey}
            style={styles.sectionGap}
            emptyText="최근 사용 장소가 없어요."
            onChangeLabel={(place, label) => setLabelDrafts((current) => ({ ...current, [place.id]: label }))}
            onStartEditing={startEditingPlace}
            onCancelEditing={cancelEditingPlace}
            onSaveLabel={savePlaceLabel}
            onToggleFavorite={(place) =>
              updatePlace(
                place,
                { favorite: !place.favorite },
                place.favorite ? "즐겨찾기를 해제했어요." : "즐겨찾기에 추가했어요."
              )
            }
          />
          {otherPlaces.length > 0 ? (
            <PlaceSection
              sectionKey="other"
              title="기타"
              places={otherPlaces}
              labelDrafts={labelDrafts}
              savingPlaceId={savingPlaceId}
              editingPlaceKey={editingPlaceKey}
              style={styles.sectionGap}
              emptyText=""
              onChangeLabel={(place, label) => setLabelDrafts((current) => ({ ...current, [place.id]: label }))}
              onStartEditing={startEditingPlace}
              onCancelEditing={cancelEditingPlace}
              onSaveLabel={savePlaceLabel}
              onToggleFavorite={(place) =>
                updatePlace(
                  place,
                  { favorite: !place.favorite },
                  place.favorite ? "즐겨찾기를 해제했어요." : "즐겨찾기에 추가했어요."
                )
              }
            />
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

function PlaceSection({
  sectionKey,
  title,
  places,
  labelDrafts,
  savingPlaceId,
  editingPlaceKey,
  emptyText,
  style,
  onChangeLabel,
  onStartEditing,
  onCancelEditing,
  onSaveLabel,
  onToggleFavorite
}: {
  sectionKey: SavedPlaceSectionKey;
  title: string;
  places: SavedPlace[];
  labelDrafts: Record<string, string>;
  savingPlaceId: string | null;
  editingPlaceKey: string | null;
  emptyText: string;
  style?: object;
  onChangeLabel: (place: SavedPlace, label: string) => void;
  onStartEditing: (place: SavedPlace, rowKey: string) => void;
  onCancelEditing: (place: SavedPlace) => void;
  onSaveLabel: (place: SavedPlace) => void;
  onToggleFavorite: (place: SavedPlace) => void;
}) {
  return (
    <InfoCard style={[styles.sectionCard, style]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {places.length > 0 ? <Text style={styles.sectionCount}>{places.length}곳</Text> : null}
      </View>
      {places.length > 0 ? (
        <View style={styles.list}>
          {places.map((place, index) => {
            const rowKey = savedPlaceRowKey(sectionKey, place);
            return (
              <PlaceRow
                key={place.id}
                place={place}
                labelDraft={labelDrafts[place.id] ?? savedPlaceTitle(place)}
                saving={savingPlaceId === place.id}
                isEditing={editingPlaceKey === rowKey}
                border={index < places.length - 1}
                onChangeLabel={(label) => onChangeLabel(place, label)}
                onStartEditing={() => onStartEditing(place, rowKey)}
                onCancelEditing={() => onCancelEditing(place)}
                onSaveLabel={() => onSaveLabel(place)}
                onToggleFavorite={() => onToggleFavorite(place)}
              />
            );
          })}
        </View>
      ) : (
        <Text style={styles.sectionEmpty}>{emptyText}</Text>
      )}
    </InfoCard>
  );
}

type SavedPlaceSectionKey = "favorite" | "recent" | "other";

function savedPlaceRowKey(sectionKey: SavedPlaceSectionKey, place: SavedPlace) {
  return `${sectionKey}:${place.id}`;
}

function PlaceRow({
  place,
  labelDraft,
  saving,
  isEditing,
  border,
  onChangeLabel,
  onStartEditing,
  onCancelEditing,
  onSaveLabel,
  onToggleFavorite
}: {
  place: SavedPlace;
  labelDraft: string;
  saving: boolean;
  isEditing: boolean;
  border: boolean;
  onChangeLabel: (label: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveLabel: () => void;
  onToggleFavorite: () => void;
}) {
  const canSaveLabel = canSaveSavedPlaceLabel(place, labelDraft, saving ? place.id : null);
  const clearLabelDraft = () => onChangeLabel("");

  return (
    <View style={[styles.row, border && styles.rowBorder]}>
      <View style={styles.nameRow}>
        <Pressable
          onPress={onToggleFavorite}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={place.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          hitSlop={10}
          style={({ pressed }) => [
            styles.favoriteButton,
            pressed && !saving && styles.pressed,
            saving && styles.disabled
          ]}
        >
          <Star
            color={place.favorite ? colors.primary : colors.textSubtle}
            fill={place.favorite ? colors.primary : "transparent"}
            size={19}
            strokeWidth={2.4}
          />
        </Pressable>
        <View style={styles.rowBody}>
          {isEditing ? (
            <View style={styles.editLine}>
              <View style={styles.editInputBox}>
                <TextInput
                  value={labelDraft}
                  onChangeText={onChangeLabel}
                  placeholder="장소 이름"
                  placeholderTextColor={colors.textSubtle}
                  autoCapitalize="none"
                  autoFocus
                  maxLength={SAVED_PLACE_LABEL_MAX_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={() => canSaveLabel ? onSaveLabel() : undefined}
                  style={styles.nameInput}
                />
                {labelDraft.length > 0 ? (
                  <Pressable
                    onPress={clearLabelDraft}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="장소 이름 지우기"
                    hitSlop={8}
                    style={({ pressed }) => [styles.clearButton, pressed && !saving && styles.pressed, saving && styles.disabled]}
                  >
                    <X color={colors.textMuted} size={16} strokeWidth={2.6} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={onCancelEditing}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="장소 이름 수정 취소"
                style={({ pressed }) => [
                  styles.iconActionButton,
                  styles.cancelButton,
                  pressed && !saving && styles.pressed,
                  saving && styles.disabled
                ]}
              >
                <X color={colors.textMuted} size={PLACE_ROW_ACTION_ICON_SIZE} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                onPress={onSaveLabel}
                disabled={!canSaveLabel}
                accessibilityRole="button"
                accessibilityLabel="장소 이름 저장"
                style={({ pressed }) => [
                  styles.iconActionButton,
                  styles.saveButton,
                  pressed && canSaveLabel && styles.pressed,
                  !canSaveLabel && styles.disabled
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Check color={colors.primary} size={PLACE_ROW_ACTION_ICON_SIZE} strokeWidth={2.6} />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.labelDisplayRow}>
              <Text style={styles.placeLabel} numberOfLines={1}>{savedPlaceTitle(place)}</Text>
              <Pressable
                onPress={onStartEditing}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="장소 이름 수정"
                style={({ pressed }) => [
                  styles.iconActionButton,
                  styles.editButton,
                  pressed && !saving && styles.pressed,
                  saving && styles.disabled
                ]}
              >
                <Pencil color={colors.primary} size={PLACE_ROW_ACTION_ICON_SIZE} strokeWidth={2.4} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.placeName} numberOfLines={1}>{place.placeName}</Text>
        <Text style={styles.metaText}>{savedPlaceMetaLabel(place)}</Text>
      </View>
    </View>
  );
}

function draftsFor(places: SavedPlace[]) {
  return Object.fromEntries(places.map((place) => [place.id, savedPlaceTitle(place)]));
}

const styles = StyleSheet.create({
  stateBox: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20
  },
  sectionGap: {
    marginTop: 14
  },
  sectionCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20
  },
  sectionHeader: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  sectionEmpty: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14
  },
  list: {
    marginTop: 0
  },
  row: {
    minHeight: 74,
    paddingVertical: 12
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  favoriteButton: {
    width: 30,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  rowBody: {
    flex: 1,
    minWidth: 0
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 38
  },
  labelDisplayRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  placeLabel: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  iconActionButton: {
    width: PLACE_ROW_ACTION_BUTTON_SIZE,
    height: PLACE_ROW_ACTION_BUTTON_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  editButton: {
    backgroundColor: colors.primarySoft
  },
  editLine: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  editInputBox: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DADDE3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 8
  },
  nameInput: {
    flex: 1,
    minHeight: 38,
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelButton: {
    backgroundColor: "#F4F6F9"
  },
  saveButton: {
    backgroundColor: colors.primarySoft
  },
  detailRow: {
    marginLeft: 38,
    gap: 3
  },
  placeName: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  metaText: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.48
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
