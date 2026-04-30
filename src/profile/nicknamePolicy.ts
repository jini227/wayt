export const NICKNAME_MAX_LENGTH = 6;

type ProfileNicknameInput = {
  savedNickname?: string | null;
  draftNickname: string;
};

export function normalizeNicknameDraft(nickname: string) {
  return Array.from(nickname.trim()).slice(0, NICKNAME_MAX_LENGTH).join("");
}

export function getProfileNicknameViewModel({ savedNickname, draftNickname }: ProfileNicknameInput) {
  const headerNickname = (savedNickname ?? "").trim();
  const normalizedDraftNickname = normalizeNicknameDraft(draftNickname);

  return {
    headerNickname,
    draftNickname: normalizedDraftNickname,
    hasNicknameChanges: normalizedDraftNickname !== headerNickname
  };
}
