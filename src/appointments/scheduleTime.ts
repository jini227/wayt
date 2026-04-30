export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

export function validTimeForDate(date: Date | null, time: string, now: Date) {
  if (!date || isFutureDateTime(date, time, now)) {
    return time;
  }
  return availableTimesForDate(date, now)[0] ?? time;
}

export function isFutureDateTime(date: Date, time: string, now: Date) {
  const [hour, minute] = time.split(":").map(Number);
  const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
  return selected.getTime() > now.getTime();
}

export function availableTimesForDate(date: Date, now: Date) {
  return Array.from({ length: 24 * 60 }, (_, index) => {
    const hour = Math.floor(index / 60);
    const minute = index % 60;
    return `${pad(hour)}:${pad(minute)}`;
  }).filter((time) => isFutureDateTime(date, time, now));
}

export function scheduledAtFromSelection(date: Date, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `${yyyy}-${mm}-${dd}T${pad(hour)}:${pad(minute)}:00+09:00`;
}

export function pad(value: number) {
  return value.toString().padStart(2, "0");
}
