import {
  hasAppointmentCreateDraft,
  shouldPreventAppointmentCreateRemove,
  shouldConfirmAppointmentCreateExit,
  type AppointmentCreateDraft
} from "./newAppointmentDraft";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const emptyDraft: AppointmentCreateDraft = {
  title: "",
  selectedPlace: null,
  selectedDate: null,
  selectedTime: null,
  shareStartOffsetMinutes: 60,
  penalty: "",
  penaltyNone: true,
  arrivalRadiusMeters: 20,
  graceMinutes: 0,
  memo: "",
  placeQuery: ""
};

assertEqual(
  hasAppointmentCreateDraft(emptyDraft),
  false,
  "empty appointment create screen does not need exit confirmation"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, title: "Dinner" }),
  true,
  "typed title counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, placeQuery: "Gangnam Station" }),
  true,
  "typed place search counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, selectedPlace: { latitude: 37.5, longitude: 127 } }),
  true,
  "selected place counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, selectedDate: new Date("2026-05-01T00:00:00+09:00") }),
  true,
  "selected date counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, selectedTime: "19:30" }),
  true,
  "selected time counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, shareStartOffsetMinutes: 30 }),
  true,
  "changed location sharing offset counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, penaltyNone: false }),
  true,
  "enabled penalty field counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, arrivalRadiusMeters: 30 }),
  true,
  "changed arrival radius counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, graceMinutes: 5 }),
  true,
  "changed grace minutes counts as an appointment draft"
);

assertEqual(
  hasAppointmentCreateDraft({ ...emptyDraft, memo: "Bring a gift" }),
  true,
  "typed memo counts as an appointment draft"
);

assertEqual(
  shouldConfirmAppointmentCreateExit({ ...emptyDraft, title: "Dinner" }, false),
  true,
  "draft exits ask for confirmation while not saving"
);

assertEqual(
  shouldConfirmAppointmentCreateExit({ ...emptyDraft, title: "Dinner" }, true),
  false,
  "successful save navigation is not blocked by the draft guard"
);

assertEqual(
  shouldConfirmAppointmentCreateExit({ ...emptyDraft, title: "Dinner" }, false, true),
  false,
  "explicitly allowed navigation is not blocked even before saving state re-renders"
);

assertEqual(
  shouldPreventAppointmentCreateRemove({ ...emptyDraft, title: "Dinner" }, false, false),
  true,
  "draft screens prevent remove so confirmation can run"
);

assertEqual(
  shouldPreventAppointmentCreateRemove(emptyDraft, true, false),
  true,
  "saving screens prevent remove until the create request settles"
);

assertEqual(
  shouldPreventAppointmentCreateRemove({ ...emptyDraft, title: "Dinner" }, true, true),
  false,
  "explicitly allowed navigation bypasses all create-screen remove guards"
);
