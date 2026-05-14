import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { env } from "../config/env";
import { isTravelMode, type TravelMode } from "../travel/travelMode";
import { deleteAuthItem, getAuthItem, setAuthItem } from "./authStorage";
import { createWebKakaoReturnUri, currentWebLocation } from "./kakaoReturnUri";

WebBrowser.maybeCompleteAuthSession();

type WaytUser = {
  id: string;
  waytId: string;
  nickname: string;
  avatarUrl?: string;
  subscriptionTier?: string;
  defaultTravelMode?: TravelMode | null;
  travelModeOnboardingCompleted?: boolean;
};

type AuthResponse = {
  user: WaytUser;
  accessToken: string;
  refreshToken: string;
};

type ProfileUpdate = {
  nickname?: string;
  defaultTravelMode?: TravelMode | null;
  travelModeOnboardingCompleted?: boolean;
};

type AvatarUpload = {
  uri: string;
  name: string;
  type: string;
};

type AuthContextValue = {
  user: WaytUser | null;
  loading: boolean;
  signInWithKakao: () => Promise<boolean>;
  updateProfile: (profile: ProfileUpdate) => Promise<WaytUser>;
  uploadAvatar: (avatar: AvatarUpload) => Promise<WaytUser>;
  deleteAvatar: () => Promise<WaytUser>;
  signOut: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = "wayt.accessToken";
const REFRESH_TOKEN_KEY = "wayt.refreshToken";
const USER_KEY = "wayt.user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WaytUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const [storedUser, accessToken] = await Promise.all([
          getAuthItem(USER_KEY),
          getAuthItem(ACCESS_TOKEN_KEY)
        ]);

        if (!storedUser || !accessToken) {
          await clearStoredAuth();
          return;
        }

        const response = await fetch(`${env.apiBaseUrl}/auth/session`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          await clearStoredAuth();
          return;
        }

        const sessionUser = (await response.json()) as WaytUser;
        await setAuthItem(USER_KEY, JSON.stringify(sessionUser));
        if (mounted) {
          setUser(sessionUser);
        }
      } catch {
        await clearStoredAuth();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithKakao = useCallback(async () => {
    setLoading(true);
    try {
      const returnUri = createKakaoReturnUri();
      const authUrl = `${env.apiBaseUrl}/auth/kakao/authorize?returnUri=${encodeURIComponent(returnUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUri);

      if (result.type !== "success") {
        return false;
      }

      const parsed = Linking.parse(result.url);
      const query = parsed.queryParams ?? {};

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

      await setAuthItem(ACCESS_TOKEN_KEY, auth.accessToken);
      await setAuthItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      await setAuthItem(USER_KEY, JSON.stringify(auth.user));
      setUser(auth.user);
      return true;
    } catch (error) {
      await clearStoredAuth();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await clearStoredAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profile: ProfileUpdate) => {
    const accessToken = await requireAccessToken();

    const response = await fetch(`${env.apiBaseUrl}/me/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profileUpdatePayload(profile))
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "Profile update failed");
    }

    const updatedUser = (await response.json()) as WaytUser;
    await setAuthItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const uploadAvatar = useCallback(async (avatar: AvatarUpload) => {
    const accessToken = await requireAccessToken();
    const formData = new FormData();
    formData.append("file", {
      uri: avatar.uri,
      name: avatar.name,
      type: avatar.type
    } as unknown as Blob);

    const response = await fetch(`${env.apiBaseUrl}/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "Profile image upload failed");
    }

    const updatedUser = (await response.json()) as WaytUser;
    await setAuthItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const deleteAvatar = useCallback(async () => {
    const accessToken = await requireAccessToken();
    const response = await fetch(`${env.apiBaseUrl}/me/avatar`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "Profile image delete failed");
    }

    const updatedUser = (await response.json()) as WaytUser;
    await setAuthItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithKakao,
      updateProfile,
      uploadAvatar,
      deleteAvatar,
      signOut
    }),
    [deleteAvatar, loading, signInWithKakao, signOut, updateProfile, uploadAvatar, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
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

function profileUpdatePayload(profile: ProfileUpdate) {
  const payload: Record<string, unknown> = {};
  if (profile.nickname !== undefined) {
    payload.nickname = profile.nickname;
  }
  if (profile.defaultTravelMode !== undefined) {
    payload.defaultTravelMode = profile.defaultTravelMode;
  }
  if (profile.travelModeOnboardingCompleted !== undefined) {
    payload.travelModeOnboardingCompleted = profile.travelModeOnboardingCompleted;
  }
  return payload;
}

async function clearStoredAuth() {
  await deleteAuthItem(ACCESS_TOKEN_KEY);
  await deleteAuthItem(REFRESH_TOKEN_KEY);
  await deleteAuthItem(USER_KEY);
}

async function requireAccessToken() {
  const accessToken = await getAuthItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    await clearStoredAuth();
    throw new Error("Login is required");
  }
  return accessToken;
}

function createKakaoReturnUri() {
  return createWebKakaoReturnUri(currentWebLocation()) ?? Linking.createURL("auth/kakao");
}
