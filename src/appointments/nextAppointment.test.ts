import {
  createNextAppointmentViewModel,
  selectNextAppointment
} from "./nextAppointment";

type TestAppointment = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  locationShareStartsAt: string;
  shareStartOffsetMinutes: number;
  penalty: string;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: Array<{
    id: string;
    userId?: string;
    name?: string;
    avatarUrl?: string | null;
    membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED" | null;
  }>;
};

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

const now = new Date("2026-05-01T12:00:00+09:00");

const appointments: TestAppointment[] = [
  {
    id: "later",
    title: "Later dinner",
    placeName: "Gangnam",
    scheduledAt: "2026-05-02T19:00:00+09:00",
    locationShareStartsAt: "2026-05-02T18:00:00+09:00",
    shareStartOffsetMinutes: 60,
    penalty: "No penalty",
    myRole: "PARTICIPANT",
    participants: [{ id: "me" }, { id: "friend" }]
  },
  {
    id: "past",
    title: "Past lunch",
    placeName: "Hongdae",
    scheduledAt: "2026-05-01T11:00:00+09:00",
    locationShareStartsAt: "2026-05-01T10:30:00+09:00",
    shareStartOffsetMinutes: 30,
    penalty: "No penalty",
    myRole: "HOST",
    participants: [{ id: "me" }]
  },
  {
    id: "soonest",
    title: "Coffee",
    placeName: "Seoul Station",
    scheduledAt: "2026-05-01T13:30:00+09:00",
    locationShareStartsAt: "2026-05-01T13:00:00+09:00",
    shareStartOffsetMinutes: 30,
    penalty: "Late person buys coffee",
    memo: "  Bring the reservation name  ",
    myRole: "HOST",
    participants: [
      { id: "participant-me", userId: "me", name: "나" },
      { id: "participant-minsu", userId: "minsu", name: "민수", avatarUrl: "https://example.com/minsu.png" },
      { id: "participant-jiyoon", userId: "jiyoon", name: "지윤" }
    ]
  }
];

const selected = selectNextAppointment(appointments, now);

assertEqual(selected?.id, "soonest", "selects the earliest future appointment regardless of API order");

const viewModel = createNextAppointmentViewModel(appointments[2], now);

assertEqual(viewModel.title, "Coffee", "view model keeps the selected appointment title");
assertEqual(viewModel.place, "Seoul Station", "view model keeps the selected appointment place");
assertEqual(viewModel.roleLabel, "\uBC29\uC7A5", "HOST role is labeled as host");
assertEqual(viewModel.countdownLabel, "\uC57D\uC18D\uAE4C\uC9C0 1\uC2DC\uAC04 30\uBD84", "countdown shows remaining time");
assertEqual(viewModel.shareLabel, "\uC704\uCE58 \uACF5\uC720 1\uC2DC\uAC04 \uB4A4 \uC2DC\uC791", "future location sharing explains when it starts");
assertEqual(viewModel.actionLabel, "\uC57D\uC18D \uBCF4\uAE30", "future appointment action opens the appointment");
assertEqual(viewModel.participantLabel, "3\uBA85", "participant count is formatted");
assertEqual(viewModel.participantAvatars.length, 3, "active participant avatars are exposed for the next appointment card");
assertEqual(viewModel.participantAvatars[1]?.id, "minsu", "participant avatar ids prefer the user id when present");
assertEqual(viewModel.participantAvatars[1]?.name, "민수", "participant avatar names are exposed");
assertEqual(viewModel.participantAvatars[1]?.avatarUrl, "https://example.com/minsu.png", "participant avatar urls are exposed");
assertEqual(viewModel.penaltyLabel, "\uBC8C\uCE59: Late person buys coffee", "meaningful penalties are shown");
assertEqual(viewModel.memoPreview, "Bring the reservation name", "memo preview is shown on the appointment tab");
assertEqual(viewModel.hasMemo, true, "appointment tab marks saved memo as visible");

const participantRoleViewModel = createNextAppointmentViewModel({
  ...appointments[2],
  myRole: "PARTICIPANT"
}, now);

assertEqual(participantRoleViewModel.roleLabel, null, "participant role does not expose a role mark");

const inactiveParticipantViewModel = createNextAppointmentViewModel({
  ...appointments[2],
  participants: [
    { id: "me", userId: "me", name: "나", membershipStatus: "ACTIVE" },
    { id: "left", userId: "left", name: "나간 사람", membershipStatus: "LEFT" },
    { id: "removed", userId: "removed", name: "삭제된 사람", membershipStatus: "REMOVED" }
  ]
}, now);

assertEqual(inactiveParticipantViewModel.participantLabel, "1\uBA85", "participant count includes only active participants");
assertEqual(inactiveParticipantViewModel.participantAvatars.length, 1, "participant avatars include only active participants");

const xPenaltyViewModel = createNextAppointmentViewModel({
  ...appointments[2],
  penalty: "X"
}, now);

assertEqual(xPenaltyViewModel.hasPenalty, false, "X penalty marker is treated as no penalty");
assertEqual(xPenaltyViewModel.penaltyLabel, "\uBC8C\uCE59 \uC5C6\uC74C", "X penalty marker is displayed as no penalty");

const noMemoViewModel = createNextAppointmentViewModel({
  ...appointments[2],
  memo: "   "
}, now);

assertEqual(noMemoViewModel.hasMemo, false, "blank memo is hidden on the appointment tab");

const sharingAppointment = {
  ...appointments[2],
  locationShareStartsAt: "2026-05-01T11:30:00+09:00"
};
const sharingViewModel = createNextAppointmentViewModel(sharingAppointment, now);

assertEqual(sharingViewModel.shareLabel, "\uC704\uCE58 \uACF5\uC720 \uC911", "active location sharing is highlighted");
assertEqual(sharingViewModel.actionLabel, "\uC57D\uC18D \uD604\uD669 \uBCF4\uAE30", "active sharing uses status action label");

assertTrue(selectNextAppointment([appointments[1]], now) === null, "past appointments are ignored");
