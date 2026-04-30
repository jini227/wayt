import type { AddressBookEntry } from "../appointments/invite";

export type AddressBookSection = {
  title: string;
  entries: AddressBookEntry[];
};

export function addressBookCountLabel(count: number) {
  return `주소록 ${count}명`;
}

export function filterAddressBookEntries(entries: readonly AddressBookEntry[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...entries];
  }

  return entries.filter((entry) => {
    const fields = [
      entry.displayName,
      entry.user.nickname,
      entry.user.waytId
    ];
    return fields.some((field) => field.toLowerCase().includes(normalizedQuery));
  });
}

export function buildAddressBookSections(entries: readonly AddressBookEntry[]): AddressBookSection[] {
  const sortedEntries = [...entries].sort((left, right) => {
    const nameOrder = left.displayName.localeCompare(right.displayName, "ko-KR");
    return nameOrder !== 0
      ? nameOrder
      : left.user.waytId.localeCompare(right.user.waytId, "ko-KR");
  });
  const sections = new Map<string, AddressBookEntry[]>();

  for (const entry of sortedEntries) {
    const title = getKoreanInitialSectionTitle(entry.displayName || entry.user.nickname);
    const sectionEntries = sections.get(title) ?? [];
    sectionEntries.push(entry);
    sections.set(title, sectionEntries);
  }

  return Array.from(sections.entries()).map(([title, sectionEntries]) => ({
    title,
    entries: sectionEntries,
  }));
}

const koreanInitials = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

function getKoreanInitialSectionTitle(value: string) {
  const firstCharacter = value.trim()[0];
  if (!firstCharacter) {
    return "#";
  }

  const code = firstCharacter.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    return "#";
  }

  return koreanInitials[Math.floor((code - 0xac00) / 588)] ?? "#";
}
