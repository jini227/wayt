import {
  buildAddressBookInviteRows,
  buildAddressBookInviteSections,
  buildCurrentParticipantRows,
  buildInviteRows,
  buildSentInviteRows,
  buildWaytIdSuggestionRows,
  createInviteShareMessage,
  getSelectedInviteFooterLabel,
  loadInviteScreenData,
  normalizeWaytIdInput
} from "./invite";

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

assertEqual(normalizeWaytIdInput(" minsu "), "@minsu", "plain Wayt ID gets @ prefix");
assertEqual(normalizeWaytIdInput(" @jiyoon23 "), "@jiyoon23", "existing @ prefix is preserved");
assertEqual(normalizeWaytIdInput("   "), "", "empty Wayt ID stays empty");

assertEqual(getSelectedInviteFooterLabel(0), null, "selected invite footer is hidden when no address book people are selected");
assertEqual(getSelectedInviteFooterLabel(2), "선택한 2명 초대", "selected invite footer labels the selected address book people");

assertDeepEqual(
  buildCurrentParticipantRows({
    participants: [
      {
        id: "participant-host",
        userId: "host-user",
        name: "나",
        waytId: "@me",
        avatarUrl: "https://example.com/me.png",
        locationConsent: true
      },
      {
        id: "participant-minsu",
        userId: "minsu-user",
        name: "민수",
        waytId: "@minsu",
        avatarUrl: null,
        locationConsent: false
      }
    ]
  }).map((row) => ({
    id: row.id,
    handle: row.handle,
    inviteStatus: row.inviteStatus
  })),
  [
    { id: "participant-host", handle: "@me", inviteStatus: "위치 동의 완료" },
    { id: "participant-minsu", handle: "@minsu", inviteStatus: "참가 완료" }
  ],
  "current participant rows include the people already in the appointment"
);

assertDeepEqual(
  buildCurrentParticipantRows({
    participants: [
      {
        id: "participant-active",
        userId: "active-user",
        name: "활성",
        waytId: "@active",
        avatarUrl: null,
        locationConsent: false,
        membershipStatus: "ACTIVE"
      },
      {
        id: "participant-left",
        userId: "left-user",
        name: "나간 사람",
        waytId: "@left",
        avatarUrl: null,
        locationConsent: false,
        membershipStatus: "LEFT"
      }
    ]
  }).map((row) => row.handle),
  ["@active"],
  "current participant rows hide people who left the appointment"
);

assertEqual(
  createInviteShareMessage({
    appointmentTitle: "홍대 저녁 약속",
    url: "https://wayt.app/invite/AB12CD"
  }),
  "홍대 저녁 약속 초대 링크\nhttps://wayt.app/invite/AB12CD",
  "share message uses the generated invite URL"
);

assertDeepEqual(
  buildInviteRows({
    participants: [
      {
        id: "participant-host",
        userId: "host-user",
        name: "나",
        waytId: "@me",
        avatarUrl: "https://example.com/me.png",
        locationConsent: true
      },
      {
        id: "participant-minsu",
        userId: "minsu-user",
        name: "민수",
        waytId: "@minsu",
        avatarUrl: null,
        locationConsent: false
      }
    ],
    sentInvites: [
      {
        id: "invite-jiyoon",
        targetWaytId: "@jiyoon",
        status: "PENDING"
      },
      {
        id: "invite-existing",
        targetWaytId: "@minsu",
        status: "PENDING"
      }
    ]
  }).map((row) => ({
    id: row.id,
    handle: row.handle,
    inviteStatus: row.inviteStatus
  })),
  [
    { id: "participant-host", handle: "@me", inviteStatus: "위치 동의 완료" },
    { id: "participant-minsu", handle: "@minsu", inviteStatus: "참가 완료" },
    { id: "invite-jiyoon", handle: "@jiyoon", inviteStatus: "수락 대기" }
  ],
  "invite rows come from appointment participants and newly sent invites"
);

assertDeepEqual(
  buildSentInviteRows({
    participants: [
      {
        id: "participant-minsu",
        userId: "minsu-user",
        name: "민수",
        waytId: "@minsu",
        avatarUrl: null,
        locationConsent: false
      }
    ],
    sentInvites: [
      {
        id: "invite-me",
        targetWaytId: "@me",
        status: "PENDING"
      },
      {
        id: "invite-jiyoon",
        targetWaytId: "@jiyoon",
        status: "PENDING"
      },
      {
        id: "invite-existing",
        targetWaytId: "@minsu",
        status: "PENDING"
      }
    ],
    currentUserWaytId: "@me"
  }).map((row) => ({
    id: row.id,
    handle: row.handle,
    inviteStatus: row.inviteStatus
  })),
  [{ id: "invite-jiyoon", handle: "@jiyoon", inviteStatus: "수락 대기" }],
  "sent invite rows exclude the current user and people already participating"
);

assertDeepEqual(
  buildSentInviteRows({
    participants: [],
    sentInvites: [
      {
        id: "invite-jiyoon",
        targetWaytId: "@jiyoon",
        targetNickname: "지윤",
        targetAvatarUrl: "https://example.com/jiyoon.png",
        status: "PENDING"
      }
    ],
    currentUserWaytId: "@me"
  }).map((row) => ({
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar
  })),
  [
    {
      id: "invite-jiyoon",
      name: "지윤",
      handle: "@jiyoon",
      avatar: "https://example.com/jiyoon.png"
    }
  ],
  "sent invite rows display the invited person's name and profile when available"
);

assertDeepEqual(
  buildSentInviteRows({
    participants: [],
    sentInvites: [
      {
        id: "invite-jiyoon",
        targetWaytId: "@jiyoon",
        status: "PENDING"
      }
    ],
    inviteProfiles: [
      {
        waytId: "@jiyoon",
        title: "지윤",
        avatarUrl: "https://example.com/jiyoon-from-profile.png"
      }
    ],
    currentUserWaytId: "@me"
  }).map((row) => ({
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar
  })),
  [
    {
      id: "invite-jiyoon",
      name: "지윤",
      handle: "@jiyoon",
      avatar: "https://example.com/jiyoon-from-profile.png"
    }
  ],
  "sent invite rows use known profile data instead of falling back to the Wayt ID"
);

assertDeepEqual(
  buildSentInviteRows({
    participants: [],
    sentInvites: [
      {
        id: "invite-cancelled",
        targetWaytId: "@cancelled",
        targetNickname: "취소된 초대",
        status: "CANCELLED"
      }
    ],
    currentUserWaytId: "@me"
  }),
  [],
  "cancelled invite rows are hidden from the pending invite list"
);

assertDeepEqual(
  buildSentInviteRows({
    participants: [],
    sentInvites: [
      {
        id: "invite-accepted",
        targetWaytId: "@accepted",
        targetNickname: "Accepted",
        status: "ACCEPTED"
      },
      {
        id: "invite-declined",
        targetWaytId: "@declined",
        targetNickname: "Declined",
        status: "DECLINED"
      }
    ],
    currentUserWaytId: "@me"
  }),
  [],
  "non-pending invite rows are hidden because they no longer have an invite action"
);

const currentUserInviteInput = {
  participants: [
    {
      id: "participant-me",
      userId: "user-me",
      name: "Me",
      waytId: "@me",
      avatarUrl: null,
      locationConsent: true
    },
    {
      id: "participant-friend",
      userId: "user-friend",
      name: "Friend",
      waytId: "@friend",
      avatarUrl: null,
      locationConsent: false
    }
  ],
  sentInvites: [],
  currentUserWaytId: "@me"
};

assertDeepEqual(
  buildInviteRows(currentUserInviteInput).map((row) => row.handle),
  ["@friend"],
  "invite rows exclude the current user from the direct invite list"
);

assertDeepEqual(
  buildAddressBookInviteRows({
    addressBook: [
      {
        id: "entry-minsu",
        displayName: "민수",
        user: {
          id: "user-minsu",
          waytId: "@minsu",
          nickname: "민수",
          avatarUrl: null
        }
      },
      {
        id: "entry-jiyoon",
        displayName: "지윤",
        user: {
          id: "user-jiyoon",
          waytId: "@jiyoon",
          nickname: "지윤",
          avatarUrl: "https://example.com/jiyoon.png"
        }
      },
      {
        id: "entry-hyunwoo",
        displayName: "현우",
        user: {
          id: "user-hyunwoo",
          waytId: "@hyunwoo",
          nickname: "현우",
          avatarUrl: null
        }
      }
    ],
    participants: [
      {
        id: "participant-minsu",
        userId: "user-minsu",
        name: "민수",
        waytId: "@minsu",
        avatarUrl: null,
        locationConsent: false
      }
    ],
    sentInvites: [
      {
        id: "invite-jiyoon",
        targetWaytId: "@jiyoon",
        status: "PENDING"
      }
    ],
    selectedWaytIds: new Set(["@hyunwoo"])
  }).map((row) => ({
    waytId: row.waytId,
    title: row.title,
    selected: row.selected,
    disabled: row.disabled,
    statusLabel: row.statusLabel
  })),
  [
    {
      waytId: "@minsu",
      title: "민수",
      selected: false,
      disabled: true,
      statusLabel: "참가 중"
    },
    {
      waytId: "@jiyoon",
      title: "지윤",
      selected: false,
      disabled: true,
      statusLabel: "초대 보냄"
    },
    {
      waytId: "@hyunwoo",
      title: "현우",
      selected: true,
      disabled: false,
      statusLabel: "선택됨"
    }
  ],
  "address book invite rows mark existing participants, pending invites, and selected people"
);

assertDeepEqual(
  buildAddressBookInviteRows({
    addressBook: [
      {
        id: "entry-left",
        displayName: "다시 초대",
        user: {
          id: "user-left",
          waytId: "@left",
          nickname: "다시 초대",
          avatarUrl: null
        }
      }
    ],
    participants: [
      {
        id: "participant-left",
        userId: "user-left",
        name: "다시 초대",
        waytId: "@left",
        avatarUrl: null,
        locationConsent: false,
        membershipStatus: "REMOVED"
      }
    ],
    sentInvites: [],
    selectedWaytIds: new Set(["@left"])
  }).map((row) => ({
    waytId: row.waytId,
    disabled: row.disabled,
    selected: row.selected,
    statusLabel: row.statusLabel
  })),
  [
    {
      waytId: "@left",
      disabled: false,
      selected: true,
      statusLabel: "선택됨"
    }
  ],
  "address book invite rows allow reinviting people who left or were removed"
);

assertDeepEqual(
  buildAddressBookInviteRows({
    addressBook: [
      {
        id: "entry-cancelled",
        displayName: "취소했던 친구",
        user: {
          id: "user-cancelled",
          waytId: "@cancelled",
          nickname: "취소했던 친구",
          avatarUrl: null
        }
      }
    ],
    participants: [],
    sentInvites: [
      {
        id: "invite-cancelled",
        targetWaytId: "@cancelled",
        status: "CANCELLED"
      }
    ],
    selectedWaytIds: new Set(["@cancelled"])
  }).map((row) => ({
    waytId: row.waytId,
    disabled: row.disabled,
    selected: row.selected,
    statusLabel: row.statusLabel
  })),
  [
    {
      waytId: "@cancelled",
      disabled: false,
      selected: true,
      statusLabel: "선택됨"
    }
  ],
  "cancelled invites do not block reinviting the same person"
);

const suggestionSourceRows = buildAddressBookInviteRows({
  addressBook: [
    {
      id: "entry-arin",
      displayName: "아린",
      user: {
        id: "user-arin",
        waytId: "@arin",
        nickname: "아린",
        avatarUrl: null
      }
    },
    {
      id: "entry-ara",
      displayName: "아라",
      user: {
        id: "user-ara",
        waytId: "@ara",
        nickname: "아라",
        avatarUrl: null
      }
    },
    {
      id: "entry-aries",
      displayName: "Aries",
      user: {
        id: "user-aries",
        waytId: "@aries",
        nickname: "Aries",
        avatarUrl: null
      }
    },
    {
      id: "entry-ariel",
      displayName: "Ariel",
      user: {
        id: "user-ariel",
        waytId: "@ariel",
        nickname: "Ariel",
        avatarUrl: null
      }
    },
    {
      id: "entry-minsu",
      displayName: "민수",
      user: {
        id: "user-minsu",
        waytId: "@minsu",
        nickname: "민수",
        avatarUrl: null
      }
    }
  ],
  participants: [
    {
      id: "participant-minsu",
      userId: "user-minsu",
      name: "민수",
      waytId: "@minsu",
      avatarUrl: null,
      locationConsent: false
    }
  ],
  sentInvites: [],
  selectedWaytIds: new Set()
});

assertDeepEqual(
  buildWaytIdSuggestionRows({
    addressBookRows: suggestionSourceRows,
    serverSuggestions: [
      {
        id: "user-arthur",
        waytId: "@arthur",
        nickname: "Arthur",
        avatarUrl: null
      },
      {
        id: "user-arin",
        waytId: "@arin",
        nickname: "Arin Remote",
        avatarUrl: null
      },
      {
        id: "user-me",
        waytId: "@ar-me",
        nickname: "Me",
        avatarUrl: null
      }
    ],
    participants: [
      {
        id: "participant-minsu",
        userId: "user-minsu",
        name: "민수",
        waytId: "@minsu",
        avatarUrl: null,
        locationConsent: false
      }
    ],
    sentInvites: [
      {
        id: "invite-arthur",
        targetWaytId: "@arthur",
        status: "PENDING"
      }
    ],
    currentUserWaytId: "@ar-me",
    query: "ar"
  }).map((row) => row.waytId),
  ["@arin", "@ara", "@aries", "@ariel"],
  "Wayt ID suggestions prefer local rows and exclude duplicate, current-user, and already-invited server matches"
);

assertDeepEqual(
  buildWaytIdSuggestionRows({
    addressBookRows: suggestionSourceRows.slice(0, 1),
    serverSuggestions: [
      {
        id: "user-ara",
        waytId: "@ara",
        nickname: "Ara Remote",
        avatarUrl: null
      },
      {
        id: "user-aries",
        waytId: "@aries",
        nickname: "Aries Remote",
        avatarUrl: null
      },
      {
        id: "user-ariel",
        waytId: "@ariel",
        nickname: "Ariel Remote",
        avatarUrl: null
      },
      {
        id: "user-arnold",
        waytId: "@arnold",
        nickname: "Arnold Remote",
        avatarUrl: null
      }
    ],
    query: "ar",
    limit: 4
  }).map((row) => row.waytId),
  ["@arin", "@ara", "@aries", "@ariel"],
  "Wayt ID suggestions merge local and server matches with a hard four-row limit"
);

assertDeepEqual(
  buildWaytIdSuggestionRows({
    addressBookRows: suggestionSourceRows,
    query: "민"
  }).map((row) => row.waytId),
  [],
  "Wayt ID suggestions exclude rows that cannot be invited"
);

assertDeepEqual(
  buildWaytIdSuggestionRows({
    addressBookRows: suggestionSourceRows,
    query: "   "
  }),
  [],
  "Wayt ID suggestions stay hidden for empty search"
);

assertDeepEqual(
  buildAddressBookInviteSections({
    rows: [
      {
        entryId: "entry-nayeon",
        userId: "user-nayeon",
        waytId: "@kjfls",
        title: "나연",
        subtitle: "@kjfls",
        selected: false,
        disabled: false,
        statusLabel: "선택"
      },
      {
        entryId: "entry-gang",
        userId: "user-gang",
        waytId: "@dsflsi",
        title: "강쥐",
        subtitle: "@dsflsi",
        selected: false,
        disabled: false,
        statusLabel: "선택"
      },
      {
        entryId: "entry-nugu",
        userId: "user-nugu",
        waytId: "@dljfis",
        title: "누구",
        subtitle: "@dljfis",
        selected: false,
        disabled: false,
        statusLabel: "선택"
      }
    ],
    query: ""
  }).map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => `${row.title} ${row.waytId}`)
  })),
  [
    {
      title: "ㄱ",
      rows: ["강쥐 @dsflsi"]
    },
    {
      title: "ㄴ",
      rows: ["나연 @kjfls", "누구 @dljfis"]
    }
  ],
  "address book invite sections group rows by Korean initial and sort by name"
);

assertDeepEqual(
  buildAddressBookInviteSections({
    rows: [
      {
        entryId: "entry-nayeon",
        userId: "user-nayeon",
        waytId: "@kjfls",
        title: "나연",
        subtitle: "@kjfls",
        selected: false,
        disabled: false,
        statusLabel: "선택"
      },
      {
        entryId: "entry-gang",
        userId: "user-gang",
        waytId: "@dsflsi",
        title: "강쥐",
        subtitle: "@dsflsi",
        selected: false,
        disabled: false,
        statusLabel: "선택"
      }
    ],
    query: "kj"
  }).map((section) => ({
    title: section.title,
    rows: section.rows.map((row) => row.title)
  })),
  [
    {
      title: "ㄴ",
      rows: ["나연"]
    }
  ],
  "address book invite sections filter by typed name or Wayt ID"
);

async function runAsyncAssertions() {
  const loaded = await loadInviteScreenData({
    fetchAppointment: async () => ({ id: "appointment-1", title: "초대 약속" }),
    fetchInvites: async () => {
      throw new Error("NoResourceFoundException");
    }
  });

  assertEqual(loaded.appointment.id, "appointment-1", "invite screen keeps appointment data when invite reload fails");
  assertDeepEqual(loaded.invites, [], "invite screen falls back to no saved invites when invite reload fails");
  assertEqual(loaded.invitesUnavailable, true, "invite screen marks saved invites as unavailable");
}

void runAsyncAssertions();
