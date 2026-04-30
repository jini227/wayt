import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bike, BusFront, Car, CheckCircle2, ChevronRight, Footprints, LocateFixed, PencilLine } from "lucide-react-native";
import type { Participant } from "../data/mock";
import { colors } from "../theme";
import { participantTravelModeBadge, type TravelMode } from "../travel/travelMode";
import { Avatar } from "./Avatar";

type IconProps = { color?: string; size?: number; strokeWidth?: number };

const travelModeIcons: Record<TravelMode, ComponentType<IconProps>> = {
  TRANSIT: BusFront,
  CAR: Car,
  WALK: Footprints,
  BICYCLE: Bike
};

export function ParticipantRow({
  participant,
  mode = "live",
  border = true,
  onPress,
  showInviteStatus = true,
  showLiveStatus = true
}: {
  participant: Participant;
  mode?: "live" | "info" | "result" | "invite";
  border?: boolean;
  onPress?: () => void;
  showInviteStatus?: boolean;
  showLiveStatus?: boolean;
}) {
  const toneColor =
    participant.statusTone === "danger"
      ? colors.danger
      : participant.statusTone === "success"
        ? colors.success
        : participant.statusTone === "muted"
          ? colors.textMuted
          : colors.primary;
  const travelModeBadge = participantTravelModeBadge(participant.travelMode);
  const TravelModeIcon = travelModeBadge ? travelModeIcons[travelModeBadge.mode] : null;

  if (mode === "invite") {
    const inviteStatus = participant.inviteStatus ?? "초대";
    const active = inviteStatus === "초대";
    const waiting = inviteStatus === "수락 대기";
    return (
      <View style={[styles.row, border && styles.border]}>
        <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={54} />
        <View style={styles.inviteDetails}>
          <Text style={styles.inviteName} numberOfLines={1}>{participant.name}</Text>
          {participant.handle && participant.handle !== participant.name ? (
            <Text style={styles.handle} numberOfLines={1}>{participant.handle}</Text>
          ) : null}
        </View>
        {showInviteStatus ? (
          <View style={[styles.inviteBadge, active && styles.inviteActive, waiting && styles.inviteWaiting]}>
            <Text style={[styles.inviteText, active && styles.inviteActiveText]}>{inviteStatus}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (mode === "result") {
    const late = participant.result === "지각";
    return (
      <View style={[styles.row, styles.resultRow, border && styles.border]}>
        <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={48} />
        <Text style={styles.resultName} numberOfLines={1}>{participant.name}</Text>
        <Text style={styles.resultTime} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {participant.arrival}
        </Text>
        <View style={[styles.resultBadge, late ? styles.late : styles.onTime]}>
          <Text style={[styles.resultBadgeText, late ? styles.lateText : styles.onTimeText]}>
            {participant.result}
          </Text>
        </View>
      </View>
    );
  }

  if (mode === "info") {
    return (
      <View style={[styles.row, border && styles.border]}>
        <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={50} />
        <Text style={styles.name}>{participant.name}</Text>
        <Text style={styles.infoStatus}>{participant.inviteStatus}</Text>
      </View>
    );
  }

  const content = (
    <>
      <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={50} />
      <View style={styles.liveDetails}>
        <Text style={styles.liveName} numberOfLines={1}>
          {participant.name}
        </Text>
        {showLiveStatus ? (
          <View style={styles.liveEtaRow}>
            {participant.statusTone === "success" ? (
              <CheckCircle2 color={colors.success} size={18} strokeWidth={2.5} />
            ) : null}
            {participant.statusTone !== "success" && participant.etaSource === "manual" ? (
              <PencilLine color={toneColor} size={15} strokeWidth={2.5} />
            ) : null}
            {participant.statusTone !== "success" && participant.etaSource === "location" ? (
              <LocateFixed color={toneColor} size={15} strokeWidth={2.4} />
            ) : null}
            <Text style={[styles.eta, { color: toneColor }]} numberOfLines={1}>
              {participant.eta}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.liveStatusRow}>
        {showLiveStatus ? (
          <Text style={[styles.liveStatus, participant.statusTone === "danger" && styles.liveDanger]} numberOfLines={1}>
            {participant.status}
          </Text>
        ) : null}
        {TravelModeIcon && travelModeBadge ? (
          <View
            accessible
            accessibilityLabel={travelModeBadge.accessibilityLabel}
            accessibilityRole="image"
            style={styles.travelModeBadge}
          >
            <TravelModeIcon color={colors.primary} size={15} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>
      {onPress ? <ChevronRight color="#A3A7AF" size={20} strokeWidth={2.2} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, border && styles.border, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, border && styles.border]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  resultRow: {
    gap: 6
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    minWidth: 72
  },
  resultName: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800",
    width: 78,
    flexShrink: 0
  },
  handle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3
  },
  inviteDetails: {
    flex: 1,
    minWidth: 0
  },
  inviteName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  liveDetails: {
    flex: 1,
    minWidth: 0,
    gap: 5
  },
  liveName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    flexShrink: 1,
    minWidth: 0
  },
  liveStatusRow: {
    width: 96,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
    flexShrink: 0
  },
  travelModeBadge: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  liveEtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0
  },
  eta: {
    fontSize: 15,
    fontWeight: "800",
    flexShrink: 1
  },
  liveStatus: {
    color: colors.textMuted,
    fontSize: 15,
    maxWidth: 72,
    flexShrink: 1,
    textAlign: "right"
  },
  liveDanger: {
    color: colors.danger
  },
  pressed: {
    opacity: 0.72
  },
  infoStatus: {
    marginLeft: "auto",
    color: colors.primary,
    fontSize: 17,
    fontWeight: "700"
  },
  resultTime: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "right",
    minWidth: 90
  },
  resultBadge: {
    minWidth: 54,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 9
  },
  onTime: {
    backgroundColor: colors.primarySoft
  },
  late: {
    backgroundColor: colors.dangerSoft
  },
  resultBadgeText: {
    fontSize: 16,
    fontWeight: "800"
  },
  onTimeText: {
    color: colors.primary
  },
  lateText: {
    color: colors.danger
  },
  inviteBadge: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.primarySoft
  },
  inviteActive: {
    backgroundColor: colors.primary
  },
  inviteWaiting: {
    backgroundColor: "#EEEEEF"
  },
  inviteText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800"
  },
  inviteActiveText: {
    color: "#FFFFFF"
  }
});
