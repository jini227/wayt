export const STATUS_LOG_PREVIEW_LIMIT = 3;

export function previewStatusLogs<T>(logs: readonly T[], limit = STATUS_LOG_PREVIEW_LIMIT) {
  return logs.slice(-limit);
}

export function shouldShowStatusLogSheetAction(logs: readonly unknown[], limit = STATUS_LOG_PREVIEW_LIMIT) {
  return logs.length > limit;
}

export function statusLogCountLabel(logs: readonly unknown[]) {
  return `전체 ${logs.length}개`;
}
