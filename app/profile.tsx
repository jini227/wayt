import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell, Check, ChevronRight, Copy, ImageIcon, LogOut, MapPin, Trash2, UserRound, UsersRound } from "lucide-react-native";
import { AppScreen } from "../src/components/AppScreen";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { Header, InfoCard } from "../src/components/Cards";
import { Avatar } from "../src/components/Avatar";
import { apiGetAuthenticated } from "../src/api/client";
import { addressBookCountLabel } from "../src/addressBook/addressBook";
import type { AddressBookEntry } from "../src/appointments/invite";
import { useAuth } from "../src/auth/AuthContext";
import { useAppFeedback } from "../src/feedback/AppFeedback";
import { notificationGroups, notificationSummaryLabel } from "../src/notifications/notificationCatalog";
import { savedPlaceCountLabel, type SavedPlace } from "../src/places/savedPlaces";
import {
  getProfileNicknameViewModel,
  NICKNAME_MAX_LENGTH,
  normalizeNicknameDraft
} from "../src/profile/nicknamePolicy";
import { TravelModeChoiceGrid } from "../src/travel/TravelModeChoiceGrid";
import { defaultTravelModeSelection, travelModeLabel, type TravelMode } from "../src/travel/travelMode";
import { colors, spacing } from "../src/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, uploadAvatar, deleteAvatar, signOut } = useAuth();
  const { showToast, showDialog } = useAppFeedback();
  const [nickname, setNickname] = useState(() => normalizeNicknameDraft(user?.nickname ?? ""));
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [travelSaving, setTravelSaving] = useState(false);
  const [addressBookCount, setAddressBookCount] = useState<number | null>(null);
  const [savedPlaceCount, setSavedPlaceCount] = useState<number | null>(null);
  const notificationSummary = notificationSummaryLabel(notificationGroups);

  useEffect(() => {
    setNickname(normalizeNicknameDraft(user?.nickname ?? ""));
  }, [user?.nickname]);

  useFocusEffect(useCallback(() => {
    if (!user) {
      setAddressBookCount(null);
      setSavedPlaceCount(null);
      return undefined;
    }

    let cancelled = false;
    apiGetAuthenticated<AddressBookEntry[]>("/address-book")
      .then((items) => {
        if (!cancelled) {
          setAddressBookCount(items.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddressBookCount(null);
        }
      });
    apiGetAuthenticated<SavedPlace[]>("/places")
      .then((items) => {
        if (!cancelled) {
          setSavedPlaceCount(items.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedPlaceCount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]));

  const nicknameViewModel = useMemo(
    () =>
      getProfileNicknameViewModel({
        savedNickname: user?.nickname,
        draftNickname: nickname
      }),
    [nickname, user?.nickname]
  );
  const trimmedNickname = nicknameViewModel.draftNickname;
  const currentNickname = nicknameViewModel.headerNickname;
  const hasNicknameChanges = nicknameViewModel.hasNicknameChanges;

  const handleCopyWaytId = async () => {
    if (!user?.waytId) {
      return;
    }
    await Clipboard.setStringAsync(user.waytId);
    showToast({ title: "고유 아이디를 복사했어요." });
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showDialog({
        title: "사진 접근 권한이 필요해요.",
        message: "프로필 사진을 선택하려면 사진 앱 접근을 허용해 주세요.",
        tone: "warning"
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setAvatarSaving(true);
    try {
      await uploadAvatar({
        uri: asset.uri,
        name: asset.fileName ?? `profile.${extensionFromUri(asset.uri)}`,
        type: asset.mimeType ?? mimeTypeFromUri(asset.uri)
      });
      showToast({ title: "프로필 사진을 바꿨어요." });
    } catch (error) {
      showDialog({
        title: "사진을 바꾸지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setAvatarSaving(false);
    }
  };

  const deleteAvatarNow = async () => {
    setAvatarSaving(true);
    try {
      await deleteAvatar();
      showToast({ title: "프로필 사진을 삭제했어요." });
    } catch (error) {
      showDialog({
        title: "사진을 삭제하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleDeleteAvatar = () => {
    if (!user?.avatarUrl || avatarSaving) {
      return;
    }

    showDialog({
      title: "프로필 사진을 삭제할까요?",
      message: "현재 사진이 기본 아바타로 돌아가요.",
      tone: "danger",
      actions: [
        { label: "취소", role: "cancel" },
        { label: "삭제", role: "destructive", onPress: () => void deleteAvatarNow() }
      ]
    });
  };

  const handleSave = async () => {
    if (!trimmedNickname) {
      showToast({ title: "닉네임을 입력해 주세요.", tone: "warning" });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ nickname: trimmedNickname });
      showToast({ title: "닉네임을 저장했어요." });
    } catch (error) {
      showDialog({
        title: "저장하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTravelModeSave = async (mode: TravelMode | null) => {
    if (travelSaving) {
      return;
    }

    setTravelSaving(true);
    try {
      await updateProfile({
        defaultTravelMode: mode,
        travelModeOnboardingCompleted: true
      });
      showToast({ title: mode ? "기본 이동수단을 저장했어요." : "기본 이동수단을 비워뒀어요." });
    } catch (error) {
      showDialog({
        title: "이동수단을 저장하지 못했어요.",
        message: error instanceof Error ? error.message : undefined,
        tone: "danger"
      });
    } finally {
      setTravelSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <>
      <AppScreen withTabs>
        <Header title="내 정보" />

        <InfoCard>
          <View style={styles.profileRow}>
            <Avatar uri={user?.avatarUrl} name={currentNickname || "W"} accent={colors.primary} size={72} />
            <View style={styles.profileText}>
              <Text style={styles.name}>{currentNickname || "Wayt 사용자"}</Text>
              <View style={styles.handleRow}>
                <Text style={styles.handle}>{user?.waytId ?? "@wayt"}</Text>
                <Pressable onPress={handleCopyWaytId} style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
                  <Copy color={colors.primary} size={19} strokeWidth={2.4} />
                </Pressable>
              </View>
            </View>
          </View>
        </InfoCard>

        <InfoCard style={styles.cardGap}>
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <UserRound color={colors.primary} size={22} strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>닉네임</Text>
            </View>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={nickname}
                onChangeText={(value) => setNickname(normalizeNicknameDraft(value))}
                placeholder="닉네임"
                placeholderTextColor={colors.textSubtle}
                maxLength={NICKNAME_MAX_LENGTH}
                style={[styles.input, styles.inlineInput]}
                autoCapitalize="none"
              />
              <Pressable
                onPress={handleSave}
                disabled={!hasNicknameChanges || saving}
                style={({ pressed }) => [
                  styles.squareActionButton,
                  styles.saveActionButton,
                  pressed && !saving && styles.pressed,
                  (!hasNicknameChanges || saving) && styles.disabled
                ]}
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Check color="#FFFFFF" size={22} strokeWidth={2.7} />}
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <ImageIcon color={colors.primary} size={22} strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>프로필 사진</Text>
            </View>
            <View style={styles.avatarActions}>
              <Pressable
                onPress={handlePickAvatar}
                disabled={avatarSaving}
                style={({ pressed }) => [styles.secondaryButton, pressed && !avatarSaving && styles.pressed, avatarSaving && styles.disabled]}
              >
                {avatarSaving ? <ActivityIndicator color={colors.primary} /> : <ImageIcon color={colors.primary} size={20} strokeWidth={2.4} />}
                <Text style={styles.secondaryButtonText}>사진 선택</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteAvatar}
                disabled={!user?.avatarUrl || avatarSaving}
                accessibilityRole="button"
                accessibilityLabel="프로필 사진 삭제"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  styles.squareActionButton,
                  styles.deleteActionButton,
                  pressed && !avatarSaving && styles.pressed,
                  (!user?.avatarUrl || avatarSaving) && styles.disabled
                ]}
              >
                <Trash2 color={colors.danger} size={20} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

        </InfoCard>

        <InfoCard style={styles.cardGap}>
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <MapPin color={colors.primary} size={22} strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>기본 이동수단</Text>
            </View>
            <Text style={styles.fieldHint}>
              {user?.defaultTravelMode ? travelModeLabel(user.defaultTravelMode) : "약속마다 선택"}
            </Text>
            <TravelModeChoiceGrid
              selected={defaultTravelModeSelection(user?.defaultTravelMode)}
              onSelect={(mode) => void handleTravelModeSave(mode)}
              includeSkip
              onSkip={() => void handleTravelModeSave(null)}
              disabled={travelSaving}
            />
          </View>
        </InfoCard>

        <InfoCard style={styles.cardGap}>
          <Pressable
            onPress={() => router.push("/address-book")}
            style={({ pressed }) => [styles.shortcutRow, styles.shortcutBorder, pressed && styles.pressed]}
          >
            <UsersRound color={colors.primary} size={22} strokeWidth={2.2} />
            <Text style={styles.shortcutLabel}>주소록</Text>
            <Text style={styles.shortcutValue}>
              {addressBookCount === null ? "빠른 초대" : addressBookCountLabel(addressBookCount)}
            </Text>
            <ChevronRight color={colors.textSubtle} size={22} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/places")}
            style={({ pressed }) => [styles.shortcutRow, styles.shortcutBorder, pressed && styles.pressed]}
          >
            <MapPin color={colors.primary} size={22} strokeWidth={2.2} />
            <Text style={styles.shortcutLabel}>내 장소</Text>
            <Text style={styles.shortcutValue}>
              {savedPlaceCount === null ? "즐겨찾는 장소" : savedPlaceCountLabel(savedPlaceCount)}
            </Text>
            <ChevronRight color={colors.textSubtle} size={22} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [styles.shortcutRow, pressed && styles.pressed]}
          >
            <Bell color={colors.primary} size={22} strokeWidth={2.2} />
            <Text style={styles.shortcutLabel}>알림</Text>
            <Text style={styles.shortcutValue}>{notificationSummary}</Text>
            <ChevronRight color={colors.textSubtle} size={22} strokeWidth={2.2} />
          </Pressable>
        </InfoCard>

        <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
          <LogOut color={colors.danger} size={20} strokeWidth={2.4} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </AppScreen>
      <BottomTabBar />
    </>
  );
}

function extensionFromUri(uri: string) {
  const cleanUri = uri.split("?")[0] ?? uri;
  const extension = cleanUri.split(".").pop()?.toLowerCase();
  return extension && ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension) ? extension : "jpg";
}

function mimeTypeFromUri(uri: string) {
  const extension = extensionFromUri(uri);
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }
  if (extension === "heic") {
    return "image/heic";
  }
  if (extension === "heif") {
    return "image/heif";
  }
  return "image/jpeg";
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  profileText: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900"
  },
  handleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  handle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
    flexShrink: 1
  },
  copyButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  cardGap: {
    marginTop: 18
  },
  shortcutRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  shortcutBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
    paddingBottom: 4
  },
  shortcutLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  shortcutValue: {
    marginLeft: "auto",
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "800"
  },
  field: {
    gap: 9,
    paddingBottom: 16
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    paddingHorizontal: 14
  },
  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  inlineInput: {
    flex: 1
  },
  squareActionButton: {
    width: 48,
    height: 44,
    borderRadius: 12,
    flex: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  saveActionButton: {
    backgroundColor: colors.primary,
    ...spacing.shadow
  },
  avatarActions: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flex: 1
  },
  deleteActionButton: {
    borderColor: "#FFD1CD",
    backgroundColor: colors.dangerSoft
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900"
  },
  logout: {
    height: 46,
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD1CD",
    backgroundColor: colors.dangerSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  logoutText: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
