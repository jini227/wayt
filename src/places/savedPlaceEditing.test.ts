import {
  SAVED_PLACE_LABEL_MAX_LENGTH,
  canSaveSavedPlaceLabel,
  defaultSavedPlaceLabel,
  savedPlaceEditDraft,
  savedPlaceLabelUpdateRequest
} from "./savedPlaceEditing";
import type { SavedPlace } from "./savedPlaces";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const place: SavedPlace = {
  id: "home",
  label: "울집",
  placeName: "경기도 안양시 동안구 평촌동",
  latitude: 37.39,
  longitude: 126.95,
  favorite: true,
  lastUsedAt: null,
  useCount: 0
};

assertEqual(SAVED_PLACE_LABEL_MAX_LENGTH, 80, "saved place labels follow the backend column limit");
assertEqual(savedPlaceEditDraft(place), "울집", "editing starts from the display label");
assertEqual(defaultSavedPlaceLabel(` ${"가".repeat(90)} `), "가".repeat(80), "default labels are trimmed and capped");
assertEqual(
  savedPlaceEditDraft({ ...place, label: "   " }),
  "경기도 안양시 동안구 평촌동",
  "editing falls back to the place name when the label is empty"
);

assertEqual(canSaveSavedPlaceLabel(place, "울집"), false, "unchanged labels cannot be saved");
assertEqual(canSaveSavedPlaceLabel(place, "   "), false, "blank labels cannot be saved");
assertEqual(canSaveSavedPlaceLabel(place, "회사"), true, "changed nonblank labels can be saved");
assertEqual(canSaveSavedPlaceLabel(place, "회사", "home"), false, "the label cannot be saved while the same place is saving");
assertEqual(canSaveSavedPlaceLabel(place, "회사", "other"), true, "other saving rows do not block this edit");

const request = savedPlaceLabelUpdateRequest(place, "  회사  ");
assert(request !== null, "changed labels produce an update request");
assertEqual(request?.label, "회사", "saved place label updates are trimmed");
assertEqual(request?.favorite, true, "saved place label updates preserve the favorite flag");
assertEqual(savedPlaceLabelUpdateRequest(place, "울집"), null, "unchanged labels produce no update request");
assertEqual(savedPlaceLabelUpdateRequest(place, "   "), null, "blank labels produce no update request");
