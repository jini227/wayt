import {
  TRAVEL_MODE_OPTIONS,
  defaultTravelModeSelection,
  initialTravelModeSelection,
  isTravelMode,
  participantTravelModeBadge,
  travelModeEtaHint,
  travelModeLabel,
  travelModeToNaverRoutePath
} from "./travelMode";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}

assertDeepEqual(
  TRAVEL_MODE_OPTIONS.map((option) => option.value),
  ["TRANSIT", "CAR", "WALK", "BICYCLE"],
  "travel mode options include every supported routing mode"
);

assertEqual(travelModeLabel("TRANSIT"), "대중교통", "transit gets a Korean label");
assertEqual(travelModeLabel("CAR"), "자차", "car gets a Korean label");
assertEqual(travelModeLabel("WALK"), "도보", "walk gets a Korean label");
assertEqual(travelModeLabel("BICYCLE"), "자전거", "bicycle gets a Korean label");

assertEqual(travelModeToNaverRoutePath("TRANSIT"), "public", "transit opens Naver public route");
assertEqual(travelModeToNaverRoutePath("CAR"), "car", "car opens Naver car route");
assertEqual(travelModeToNaverRoutePath("WALK"), "walk", "walk opens Naver walk route");
assertEqual(travelModeToNaverRoutePath("BICYCLE"), "bicycle", "bicycle opens Naver bicycle route");

assertEqual(initialTravelModeSelection("CAR"), "CAR", "profile default seeds appointment selection");
assertEqual(initialTravelModeSelection(null), "TRANSIT", "missing profile default falls back to transit for one-time selection");
assertEqual(defaultTravelModeSelection("CAR"), "CAR", "saved default keeps a selected mode active");
assertEqual(defaultTravelModeSelection(null), null, "missing saved default keeps the skip choice active");
assertEqual(isTravelMode("BICYCLE"), true, "bicycle is a valid travel mode");
assertEqual(isTravelMode("UNKNOWN"), false, "unknown is not a selectable travel mode");
assertDeepEqual(
  participantTravelModeBadge("TRANSIT"),
  {
    mode: "TRANSIT",
    accessibilityLabel: `${travelModeLabel("TRANSIT")} 이동수단`
  },
  "known participant travel modes expose compact badge metadata"
);
assertEqual(
  participantTravelModeBadge("UNKNOWN"),
  null,
  "unknown participant travel modes do not render a badge"
);
assertEqual(
  travelModeEtaHint({ mode: "TRANSIT", locationPublic: false, hasEta: false }),
  "위치 공개 후 대중교통 기준 예상 시간이 표시돼요.",
  "private location hint makes the delayed timing explicit"
);
assertEqual(
  travelModeEtaHint({ mode: "CAR", locationPublic: true, hasEta: false }),
  "자차 기준 예상 시간을 준비하고 있어요.",
  "public location hint avoids promising an immediate result before ETA exists"
);
assertEqual(
  travelModeEtaHint({ mode: "WALK", locationPublic: true, hasEta: true }),
  "도보 기준 예상 시간이 참가자 카드에 표시돼요.",
  "available ETA hint tells users where to see the result"
);
