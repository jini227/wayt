import {
  favoriteSavedPlaces,
  isSelectedSavedPlace,
  mergeSavedPlace,
  recentSavedPlaces,
  savedPlaceCountLabel,
  savedPlaceMetaLabel,
  savedPlaceTitle,
  sortSavedPlacesForPicker,
  type SavedPlace
} from "./savedPlaces";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const places: SavedPlace[] = [
  {
    id: "recent-old",
    label: "오래된 최근",
    placeName: "서울역 3번 출구",
    latitude: 37.5547,
    longitude: 126.9706,
    favorite: false,
    lastUsedAt: "2026-04-01T09:00:00+09:00",
    useCount: 1
  },
  {
    id: "favorite",
    label: "회사",
    placeName: "강남역 10번 출구",
    latitude: 37.497952,
    longitude: 127.027619,
    favorite: true,
    lastUsedAt: null,
    useCount: 0
  },
  {
    id: "recent-new",
    label: "최근",
    placeName: "홍대입구역 9번 출구",
    latitude: 37.557192,
    longitude: 126.924634,
    favorite: false,
    lastUsedAt: "2026-04-28T20:00:00+09:00",
    useCount: 2
  }
];

assertEqual(
  sortSavedPlacesForPicker(places).map((place) => place.id).join(","),
  "favorite,recent-new,recent-old",
  "saved place picker puts favorites first, then recent places"
);

assertEqual(savedPlaceTitle({ ...places[0], label: "" }), "서울역 3번 출구", "empty labels fall back to place name");
assertEqual(savedPlaceTitle(places[1]), "회사", "saved place labels are shown before raw place names");

assertEqual(
  isSelectedSavedPlace(places[2], { address: "홍대입구역 9번 출구", latitude: 37.557192, longitude: 126.924634 }),
  true,
  "selected place matches saved place by name and coordinates"
);

assertEqual(
  mergeSavedPlace(places, { ...places[0], label: "서울역", favorite: true }).map((place) => place.id).join(","),
  "recent-old,favorite,recent-new",
  "merged saved place replaces the old row and moves it to the front"
);

assertEqual(savedPlaceCountLabel(0), "내 장소 0곳", "saved place count uses Korean place label");
assertEqual(savedPlaceCountLabel(3), "내 장소 3곳", "saved place count includes the number");

assertEqual(
  favoriteSavedPlaces(places).map((place) => place.id).join(","),
  "favorite",
  "favorite saved places only include starred places"
);

assertEqual(
  recentSavedPlaces(places).map((place) => place.id).join(","),
  "recent-new,recent-old",
  "recent saved places keep last-used ordering"
);

assertEqual(
  recentSavedPlaces([
    ...places,
    {
      id: "favorite-recent",
      label: "단골 카페",
      placeName: "합정역 5번 출구",
      latitude: 37.549,
      longitude: 126.914,
      favorite: true,
      lastUsedAt: "2026-04-29T12:00:00+09:00",
      useCount: 3
    }
  ]).map((place) => place.id).join(","),
  "favorite-recent,recent-new,recent-old",
  "recent saved places include favorited places and keep last-used ordering"
);

assertEqual(savedPlaceMetaLabel(places[1]), "아직 약속에 사용 전", "unused favorites show an unused state");
assertEqual(savedPlaceMetaLabel(places[2]), "최근 사용 2회", "used places show use count");
