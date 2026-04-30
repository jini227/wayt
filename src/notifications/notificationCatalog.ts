export type NotificationGroupId = "current" | "high" | "medium" | "later";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timing: string;
  enabledByDefault: boolean;
};

export type NotificationGroup = {
  id: NotificationGroupId;
  title: string;
  caption: string;
  items: NotificationItem[];
};

export const notificationGroups: NotificationGroup[] = [
  {
    id: "current",
    title: "기본 알림",
    caption: "현재 앱 흐름에서 바로 연결되는 알림",
    items: [
      {
        id: "appointment-invite",
        title: "약속 초대",
        description: "새 약속에 초대됐을 때",
        timing: "초대 생성 즉시",
        enabledByDefault: true
      },
      {
        id: "location-share-start",
        title: "위치 공유 시작",
        description: "약속 전 위치 공유가 시작될 때",
        timing: "약속 시간 - 위치 공개 시작 시간",
        enabledByDefault: true
      },
      {
        id: "arrival-status",
        title: "도착 상태",
        description: "참여자의 도착, 지각 상태가 바뀔 때",
        timing: "상태 변경 즉시",
        enabledByDefault: true
      }
    ]
  },
  {
    id: "high",
    title: "우선순위 높음",
    caption: "약속 성공률에 바로 영향을 주는 알림",
    items: [
      {
        id: "invite-response",
        title: "초대 수락/거절 알림",
        description: "내가 만든 약속에 누가 참여하거나 거절했을 때",
        timing: "응답 즉시",
        enabledByDefault: true
      },
      {
        id: "appointment-changed",
        title: "약속 변경 알림",
        description: "시간, 장소, 벌칙, 위치공개 시작시간이 바뀌었을 때",
        timing: "변경 저장 즉시",
        enabledByDefault: true
      },
      {
        id: "appointment-cancelled",
        title: "약속 취소 알림",
        description: "방장이 약속을 취소했을 때",
        timing: "취소 즉시",
        enabledByDefault: true
      },
      {
        id: "departure-recommendation",
        title: "출발 추천 알림",
        description: "예상 이동시간 기준으로 출발이 필요한 시점일 때",
        timing: "출발 권장 시각",
        enabledByDefault: true
      },
      {
        id: "late-risk",
        title: "지각 위험 알림",
        description: "현재 위치나 ETA 기준으로 제시간 도착이 어려워졌을 때",
        timing: "위험 감지 즉시",
        enabledByDefault: true
      },
      {
        id: "not-departed",
        title: "아직 출발 안 한 사람 알림",
        description: "위치 공유 시작 후에도 참여자 상태가 대기중일 때",
        timing: "위치 공유 시작 후",
        enabledByDefault: true
      },
      {
        id: "near-arrival",
        title: "근처 도착 알림",
        description: "장소 근처에 들어왔지만 아직 도착 판정은 안 됐을 때",
        timing: "도착 반경 근처 진입 시",
        enabledByDefault: true
      }
    ]
  },
  {
    id: "medium",
    title: "우선순위 중간",
    caption: "편의성과 확인 경험을 보강하는 알림",
    items: [
      {
        id: "appointment-reminder",
        title: "약속 전 리마인더",
        description: "약속 하루 전, 당일 아침, 1시간 전에 미리 알려줄 때",
        timing: "예약된 리마인더 시각",
        enabledByDefault: false
      },
      {
        id: "all-arrived",
        title: "참여자 전체 도착 알림",
        description: "모두 도착해서 약속이 완료됐을 때",
        timing: "전체 도착 즉시",
        enabledByDefault: false
      },
      {
        id: "manual-arrival",
        title: "수동 도착 처리 알림",
        description: "누군가 직접 도착 처리를 눌렀을 때",
        timing: "수동 처리 즉시",
        enabledByDefault: false
      },
      {
        id: "location-consent",
        title: "위치 공유 동의 요청 알림",
        description: "약속 시간이 가까운데 위치 공유 동의를 안 했을 때",
        timing: "위치 공유 시작 전",
        enabledByDefault: false
      },
      {
        id: "invite-pending",
        title: "초대 링크 만료/미응답 알림",
        description: "아직 응답하지 않은 참여자가 남아 있을 때",
        timing: "약속 전 지정 시각",
        enabledByDefault: false
      },
      {
        id: "penalty-confirmed",
        title: "벌칙 확정 알림",
        description: "지각자가 확정됐거나 벌칙 대상자가 생겼을 때",
        timing: "벌칙 확정 즉시",
        enabledByDefault: false
      }
    ]
  },
  {
    id: "later",
    title: "나중에 넣으면 좋은 것",
    caption: "고도화 단계에서 추가하면 좋은 알림",
    items: [
      {
        id: "departure-started",
        title: "출발 완료 알림",
        description: "참여자가 이동 상태로 바뀌었을 때",
        timing: "이동 시작 감지 시",
        enabledByDefault: false
      },
      {
        id: "eta-updated",
        title: "ETA 갱신 알림",
        description: "예상 도착 시간이 크게 바뀌었을 때",
        timing: "ETA 10분 이상 변동 시",
        enabledByDefault: false
      },
      {
        id: "history-saved",
        title: "약속 종료 후 히스토리 알림",
        description: "오늘 약속 결과가 저장됐을 때",
        timing: "약속 완료 후",
        enabledByDefault: false
      },
      {
        id: "reinvite",
        title: "재초대/참여 요청 알림",
        description: "초대받은 사람이 앱 미설치거나 응답이 없을 때",
        timing: "미응답 지속 시",
        enabledByDefault: false
      },
      {
        id: "premium-feature",
        title: "프리미엄 기능 알림",
        description: "Plus/Pro 자동 ETA 갱신 같은 기능 알림이 필요할 때",
        timing: "기능 조건 충족 시",
        enabledByDefault: false
      }
    ]
  }
];

export function recommendedNotificationCount(groups: readonly NotificationGroup[]) {
  return groups
    .filter((group) => group.id !== "current")
    .reduce((count, group) => count + group.items.length, 0);
}

export function highPriorityNotificationCount(groups: readonly NotificationGroup[]) {
  return groups.find((group) => group.id === "high")?.items.length ?? 0;
}

export function notificationSummaryLabel(groups: readonly NotificationGroup[]) {
  return `추천 알림 ${recommendedNotificationCount(groups)}개`;
}
