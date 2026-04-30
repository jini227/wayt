import { savedPlaceTitle, type SavedPlace } from "./savedPlaces";

export const SAVED_PLACE_LABEL_MAX_LENGTH = 80;

export type SavedPlaceLabelUpdateRequest = {
  label: string;
  favorite: boolean;
};

export function defaultSavedPlaceLabel(placeName: string) {
  return placeName.trim().slice(0, SAVED_PLACE_LABEL_MAX_LENGTH);
}

export function savedPlaceEditDraft(place: SavedPlace) {
  return savedPlaceTitle(place);
}

export function canSaveSavedPlaceLabel(place: SavedPlace, draft: string, savingPlaceId: string | null = null) {
  if (savingPlaceId === place.id) {
    return false;
  }

  const label = draft.trim();
  return Boolean(label) && label !== savedPlaceTitle(place);
}

export function savedPlaceLabelUpdateRequest(
  place: SavedPlace,
  draft: string
): SavedPlaceLabelUpdateRequest | null {
  if (!canSaveSavedPlaceLabel(place, draft)) {
    return null;
  }

  return {
    label: draft.trim(),
    favorite: place.favorite
  };
}
