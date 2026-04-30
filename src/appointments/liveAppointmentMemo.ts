export function displayAppointmentMemo(memo?: string | null) {
  const trimmed = memo?.trim();
  return trimmed ? trimmed : null;
}
