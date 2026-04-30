export type SavedPlace = {
  id: string;
  label: string;
  placeName: string;
  latitude: number;
  longitude: number;
  favorite: boolean;
  lastUsedAt: string | null;
  useCount: number;
};

export type SelectedPlaceLike = {
  address?: string;
  latitude: number;
  longitude: number;
};

const COORDINATE_EPSILON = 0.000001;

export function savedPlaceTitle(place: SavedPlace) {
  const label = place.label.trim();
  return label || place.placeName;
}

export function savedPlaceCountLabel(count: number) {
  return `내 장소 ${count}곳`;
}

export function savedPlaceMetaLabel(place: SavedPlace) {
  return place.useCount > 0 ? `최근 사용 ${place.useCount}회` : "아직 약속에 사용 전";
}

export function favoriteSavedPlaces(places: readonly SavedPlace[]) {
  return sortSavedPlacesForPicker(places).filter((place) => place.favorite);
}

export function recentSavedPlaces(places: readonly SavedPlace[]) {
  return [...places]
    .filter((place) => place.useCount > 0)
    .sort((a, b) => {
      const aUsed = timestampValue(a.lastUsedAt);
      const bUsed = timestampValue(b.lastUsedAt);
      if (aUsed !== bUsed) {
        return bUsed - aUsed;
      }

      return savedPlaceTitle(a).localeCompare(savedPlaceTitle(b), "ko-KR");
    });
}

export function sortSavedPlacesForPicker(places: readonly SavedPlace[]) {
  return [...places].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1;
    }

    const aUsed = timestampValue(a.lastUsedAt);
    const bUsed = timestampValue(b.lastUsedAt);
    if (aUsed !== bUsed) {
      return bUsed - aUsed;
    }

    return savedPlaceTitle(a).localeCompare(savedPlaceTitle(b), "ko-KR");
  });
}

export function isSelectedSavedPlace(place: SavedPlace, selectedPlace: SelectedPlaceLike | null) {
  if (!selectedPlace?.address) {
    return false;
  }

  return (
    place.placeName === selectedPlace.address &&
    Math.abs(place.latitude - selectedPlace.latitude) <= COORDINATE_EPSILON &&
    Math.abs(place.longitude - selectedPlace.longitude) <= COORDINATE_EPSILON
  );
}

export function mergeSavedPlace(places: readonly SavedPlace[], savedPlace: SavedPlace) {
  return [savedPlace, ...places.filter((place) => place.id !== savedPlace.id)];
}

function timestampValue(value: string | null) {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
