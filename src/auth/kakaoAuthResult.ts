import { isTravelMode, type TravelMode } from "../travel/travelMode";

export type WaytUser = {
  id: string;
  waytId: string;
  nickname: string;
  avatarUrl?: string;
  subscriptionTier?: string;
  defaultTravelMode?: TravelMode | null;
  travelModeOnboardingCompleted?: boolean;
};

export type AuthResponse = {
  user: WaytUser;
  accessToken: string;
  refreshToken: string;
};

type KakaoAuthQuery = Record<string, string | string[] | undefined>;

export function kakaoAuthResponseFromQuery(query: KakaoAuthQuery): AuthResponse {
  if (query.error) {
    throw new Error(queryString(query.errorDescription) || queryString(query.error));
  }

  const auth: AuthResponse = {
    accessToken: queryString(query.accessToken),
    refreshToken: queryString(query.refreshToken),
    user: {
      id: queryString(query.userId),
      waytId: queryString(query.waytId),
      nickname: queryString(query.nickname),
      avatarUrl: queryString(query.avatarUrl) || undefined,
      defaultTravelMode: queryTravelMode(query.defaultTravelMode),
      travelModeOnboardingCompleted: queryString(query.travelModeOnboardingCompleted) === "true"
    }
  };

  if (!auth.accessToken || !auth.refreshToken || !auth.user.id) {
    throw new Error("Kakao login response is missing required data");
  }

  return auth;
}

function queryString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function queryTravelMode(value: string | string[] | undefined) {
  const mode = queryString(value);
  return isTravelMode(mode) ? mode : null;
}
