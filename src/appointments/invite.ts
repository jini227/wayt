import type { Participant } from "../data/mock";
import { colors } from "../theme";

export type InviteParticipant = {
  id: string;
  userId: string;
  name: string;
  waytId: string;
  avatarUrl?: string | null;
  locationConsent: boolean;
  membershipStatus?: "ACTIVE" | "LEFT" | "REMOVED";
};

export type SentInvite = {
  id: string;
  targetWaytId?: string | null;
  targetNickname?: string | null;
  targetAvatarUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
};

export type AddressBookEntry = {
  id: string;
  displayName: string;
  user: {
    id: string;
    waytId: string;
    nickname: string;
    avatarUrl?: string | null;
  };
};

export type WaytIdSuggestion = {
  id: string;
  waytId: string;
  nickname: string;
  avatarUrl?: string | null;
};

export type AddressBookInviteRow = {
  entryId: string;
  userId: string;
  waytId: string;
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  selected: boolean;
  disabled: boolean;
  statusLabel: "선택" | "선택됨" | "참가 중" | "초대 보냄";
};

export type AddressBookInviteSection = {
  title: string;
  rows: AddressBookInviteRow[];
};

export type SentInviteProfile = {
  waytId: string;
  title?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

export async function loadInviteScreenData<TAppointment, TInvite>({
  fetchAppointment,
  fetchInvites,
}: {
  fetchAppointment: () => Promise<TAppointment>;
  fetchInvites: () => Promise<TInvite[]>;
}) {
  const appointment = await fetchAppointment();

  try {
    return {
      appointment,
      invites: await fetchInvites(),
      invitesUnavailable: false,
    };
  } catch {
    return {
      appointment,
      invites: [],
      invitesUnavailable: true,
    };
  }
}

export function normalizeWaytIdInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function createInviteShareMessage({
  appointmentTitle,
  url,
}: {
  appointmentTitle: string;
  url: string;
}) {
  return `${appointmentTitle} 초대 링크\n${url}`;
}

export function getSelectedInviteFooterLabel(selectedCount: number) {
  return selectedCount > 0 ? `선택한 ${selectedCount}명 초대` : null;
}

export function buildCurrentParticipantRows({
  participants,
}: {
  participants: readonly InviteParticipant[];
}): Participant[] {
  return activeInviteParticipants(participants).map(participantToRow);
}

export function buildInviteRows({
  participants,
  sentInvites,
  currentUserWaytId,
}: {
  participants: readonly InviteParticipant[];
  sentInvites: readonly SentInvite[];
  currentUserWaytId?: string | null;
}): Participant[] {
  const normalizedCurrentUserWaytId = normalizeWaytIdInput(
    currentUserWaytId ?? "",
  );

  const activeParticipants = activeInviteParticipants(participants);
  const participantRows = activeParticipants
    .filter(
      (participant) =>
        normalizeWaytIdInput(participant.waytId) !==
        normalizedCurrentUserWaytId,
    )
    .map(participantToRow);

  const sentInviteRows = buildSentInviteRows({
    participants: activeParticipants,
    sentInvites,
    currentUserWaytId,
  });

  return [...participantRows, ...sentInviteRows];
}

export function buildSentInviteRows({
  participants,
  sentInvites,
  inviteProfiles = [],
  currentUserWaytId,
}: {
  participants: readonly InviteParticipant[];
  sentInvites: readonly SentInvite[];
  inviteProfiles?: readonly SentInviteProfile[];
  currentUserWaytId?: string | null;
}): Participant[] {
  const normalizedCurrentUserWaytId = normalizeWaytIdInput(
    currentUserWaytId ?? "",
  );
  const participantWaytIds = new Set(
    activeInviteParticipants(participants).map((participant) => normalizeWaytIdInput(participant.waytId)),
  );
  const inviteProfileByWaytId = new Map(
    inviteProfiles.flatMap((profile) => {
      const waytId = normalizeWaytIdInput(profile.waytId);
      return waytId ? [[waytId.toLowerCase(), profile] as const] : [];
    }),
  );

  return sentInvites.flatMap((invite) => {
    const targetWaytId = normalizeWaytIdInput(invite.targetWaytId ?? "");
    const profile = inviteProfileByWaytId.get(targetWaytId.toLowerCase());
    if (
      !targetWaytId ||
      invite.status !== "PENDING" ||
      targetWaytId === normalizedCurrentUserWaytId ||
      participantWaytIds.has(targetWaytId)
    ) {
      return [];
    }

    return [
      {
        id: invite.id,
        name: invite.targetNickname?.trim() || profile?.title?.trim() || profile?.nickname?.trim() || targetWaytId,
        handle: targetWaytId,
        avatar: invite.targetAvatarUrl ?? profile?.avatarUrl ?? "",
        accent: colors.primary,
        inviteStatus: inviteStatusLabel(invite.status),
      },
    ];
  });
}

export function buildAddressBookInviteRows({
  addressBook,
  participants,
  sentInvites,
  selectedWaytIds,
}: {
  addressBook: readonly AddressBookEntry[];
  participants: readonly InviteParticipant[];
  sentInvites: readonly SentInvite[];
  selectedWaytIds: ReadonlySet<string>;
}): AddressBookInviteRow[] {
  const participantWaytIds = new Set(
    activeInviteParticipants(participants).map((participant) => normalizeWaytIdInput(participant.waytId)),
  );
  const pendingInviteWaytIds = new Set(
    sentInvites.flatMap((invite) => {
      const targetWaytId = normalizeWaytIdInput(invite.targetWaytId ?? "");
      return targetWaytId && invite.status === "PENDING" ? [targetWaytId] : [];
    }),
  );
  const selected = new Set(
    Array.from(selectedWaytIds).map(normalizeWaytIdInput),
  );

  return addressBook.map((entry) => {
    const waytId = normalizeWaytIdInput(entry.user.waytId);
    const alreadyParticipating = participantWaytIds.has(waytId);
    const alreadyInvited = pendingInviteWaytIds.has(waytId);
    const disabled = alreadyParticipating || alreadyInvited;
    const isSelected = !disabled && selected.has(waytId);

    return {
      entryId: entry.id,
      userId: entry.user.id,
      waytId,
      title: entry.displayName || entry.user.nickname,
      subtitle: waytId,
      avatarUrl: entry.user.avatarUrl,
      selected: isSelected,
      disabled,
      statusLabel: alreadyParticipating
        ? "참가 중"
        : alreadyInvited
          ? "초대 보냄"
          : isSelected
            ? "선택됨"
            : "선택",
    };
  });
}

export function buildWaytIdSuggestionRows({
  addressBookRows,
  serverSuggestions = [],
  participants = [],
  sentInvites = [],
  currentUserWaytId,
  query,
  limit = 4,
}: {
  addressBookRows: readonly AddressBookInviteRow[];
  serverSuggestions?: readonly WaytIdSuggestion[];
  participants?: readonly InviteParticipant[];
  sentInvites?: readonly SentInvite[];
  currentUserWaytId?: string | null;
  query: string;
  limit?: number;
}): AddressBookInviteRow[] {
  const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
  if (!normalizedQuery) {
    return [];
  }
  const normalizedCurrentUserWaytId = normalizeWaytIdInput(currentUserWaytId ?? "").toLowerCase();
  const participantWaytIds = new Set(
    activeInviteParticipants(participants).map((participant) => normalizeWaytIdInput(participant.waytId).toLowerCase()),
  );
  const pendingInviteWaytIds = new Set(
    sentInvites.flatMap((invite) => {
      const targetWaytId = normalizeWaytIdInput(invite.targetWaytId ?? "").toLowerCase();
      return targetWaytId && invite.status === "PENDING" ? [targetWaytId] : [];
    }),
  );
  const usedWaytIds = new Set<string>();

  const localRows = addressBookRows
    .filter((row) => {
      if (row.disabled) {
        return false;
      }

      const searchableFields = [
        row.title,
        row.subtitle,
        row.waytId.replace(/^@/, ""),
      ];
      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      );
    })
    .map((row) => {
      usedWaytIds.add(row.waytId.toLowerCase());
      return row;
    });

  const remoteRows = serverSuggestions.flatMap((suggestion) => {
    const waytId = normalizeWaytIdInput(suggestion.waytId);
    const normalizedWaytId = waytId.toLowerCase();
    if (
      !normalizedWaytId.replace(/^@/, "").startsWith(normalizedQuery) ||
      normalizedWaytId === normalizedCurrentUserWaytId ||
      participantWaytIds.has(normalizedWaytId) ||
      pendingInviteWaytIds.has(normalizedWaytId) ||
      usedWaytIds.has(normalizedWaytId)
    ) {
      return [];
    }

    usedWaytIds.add(normalizedWaytId);
    return [
      {
        entryId: `suggestion-${suggestion.id}`,
        userId: suggestion.id,
        waytId,
        title: suggestion.nickname,
        subtitle: waytId,
        avatarUrl: suggestion.avatarUrl,
        selected: false,
        disabled: false,
        statusLabel: "선택" as const,
      },
    ];
  });

  return [...localRows, ...remoteRows].slice(0, limit);
}

export function buildAddressBookInviteSections({
  rows,
  query,
}: {
  rows: readonly AddressBookInviteRow[];
  query: string;
}): AddressBookInviteSection[] {
  const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
  const filteredRows = rows.filter((row) => {
    if (!normalizedQuery) {
      return true;
    }

    return [row.title, row.subtitle, row.waytId.replace(/^@/, "")].some(
      (field) => field.toLowerCase().includes(normalizedQuery),
    );
  });
  const sortedRows = [...filteredRows].sort((left, right) => {
    const titleOrder = left.title.localeCompare(right.title, "ko-KR");
    return titleOrder !== 0
      ? titleOrder
      : left.waytId.localeCompare(right.waytId, "ko-KR");
  });
  const sections = new Map<string, AddressBookInviteRow[]>();

  for (const row of sortedRows) {
    const title = getKoreanInitialSectionTitle(row.title);
    const sectionRows = sections.get(title) ?? [];
    sectionRows.push(row);
    sections.set(title, sectionRows);
  }

  return Array.from(sections.entries()).map(([title, sectionRows]) => ({
    title,
    rows: sectionRows,
  }));
}

function participantToRow(participant: InviteParticipant): Participant {
  return {
    id: participant.id,
    name: participant.name,
    handle: participant.waytId,
    avatar: participant.avatarUrl ?? "",
    accent: participant.locationConsent ? colors.success : colors.primary,
    inviteStatus: participant.locationConsent
      ? ("위치 동의 완료" as const)
      : ("참가 완료" as const),
  };
}

function activeInviteParticipants(participants: readonly InviteParticipant[]) {
  return participants.filter((participant) => (participant.membershipStatus ?? "ACTIVE") === "ACTIVE");
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

function inviteStatusLabel(
  status: SentInvite["status"],
): Participant["inviteStatus"] {
  switch (status) {
    case "ACCEPTED":
      return "참가 완료";
    case "DECLINED":
      return "초대";
    case "CANCELLED":
      return "초대";
    case "EXPIRED":
      return "초대";
    case "PENDING":
      return "수락 대기";
  }
}
