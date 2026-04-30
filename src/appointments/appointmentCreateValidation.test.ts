import {
  APPOINTMENT_MEMO_MAX_LENGTH,
  APPOINTMENT_PENALTY_MAX_LENGTH,
  APPOINTMENT_PLACE_NAME_MAX_LENGTH,
  APPOINTMENT_TITLE_MAX_LENGTH,
  validateAppointmentCreateText
} from "./appointmentCreateValidation";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertNoError(actual: ReturnType<typeof validateAppointmentCreateText>, message: string) {
  if (actual !== null) {
    throw new Error(`${message}: expected no validation error, got ${actual.field}`);
  }
}

function assertFieldError(
  actual: ReturnType<typeof validateAppointmentCreateText>,
  expectedField: NonNullable<ReturnType<typeof validateAppointmentCreateText>>["field"],
  message: string
) {
  if (actual === null) {
    throw new Error(`${message}: expected ${expectedField} validation error, got none`);
  }
  assertEqual(actual.field, expectedField, message);
}

const validText = {
  title: "가".repeat(APPOINTMENT_TITLE_MAX_LENGTH),
  placeName: "나".repeat(APPOINTMENT_PLACE_NAME_MAX_LENGTH),
  penalty: "다".repeat(APPOINTMENT_PENALTY_MAX_LENGTH),
  penaltyNone: false,
  memo: "라".repeat(APPOINTMENT_MEMO_MAX_LENGTH)
};

assertEqual(APPOINTMENT_TITLE_MAX_LENGTH, 20, "appointment titles are capped at 20 characters");
assertEqual(APPOINTMENT_PENALTY_MAX_LENGTH, 30, "appointment penalties are capped at 30 characters");
assertEqual(APPOINTMENT_MEMO_MAX_LENGTH, 150, "appointment memos are capped at 150 characters");

assertNoError(
  validateAppointmentCreateText(validText),
  "appointment create text accepts fields at their maximum lengths"
);

assertFieldError(
  validateAppointmentCreateText({
    ...validText,
    title: "가".repeat(APPOINTMENT_TITLE_MAX_LENGTH + 1)
  }),
  "title",
  "appointment create text rejects titles beyond the database limit"
);

assertFieldError(
  validateAppointmentCreateText({
    ...validText,
    placeName: "나".repeat(APPOINTMENT_PLACE_NAME_MAX_LENGTH + 1)
  }),
  "placeName",
  "appointment create text rejects place names beyond the database limit"
);

assertFieldError(
  validateAppointmentCreateText({
    ...validText,
    penalty: "다".repeat(APPOINTMENT_PENALTY_MAX_LENGTH + 1)
  }),
  "penalty",
  "appointment create text rejects penalties beyond the database limit"
);

assertNoError(
  validateAppointmentCreateText({
    ...validText,
    penalty: "다".repeat(APPOINTMENT_PENALTY_MAX_LENGTH + 1),
    penaltyNone: true
  }),
  "appointment create text ignores hidden penalty content when penalty is disabled"
);

assertFieldError(
  validateAppointmentCreateText({
    ...validText,
    memo: "라".repeat(APPOINTMENT_MEMO_MAX_LENGTH + 1)
  }),
  "memo",
  "appointment create text rejects memos beyond the app limit"
);
