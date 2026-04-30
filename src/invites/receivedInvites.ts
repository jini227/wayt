import { formatAppointmentScheduleLabel } from "../appointments/liveAppointmentSchedule";

export type ReceivedInviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";

export type ReceivedInvite = {
  id: string;
  appointmentId?: string;
  appointmentTitle: string;
  placeName: string;
  scheduledAt: string;
  status: ReceivedInviteStatus;
  token: string;
  inviterNickname: string;
  inviterWaytId: string;
  inviterAvatarUrl?: string | null;
  createdAt?: string;
};

export type ReceivedInviteRow = {
  id: string;
  title: string;
  place: string;
  scheduledAt: string;
  scheduleLabel: string;
  inviterLabel: string;
  inviterHandle: string;
  inviterAvatarUrl?: string;
  route: string;
  token: string;
  isPast: boolean;
};

export function buildReceivedInviteRows(
  invites: readonly ReceivedInvite[],
  now: Date = new Date()
): ReceivedInviteRow[] {
  const nowTime = now.getTime();

  return invites
    .filter((invite) => invite.status === "PENDING")
    .map((invite) => {
      const scheduledTime = new Date(invite.scheduledAt).getTime();
      return {
        id: invite.id,
        title: invite.appointmentTitle,
        place: invite.placeName,
        scheduledAt: invite.scheduledAt,
        scheduleLabel: formatAppointmentScheduleLabel(invite.scheduledAt),
        inviterLabel: `${invite.inviterNickname}님의 초대`,
        inviterHandle: invite.inviterWaytId,
        ...(invite.inviterAvatarUrl ? { inviterAvatarUrl: invite.inviterAvatarUrl } : {}),
        route: `/invites/${encodeURIComponent(invite.token)}`,
        token: invite.token,
        isPast: Number.isFinite(scheduledTime) && scheduledTime < nowTime
      };
    })
    .filter((row) => !row.isPast)
    .sort(compareReceivedInviteRows(now));
}

export function receivedInviteSummaryLabel(count: number) {
  return count > 0 ? `받은 초대 ${count}개` : null;
}

function compareReceivedInviteRows(now: Date) {
  const nowTime = now.getTime();

  return (left: ReceivedInviteRow, right: ReceivedInviteRow) => {
    if (left.isPast !== right.isPast) {
      return left.isPast ? 1 : -1;
    }

    const leftTime = new Date(left.scheduledAt).getTime();
    const rightTime = new Date(right.scheduledAt).getTime();
    if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) {
      return 0;
    }
    if (!Number.isFinite(leftTime)) {
      return 1;
    }
    if (!Number.isFinite(rightTime)) {
      return -1;
    }

    if (leftTime < nowTime && rightTime < nowTime) {
      return rightTime - leftTime;
    }
    return leftTime - rightTime;
  };
}
