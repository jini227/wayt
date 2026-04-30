export type AppointmentCreateDraft = {
  title: string;
  selectedPlace: unknown | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  shareStartOffsetMinutes: number | null;
  penalty: string;
  penaltyNone: boolean;
  arrivalRadiusMeters: number;
  graceMinutes: number;
  memo: string;
  placeQuery: string;
};

const DEFAULT_ARRIVAL_RADIUS_METERS = 20;
export const DEFAULT_SHARE_START_OFFSET_MINUTES = 60;
const DEFAULT_GRACE_MINUTES = 0;

export function hasAppointmentCreateDraft(draft: AppointmentCreateDraft) {
  return (
    draft.title.trim().length > 0 ||
    draft.placeQuery.trim().length > 0 ||
    draft.selectedPlace !== null ||
    draft.selectedDate !== null ||
    draft.selectedTime !== null ||
    (draft.shareStartOffsetMinutes !== null
      && draft.shareStartOffsetMinutes !== DEFAULT_SHARE_START_OFFSET_MINUTES) ||
    !draft.penaltyNone ||
    draft.penalty.trim().length > 0 ||
    draft.arrivalRadiusMeters !== DEFAULT_ARRIVAL_RADIUS_METERS ||
    draft.graceMinutes !== DEFAULT_GRACE_MINUTES ||
    draft.memo.trim().length > 0
  );
}

export function shouldConfirmAppointmentCreateExit(
  draft: AppointmentCreateDraft,
  saving: boolean,
  exitConfirmationDisabled = false
) {
  return !exitConfirmationDisabled && !saving && hasAppointmentCreateDraft(draft);
}

export function shouldPreventAppointmentCreateRemove(
  draft: AppointmentCreateDraft,
  saving: boolean,
  exitConfirmationDisabled = false
) {
  return !exitConfirmationDisabled && (saving || hasAppointmentCreateDraft(draft));
}
