import { kakaoAuthResponseFromQuery } from "./kakaoAuthResult";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertThrows(fn: () => unknown, expectedMessage: string, message: string) {
  try {
    fn();
  } catch (error) {
    const actual = error instanceof Error ? error.message : String(error);
    if (actual.includes(expectedMessage)) {
      return;
    }
    throw new Error(`${message}: expected error containing ${expectedMessage}, got ${actual}`);
  }

  throw new Error(`${message}: expected function to throw`);
}

const auth = kakaoAuthResponseFromQuery({
  accessToken: "access-token",
  refreshToken: "refresh-token",
  userId: "user-1",
  waytId: "@minsu",
  nickname: "Minsu",
  avatarUrl: "",
  defaultTravelMode: "TRANSIT",
  travelModeOnboardingCompleted: "true"
});

assertEqual(auth.accessToken, "access-token", "access token is parsed");
assertEqual(auth.refreshToken, "refresh-token", "refresh token is parsed");
assertEqual(auth.user.id, "user-1", "user id is parsed");
assertEqual(auth.user.defaultTravelMode, "TRANSIT", "travel mode is parsed when valid");
assertEqual(auth.user.travelModeOnboardingCompleted, true, "onboarding completion is parsed");
assertEqual(auth.user.avatarUrl, undefined, "blank avatar urls are omitted");

assertThrows(
  () => kakaoAuthResponseFromQuery({ error: "access_denied", errorDescription: "User cancelled" }),
  "User cancelled",
  "Kakao error query throws its description"
);
assertThrows(
  () => kakaoAuthResponseFromQuery({ accessToken: "access-token", refreshToken: "", userId: "user-1" }),
  "Kakao login response is missing required data",
  "missing required auth data throws"
);
