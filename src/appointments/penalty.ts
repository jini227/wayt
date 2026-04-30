export const NO_PENALTY_LABEL = "벌칙 없음";

const NO_PENALTY_MARKERS = new Set([
  "",
  "없음",
  NO_PENALTY_LABEL.toLowerCase(),
  "no penalty",
  "none",
  "x"
]);

export function normalizePenalty(value?: string | null) {
  return value?.trim() ?? "";
}

export function isMeaningfulPenalty(value?: string | null) {
  return !NO_PENALTY_MARKERS.has(normalizePenalty(value).toLowerCase());
}

export function formatPenaltyLabel(value?: string | null) {
  return isMeaningfulPenalty(value) ? `벌칙: ${normalizePenalty(value)}` : NO_PENALTY_LABEL;
}

export function penaltyText(value?: string | null) {
  return isMeaningfulPenalty(value) ? normalizePenalty(value) : NO_PENALTY_LABEL;
}
