import { createHistoryDetailViewModel } from "./historyDetailViewModel";

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

const viewModel = createHistoryDetailViewModel({
  id: "appointment-api-id",
  title: "API dinner",
  placeName: "Gangnam Station",
  scheduledAt: "2026-05-01T19:30:00+09:00",
  penalty: "Late person buys coffee",
  memo: "Second round nearby",
  myRole: "HOST",
  participants: [
    {
      id: "participant-on-time",
      userId: "user-on-time",
      name: "Mina",
      waytId: "@mina",
      avatarUrl: "",
      role: "HOST",
      status: "ARRIVED",
      arrivedAt: "2026-05-01T19:26:00+09:00",
      punctuality: "ON_TIME",
      lateMinutes: 0
    },
    {
      id: "participant-late",
      userId: "user-late",
      name: "Jun",
      waytId: "@jun",
      avatarUrl: "",
      role: "PARTICIPANT",
      status: "LATE_CONFIRMED",
      arrivedAt: "2026-05-01T19:42:00+09:00",
      punctuality: "LATE",
      lateMinutes: 7
    },
    {
      id: "participant-removed",
      userId: "user-removed",
      name: "Removed",
      waytId: "@removed",
      avatarUrl: "",
      role: "PARTICIPANT",
      membershipStatus: "REMOVED",
      status: "WAITING",
      arrivedAt: null,
      punctuality: null,
      lateMinutes: null,
      removedAt: "2026-05-01T19:10:00+09:00",
      removedByName: "Mina"
    }
  ],
  statusLogs: [
    {
      id: "log-late",
      participantId: "participant-late",
      participantName: "Jun",
      message: "running late",
      createdAt: "2026-05-01T19:31:00+09:00"
    }
  ]
});

assertEqual(viewModel.id, "appointment-api-id", "history detail uses the selected API appointment id");
assertEqual(viewModel.title, "API dinner", "history detail uses the selected API appointment title");
assertEqual(viewModel.roleLabel, "\uBC29\uC7A5", "HOST role is shown as host label");
assertEqual(viewModel.place, "Gangnam Station", "history detail uses the API place");
assertEqual(viewModel.participants.length, 3, "history detail shows API participants");
assertEqual(viewModel.participants[1].name, "Jun", "late participant comes from API data");
assertEqual(viewModel.participants[1].result, "\uC9C0\uAC01", "late participant is marked late");
assertTrue(viewModel.penaltyTarget.includes("Jun"), "penalty target is derived from late API participants");
assertEqual(viewModel.statusLogs[0].text, "Jun running late", "status logs come from API data");
assertEqual(viewModel.statusLogs[0].time, "\uC624\uD6C4 7:31", "status log times use the same Korean AM/PM format as appointment times");
assertEqual((viewModel.statusLogs[0] as { tone?: string }).tone, "danger", "late status logs use danger tone");
assertEqual(viewModel.participants[2].result, "\uC0AD\uC81C\uB428", "removed participants are marked as removed in history");
assertEqual(viewModel.participants[2].arrival, "Mina\uB2D8\uC774 \uC0AD\uC81C", "history shows who removed the participant");

const staleLikelyLateStatusViewModel = createHistoryDetailViewModel({
  id: "appointment-stale-status",
  title: "Late status cleared by arrival result",
  placeName: "AK Plaza",
  scheduledAt: "2026-04-30T01:00:00+09:00",
  penalty: "Test penalty",
  memo: "",
  myRole: "HOST",
  participants: [
    {
      id: "participant-stale-status",
      userId: "user-stale-status",
      name: "Hyo",
      waytId: "@hyo",
      avatarUrl: "",
      role: "HOST",
      status: "LIKELY_LATE",
      arrivedAt: "2026-04-29T22:47:53+09:00",
      punctuality: "ON_TIME",
      lateMinutes: 0
    }
  ],
  statusLogs: []
});

assertEqual(
  staleLikelyLateStatusViewModel.participants[0].result,
  "\uC815\uC2DC",
  "final on-time arrival result overrides stale likely-late status"
);
assertEqual(
  staleLikelyLateStatusViewModel.penaltyTarget,
  "\uB300\uC0C1 \uC5C6\uC74C",
  "stale likely-late status is not treated as a penalty target after on-time arrival"
);

const noPenaltyViewModel = createHistoryDetailViewModel({
  id: "appointment-no-penalty",
  title: "No penalty dinner",
  placeName: "Hongdae",
  scheduledAt: "2026-05-02T19:30:00+09:00",
  penalty: "X",
  memo: "",
  myRole: "PARTICIPANT",
  participants: [
    {
      id: "participant-late-no-penalty",
      userId: "user-late-no-penalty",
      name: "Late without penalty",
      waytId: "@late-no-penalty",
      avatarUrl: "",
      role: "PARTICIPANT",
      status: "LATE_CONFIRMED",
      arrivedAt: "2026-05-02T19:40:00+09:00",
      punctuality: "LATE",
      lateMinutes: 10
    }
  ],
  statusLogs: []
});

assertEqual(noPenaltyViewModel.penalty, "\uBC8C\uCE59 \uC5C6\uC74C", "X penalty marker is displayed as no penalty");
assertEqual(noPenaltyViewModel.penaltyTarget, "\uB300\uC0C1 \uC5C6\uC74C", "no-penalty appointments do not show late participants as penalty targets");
