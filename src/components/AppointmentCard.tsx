import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  LockKeyhole,
  LockKeyholeOpen,
  MapPin
} from "lucide-react-native";
import type { Appointment } from "../data/mock";
import { getParticipant } from "../data/mock";
import { appointmentRoleMark } from "../appointments/appointmentRole";
import { isMeaningfulPenalty } from "../appointments/penalty";
import { colors, spacing } from "../theme";
import { Avatar } from "./Avatar";
import { IconTextRow } from "./Cards";

export type AppointmentCardData = {
  id: string;
  title: string;
  role: "방장" | "참가자";
  timeLabel: string;
  place: string;
  shareStart: string;
  shareStatus?: "public" | "private";
  penalty?: string;
  hasPenalty?: boolean;
  myArrived?: boolean;
  peopleCount: number;
  avatars?: string[];
  avatarPeople?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    accent?: string;
  }>;
};

export function AppointmentCard({
  appointment,
  onPress
}: {
  appointment: Appointment | AppointmentCardData;
  onPress?: () => void;
}) {
  const card = normalizeAppointment(appointment);
  const roleMark = appointmentRoleMark(card.role);
  const ShareIcon = card.shareStatus === "public" ? LockKeyholeOpen : LockKeyhole;
  const avatarPeople = "avatarPeople" in appointment && appointment.avatarPeople
    ? appointment.avatarPeople.slice(0, 5)
    : undefined;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <Text style={styles.title}>{card.title}</Text>
        {card.myArrived ? (
          <View style={styles.arrivedBadge}>
            <CheckCircle2 color={colors.success} size={15} strokeWidth={2.6} />
            <Text style={styles.arrivedText}>도착</Text>
          </View>
        ) : null}
        {roleMark ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{roleMark}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rows}>
        <IconTextRow icon={Clock3}>{card.timeLabel}</IconTextRow>
        <IconTextRow icon={MapPin}>{card.place}</IconTextRow>
      </View>
      <View style={styles.divider} />
      <View style={styles.rows}>
        <IconTextRow icon={ShareIcon} tone={card.shareStatus === "public" ? "primary" : "dark"}>
          {card.shareStart}
        </IconTextRow>
        {card.hasPenalty ? (
          <IconTextRow icon={Gift}>{card.penalty}</IconTextRow>
        ) : null}
      </View>
      <View style={styles.bottom}>
        <View style={styles.avatars}>
          {avatarPeople
            ? avatarPeople.map((participant, index) => (
                <Avatar
                  key={participant.id}
                  uri={participant.avatarUrl}
                  name={participant.name}
                  accent={participant.accent ?? colors.primary}
                  size={36}
                  overlap={index > 0}
                />
              ))
            : card.avatars?.slice(0, 5).map((id, index) => {
                const participant = getParticipant(id);
                return (
                  <Avatar
                    key={id}
                    uri={participant.avatar}
                    name={participant.name}
                    accent={participant.accent}
                    size={36}
                    overlap={index > 0}
                  />
                );
              })}
        </View>
        <Text style={styles.count}>{card.peopleCount}명</Text>
        <ChevronRight color="#A3A7AF" size={22} strokeWidth={2.2} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

function normalizeAppointment(appointment: Appointment | AppointmentCardData): AppointmentCardData {
  const data = appointment as AppointmentCardData;
  const role = data.role === "방장" || data.role === "참가자" ? data.role : normalizeRole(String(data.role));
  const hasPenalty = data.hasPenalty ?? isMeaningfulPenalty(data.penalty);

  return {
    ...data,
    role,
    shareStatus: data.shareStatus ?? inferShareStatus(data.shareStart),
    hasPenalty,
    penalty: hasPenalty ? data.penalty : undefined
  };
}

function normalizeRole(value: string): "방장" | "참가자" {
  return value.includes("방") || value.includes("諛") ? "방장" : "참가자";
}

function inferShareStatus(value: string) {
  return value.includes("공개 중") ? "public" as const : "private" as const;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F1F4",
    ...spacing.softShadow
  },
  pressed: {
    opacity: 0.86
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    flex: 1
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.primary
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  arrivedBadge: {
    minHeight: 27,
    borderRadius: 999,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft
  },
  arrivedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "900"
  },
  rows: {
    gap: 6,
    marginTop: 11
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 2
  },
  count: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 14
  },
  chevron: {
    marginLeft: "auto"
  }
});
