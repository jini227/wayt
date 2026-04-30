import {
  filterHistoryArchiveItems,
  historyArchiveCountLabel,
  monthArchiveLabel
} from "./historyArchive";

type TestHistoryItem = {
  id: string;
  title: string;
  placeName: string;
  scheduledAt: string;
  penalty: string;
  memo?: string | null;
  myRole: "HOST" | "PARTICIPANT";
  participants: Array<{
    name: string;
    waytId: string;
  }>;
};

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ids(items: readonly TestHistoryItem[]) {
  return items.map((item) => item.id).join(",");
}

const items: TestHistoryItem[] = [
  {
    id: "april-dinner",
    title: "Dinner",
    placeName: "Hongdae",
    scheduledAt: "2026-04-12T19:00:00+09:00",
    penalty: "Coffee",
    memo: "After work",
    myRole: "HOST",
    participants: [
      { name: "Minsu", waytId: "@minsu" },
      { name: "Jiyoon", waytId: "@jiyoon" }
    ]
  },
  {
    id: "april-movie",
    title: "Movie night",
    placeName: "Gangnam",
    scheduledAt: "2026-04-28T20:00:00+09:00",
    penalty: "No penalty",
    myRole: "PARTICIPANT",
    participants: [{ name: "Seojun", waytId: "@seo" }]
  },
  {
    id: "march-brunch",
    title: "Brunch",
    placeName: "Seongsu",
    scheduledAt: "2026-03-30T11:00:00+09:00",
    penalty: "Dessert",
    memo: "Minsu birthday",
    myRole: "PARTICIPANT",
    participants: [{ name: "Nayeon", waytId: "@nayeon" }]
  }
];

assertEqual(
  ids(filterHistoryArchiveItems(items, { scope: "ALL", visibleMonth: new Date("2026-04-01T00:00:00+09:00"), query: "" })),
  "april-dinner,april-movie,march-brunch",
  "empty search shows the full archive by default"
);

assertEqual(
  ids(filterHistoryArchiveItems(items, { scope: "MONTH", visibleMonth: new Date("2026-04-01T00:00:00+09:00"), query: "" })),
  "april-dinner,april-movie",
  "month scope shows only appointments in the selected month"
);

assertEqual(
  ids(filterHistoryArchiveItems(items, { scope: "ALL", visibleMonth: new Date("2026-04-01T00:00:00+09:00"), query: "minsu" })),
  "april-dinner,march-brunch",
  "search looks across the full archive and matches participants or memo"
);

assertEqual(
  ids(filterHistoryArchiveItems(items, { scope: "MONTH", visibleMonth: new Date("2026-04-01T00:00:00+09:00"), query: "minsu" })),
  "april-dinner",
  "month scope keeps search inside the selected month"
);

assertEqual(
  monthArchiveLabel(new Date("2026-04-01T00:00:00+09:00")),
  "2026년 4월",
  "month archive label is compact and readable"
);

assertEqual(historyArchiveCountLabel(3, false, "ALL"), "전체 기록 3개", "default count label names the full archive");
assertEqual(historyArchiveCountLabel(3, false, "MONTH"), "이 달의 약속 3개", "month count label names the selected month");
assertEqual(historyArchiveCountLabel(2, true, "ALL"), "검색 결과 2개", "search count label names search results");
