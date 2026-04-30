export type TravelMode = "TRANSIT" | "CAR" | "WALK" | "BICYCLE";
export type ApiTravelMode = TravelMode | "UNKNOWN";

export const TRAVEL_MODE_OPTIONS: readonly { value: TravelMode; label: string }[] = [
  { value: "TRANSIT", label: "대중교통" },
  { value: "CAR", label: "자차" },
  { value: "WALK", label: "도보" },
  { value: "BICYCLE", label: "자전거" }
];

export function isTravelMode(value: unknown): value is TravelMode {
  return TRAVEL_MODE_OPTIONS.some((option) => option.value === value);
}

export type ParticipantTravelModeBadge = {
  mode: TravelMode;
  accessibilityLabel: string;
};

export function participantTravelModeBadge(mode: ApiTravelMode | null | undefined): ParticipantTravelModeBadge | null {
  if (!isTravelMode(mode)) {
    return null;
  }

  return {
    mode,
    accessibilityLabel: `${travelModeLabel(mode)} 이동수단`
  };
}

export function travelModeLabel(mode: ApiTravelMode | null | undefined) {
  const option = TRAVEL_MODE_OPTIONS.find((item) => item.value === mode);
  return option?.label ?? "대중교통";
}

export function travelModeEtaHint({
  mode,
  locationPublic,
  hasEta
}: {
  mode: ApiTravelMode | null | undefined;
  locationPublic: boolean;
  hasEta: boolean;
}) {
  const label = travelModeLabel(mode);
  if (!locationPublic) {
    return `위치 공개 후 ${label} 기준 예상 시간이 표시돼요.`;
  }
  if (!hasEta) {
    return `${label} 기준 예상 시간을 준비하고 있어요.`;
  }
  return `${label} 기준 예상 시간이 참가자 카드에 표시돼요.`;
}

export function initialTravelModeSelection(mode: ApiTravelMode | null | undefined): TravelMode {
  return isTravelMode(mode) ? mode : "TRANSIT";
}

export function defaultTravelModeSelection(mode: ApiTravelMode | null | undefined): TravelMode | null {
  return isTravelMode(mode) ? mode : null;
}

export function travelModeToNaverRoutePath(mode: ApiTravelMode | null | undefined) {
  switch (initialTravelModeSelection(mode)) {
    case "CAR":
      return "car";
    case "WALK":
      return "walk";
    case "BICYCLE":
      return "bicycle";
    case "TRANSIT":
      return "public";
  }
}

export function buildNaverRouteUrl({
  mode,
  destinationLatitude,
  destinationLongitude,
  destinationName,
  appName = "com.hyozk.wayt"
}: {
  mode: ApiTravelMode | null | undefined;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationName?: string | null;
  appName?: string;
}) {
  const params = new URLSearchParams({
    dlat: String(destinationLatitude),
    dlng: String(destinationLongitude),
    appname: appName
  });
  if (destinationName?.trim()) {
    params.set("dname", destinationName.trim());
  }
  return `nmap://route/${travelModeToNaverRoutePath(mode)}?${params.toString()}`;
}
