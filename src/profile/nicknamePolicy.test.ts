import {
  NICKNAME_MAX_LENGTH,
  getProfileNicknameViewModel,
  normalizeNicknameDraft
} from "./nicknamePolicy";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(value: boolean, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

assertEqual(NICKNAME_MAX_LENGTH, 6, "nickname limit");
assertEqual(normalizeNicknameDraft("1234567"), "123456", "draft nickname is capped at six characters");
assertEqual(normalizeNicknameDraft("  민수  "), "민수", "draft nickname is trimmed");

const changedViewModel = getProfileNicknameViewModel({
  savedNickname: "민수",
  draftNickname: "지윤"
});

assertEqual(changedViewModel.headerNickname, "민수", "header nickname stays on the saved nickname");
assertEqual(changedViewModel.draftNickname, "지윤", "draft nickname keeps the edited value");
assertTrue(changedViewModel.hasNicknameChanges, "draft changes enable saving");

const unchangedViewModel = getProfileNicknameViewModel({
  savedNickname: "민수",
  draftNickname: " 민수 "
});

assertEqual(unchangedViewModel.headerNickname, "민수", "header nickname uses saved nickname when unchanged");
assertTrue(!unchangedViewModel.hasNicknameChanges, "trimmed matching draft does not enable saving");
