import type { MapMarker } from "./MapSurface";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type DisplayMapFrameParams = {
  mode: "display";
  center: Coordinate;
  radiusMeters: number;
  participantMarkers: MapMarker[];
};

type PickerMapFrameParams = {
  mode: "picker";
  center: Coordinate;
  selectedPlace: Coordinate | null;
};

export type NaverMapFrameParams = DisplayMapFrameParams | PickerMapFrameParams;

export function createNaverMapFrameUrl(params: NaverMapFrameParams) {
  const query = new URLSearchParams();
  query.set("mode", params.mode);
  query.set("lat", String(params.center.latitude));
  query.set("lng", String(params.center.longitude));

  if (params.mode === "display") {
    query.set("radius", String(params.radiusMeters));
    query.set("markers", JSON.stringify(params.participantMarkers));
  } else if (params.selectedPlace) {
    query.set("selectedLat", String(params.selectedPlace.latitude));
    query.set("selectedLng", String(params.selectedPlace.longitude));
  }

  return `${webBasePath()}/naver-map-frame?${query.toString()}`;
}

function webBasePath() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.pathname === "/wayt" || window.location.pathname.startsWith("/wayt/") ? "/wayt" : "";
}
