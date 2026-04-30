import { addressBookCountLabel, buildAddressBookSections, filterAddressBookEntries } from "./addressBook";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}

const entries = [
  {
    id: "entry-minsu",
    displayName: "민수",
    user: {
      id: "user-minsu",
      waytId: "@minsu",
      nickname: "김민수",
      avatarUrl: null
    }
  },
  {
    id: "entry-jiyoon",
    displayName: "스터디 지윤",
    user: {
      id: "user-jiyoon",
      waytId: "@jiyoon23",
      nickname: "지윤",
      avatarUrl: null
    }
  }
];

assertEqual(addressBookCountLabel(0), "주소록 0명", "empty address book count uses Korean people label");
assertEqual(addressBookCountLabel(3), "주소록 3명", "address book count includes the number");

assertEqual(
  filterAddressBookEntries(entries, "jiyoon").map((entry) => entry.id).join(","),
  "entry-jiyoon",
  "address book search matches Wayt IDs"
);

assertEqual(
  filterAddressBookEntries(entries, "스터디").map((entry) => entry.id).join(","),
  "entry-jiyoon",
  "address book search matches display names"
);

assertEqual(
  filterAddressBookEntries(entries, "김민수").map((entry) => entry.id).join(","),
  "entry-minsu",
  "address book search matches nicknames"
);

assertDeepEqual(
  buildAddressBookSections([
    {
      id: "entry-nayeon",
      displayName: "나연",
      user: {
        id: "user-nayeon",
        waytId: "@kjfls",
        nickname: "나연",
        avatarUrl: null
      }
    },
    {
      id: "entry-gang",
      displayName: "강쥐",
      user: {
        id: "user-gang",
        waytId: "@dsflsi",
        nickname: "강쥐",
        avatarUrl: null
      }
    },
    {
      id: "entry-nugu",
      displayName: "누구",
      user: {
        id: "user-nugu",
        waytId: "@dljfis",
        nickname: "누구",
        avatarUrl: null
      }
    }
  ]).map((section) => ({
    title: section.title,
    entries: section.entries.map((entry) => `${entry.displayName} ${entry.user.waytId}`)
  })),
  [
    {
      title: "ㄱ",
      entries: ["강쥐 @dsflsi"]
    },
    {
      title: "ㄴ",
      entries: ["나연 @kjfls", "누구 @dljfis"]
    }
  ],
  "address book sections group saved contacts by Korean initial and sort by name"
);
