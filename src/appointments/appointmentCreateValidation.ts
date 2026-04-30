export const APPOINTMENT_TITLE_MAX_LENGTH = 20;
export const APPOINTMENT_PLACE_NAME_MAX_LENGTH = 200;
export const APPOINTMENT_PENALTY_MAX_LENGTH = 30;
export const APPOINTMENT_MEMO_MAX_LENGTH = 150;

export type AppointmentCreateTextField = "title" | "placeName" | "penalty" | "memo";

export type AppointmentCreateValidationError = {
  field: AppointmentCreateTextField;
  message: string;
  actualLength: number;
  maxLength: number;
};

type AppointmentCreateTextInput = {
  title: string;
  placeName?: string | null;
  penalty: string;
  penaltyNone: boolean;
  memo: string;
};

const FIELD_LABELS: Record<AppointmentCreateTextField, string> = {
  title: "약속 이름",
  placeName: "장소 이름",
  penalty: "벌칙",
  memo: "메모"
};

export function validateAppointmentCreateText(input: AppointmentCreateTextInput) {
  return (
    validateMaxLength("title", input.title, APPOINTMENT_TITLE_MAX_LENGTH) ??
    validateOptionalMaxLength("placeName", input.placeName, APPOINTMENT_PLACE_NAME_MAX_LENGTH) ??
    (input.penaltyNone ? null : validateMaxLength("penalty", input.penalty, APPOINTMENT_PENALTY_MAX_LENGTH)) ??
    validateMaxLength("memo", input.memo, APPOINTMENT_MEMO_MAX_LENGTH)
  );
}

function validateOptionalMaxLength(
  field: AppointmentCreateTextField,
  value: string | null | undefined,
  maxLength: number
) {
  return value == null ? null : validateMaxLength(field, value, maxLength);
}

function validateMaxLength(
  field: AppointmentCreateTextField,
  value: string,
  maxLength: number
): AppointmentCreateValidationError | null {
  const actualLength = characterLength(value.trim());
  if (actualLength <= maxLength) {
    return null;
  }
  return {
    field,
    message: `${FIELD_LABELS[field]}은 ${maxLength}자 이하로 입력해 주세요.`,
    actualLength,
    maxLength
  };
}

function characterLength(value: string) {
  return Array.from(value).length;
}
