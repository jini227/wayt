export type HistoryArchiveScope = "ALL" | "MONTH";

export type HistoryArchiveParticipant = {
  name: string;
  waytId?: string | null;
};

export type HistoryArchiveItem = {
  scheduledAt: string;
  title: string;
  placeName: string;
  penalty?: string | null;
  memo?: string | null;
  participants?: readonly HistoryArchiveParticipant[];
};

export type HistoryArchiveFilter = {
  scope: HistoryArchiveScope;
  visibleMonth: Date;
  query: string;
};

export function filterHistoryArchiveItems<T extends HistoryArchiveItem>(
  items: readonly T[],
  filter: HistoryArchiveFilter
) {
  const query = normalizeSearchText(filter.query);
  const searching = query.length > 0;

  return items.filter((item) => {
    if (filter.scope === "MONTH" && !isSameMonth(new Date(item.scheduledAt), filter.visibleMonth)) {
      return false;
    }

    if (searching) {
      return searchableFields(item).some((field) => normalizeSearchText(field).includes(query));
    }

    return true;
  });
}

export function monthArchiveLabel(month: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long"
  }).format(month);
}

export function historyArchiveCountLabel(count: number, searching: boolean, scope: HistoryArchiveScope) {
  if (searching) {
    return `검색 결과 ${count}개`;
  }

  return scope === "MONTH" ? `이 달의 약속 ${count}개` : `전체 기록 ${count}개`;
}

function searchableFields(item: HistoryArchiveItem) {
  return [
    item.title,
    item.placeName,
    item.penalty ?? "",
    item.memo ?? "",
    ...(item.participants ?? []).flatMap((participant) => [
      participant.name,
      participant.waytId ?? ""
    ])
  ];
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function isSameMonth(date: Date, month: Date) {
  if (Number.isNaN(date.getTime()) || Number.isNaN(month.getTime())) {
    return false;
  }

  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}
