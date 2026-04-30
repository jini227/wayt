import type { ComponentType } from "react";
import {
  CalendarDays,
  Clock3,
  Gift,
  Home,
  MapPin,
  UserRound
} from "lucide-react-native";
import type { ApiTravelMode } from "../travel/travelMode";

export type Participant = {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  accent: string;
  eta?: string;
  etaSource?: "manual" | "location" | null;
  status?: string;
  statusTone?: "primary" | "danger" | "success" | "muted";
  travelMode?: ApiTravelMode | null;
  arrival?: string;
  result?: "정시" | "지각" | "나감" | "삭제됨";
  inviteStatus?: "초대 보냄" | "초대" | "수락 대기" | "참가 완료" | "위치 동의 완료" | "위치 권한 꺼짐";
  etaRefreshPolicy?: "FREE_ONE_TIME_WITH_EDGE_CHECK" | "PLUS_EVERY_10_MINUTES" | "PRO_EVERY_3_MINUTES";
};

export type Appointment = {
  id: string;
  title: string;
  role: "방장" | "참가자";
  ownerWaytId: string;
  participantWaytIds: string[];
  timeLabel: string;
  fullTime: string;
  place: string;
  shareStart: string;
  penalty: string;
  peopleCount: number;
  avatars: string[];
  participantIds: string[];
};

export type HistoryGroup = {
  title: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    people: string;
    penalty: string;
  }>;
};

export const participants: Participant[] = [
  {
    id: "me",
    name: "나",
    handle: "@me",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    accent: "#19C36B",
    eta: "도착 완료",
    status: "18:56",
    statusTone: "success",
    arrival: "18:55 도착",
    result: "정시",
    inviteStatus: "위치 동의 완료"
  },
  {
    id: "minsu",
    name: "민수",
    handle: "@minsu",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    accent: "#FF3B30",
    eta: "12분 남음",
    status: "안전",
    statusTone: "primary",
    arrival: "19:07 도착",
    result: "지각",
    inviteStatus: "초대 보냄"
  },
  {
    id: "jiyoon",
    name: "지윤",
    handle: "@jiyoon23",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    accent: "#3478F6",
    eta: "4분 남음",
    status: "거의 도착",
    statusTone: "primary",
    arrival: "18:58 도착",
    result: "정시",
    inviteStatus: "초대"
  },
  {
    id: "hyunwoo",
    name: "현우",
    handle: "@hyunwoo",
    avatar: "https://api.dicebear.com/9.x/personas/png?seed=hyunwoo&backgroundColor=b6e3f4",
    accent: "#FF9500",
    eta: "18분 남음",
    status: "지각 예상",
    statusTone: "danger",
    arrival: "미도착",
    result: "지각",
    inviteStatus: "수락 대기"
  },
  {
    id: "yuna",
    name: "유나",
    avatar: "https://api.dicebear.com/9.x/personas/png?seed=yuna&backgroundColor=ffd5dc",
    accent: "#FFCC00"
  },
  {
    id: "seojun",
    name: "서준",
    avatar: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=160&q=80",
    accent: "#1478FF"
  }
];

export const CURRENT_USER_WAYT_ID_PLACEHOLDER = "__CURRENT_USER_WAYT_ID__";

export const appointments: Appointment[] = [
  {
    id: "hongdae",
    title: "홍대 저녁 약속",
    role: "방장",
    ownerWaytId: CURRENT_USER_WAYT_ID_PLACEHOLDER,
    participantWaytIds: [CURRENT_USER_WAYT_ID_PLACEHOLDER, "@minsu", "@jiyoon23", "@hyunwoo"],
    timeLabel: "오늘 오후 7:00",
    fullTime: "2026.05.03 토 · 오후 7:00",
    place: "홍대입구역 9번 출구",
    shareStart: "위치 공개 2시간 전",
    penalty: "지각자 커피 사기",
    peopleCount: 4,
    avatars: ["minsu", "jiyoon", "hyunwoo", "me"],
    participantIds: ["me", "minsu", "jiyoon", "hyunwoo"]
  },
  {
    id: "team",
    title: "팀플 회의",
    role: "참가자",
    ownerWaytId: "@hyunwoo",
    participantWaytIds: ["@hyunwoo", "@jiyoon23", "@minsu", CURRENT_USER_WAYT_ID_PLACEHOLDER],
    timeLabel: "내일 오후 2:00",
    fullTime: "2026.05.04 일 · 오후 2:00",
    place: "중앙도서관 1층",
    shareStart: "위치 공개 30분 전",
    penalty: "벌칙 없음",
    peopleCount: 4,
    avatars: ["hyunwoo", "jiyoon", "minsu", "me"],
    participantIds: ["hyunwoo", "jiyoon", "minsu", "me"]
  },
  {
    id: "seoul",
    title: "서울역 여행 집합",
    role: "방장",
    ownerWaytId: CURRENT_USER_WAYT_ID_PLACEHOLDER,
    participantWaytIds: [CURRENT_USER_WAYT_ID_PLACEHOLDER, "@seojun", "@yuna", "@jiyoon23", "@minsu", "@hyunwoo"],
    timeLabel: "토요일 오전 8:00",
    fullTime: "2026.05.09 토 · 오전 8:00",
    place: "서울역 3번 출구",
    shareStart: "위치 공개 3시간 전",
    penalty: "지각자 아메리카노",
    peopleCount: 6,
    avatars: ["me", "seojun", "yuna", "jiyoon", "minsu", "hyunwoo"],
    participantIds: ["me", "seojun", "yuna", "jiyoon", "minsu", "hyunwoo"]
  }
];

export const statusLogs = [
  { time: "18:02", text: "민수 출발했어요" },
  { time: "18:34", text: "지윤 거의 다 왔어요" },
  { time: "18:50", text: "현우 조금 늦어요" },
  { time: "18:56", text: "나 도착했어요" }
];

export const historyGroups: HistoryGroup[] = [
  {
    title: "오늘",
    items: [
      {
        id: "hongdae",
        title: "홍대 저녁 약속",
        meta: "방장 · 홍대입구역 9번 출구",
        people: "지각자 2명",
        penalty: "벌칙: 지각자 커피 사기"
      }
    ]
  },
  {
    title: "이번 주",
    items: [
      {
        id: "team",
        title: "팀플 회의",
        meta: "참가자 · 중앙도서관 1층",
        people: "전원 정시",
        penalty: "벌칙 없음"
      },
      {
        id: "gangnam",
        title: "강남 저녁",
        meta: "참가자 · 강남역 10번 출구",
        people: "내가 3분 지각",
        penalty: "벌칙: 디저트 사기"
      }
    ]
  },
  {
    title: "지난 달",
    items: [
      {
        id: "seoul",
        title: "서울역 여행 집합",
        meta: "방장 · 서울역 3번 출구",
        people: "지각자 1명",
        penalty: "벌칙: 아메리카노"
      }
    ]
  }
];

export const tabs: Array<{
  label: string;
  href: string;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
}> = [
  { label: "홈", href: "/", icon: Home },
  { label: "다음", href: "/appointments/next", icon: CalendarDays },
  { label: "히스토리", href: "/history", icon: Clock3 },
  { label: "내 정보", href: "/profile", icon: UserRound }
];

export const iconRows = {
  time: Clock3,
  place: MapPin,
  penalty: Gift
};

export function getParticipant(id: string) {
  return participants.find((participant) => participant.id === id) ?? participants[0];
}

export function getAppointment(id?: string) {
  return appointments.find((appointment) => appointment.id === id) ?? appointments[0];
}
