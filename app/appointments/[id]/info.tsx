import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Car,
  CheckCircle2,
  Clock3,
  Crosshair,
  DoorOpen,
  Gift,
  Link as LinkIcon,
  MapPin
} from "lucide-react-native";
import { AppScreen } from "../../../src/components/AppScreen";
import { Header, IconTextRow, InfoCard, SettingRow } from "../../../src/components/Cards";
import { FooterBar } from "../../../src/components/FooterBar";
import { ParticipantRow } from "../../../src/components/ParticipantRow";
import { PrimaryButton } from "../../../src/components/Buttons";
import { StatusButton } from "../../../src/components/StatusButton";
import { getAppointment, getParticipant } from "../../../src/data/mock";
import { colors } from "../../../src/theme";

export default function AppointmentInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const appointment = getAppointment(id);
  const people = appointment.participantIds.map(getParticipant);

  return (
    <AppScreen
      footer={
        <FooterBar>
          <PrimaryButton icon={LinkIcon} onPress={() => router.push(`/appointments/${appointment.id}/invite`)}>
            초대 링크 공유
          </PrimaryButton>
        </FooterBar>
      }
    >
      <Header title={appointment.title} center back={() => router.back()} />
      <View style={styles.topRows}>
        <IconTextRow icon={Clock3}>{appointment.timeLabel}</IconTextRow>
        <IconTextRow icon={MapPin}>{appointment.place}</IconTextRow>
      </View>
      <View style={styles.countdown}>
        <Clock3 color={colors.primary} size={22} strokeWidth={2.2} />
        <Text style={styles.countdownText}>위치 공개까지 1시간 23분</Text>
      </View>
      <InfoCard style={styles.settings}>
        <SettingRow icon={Gift} label="벌칙" value={appointment.penalty} />
        <SettingRow icon={Crosshair} label="도착 반경" value="100m" />
        <SettingRow icon={Clock3} label="유예 시간" value="5분" />
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>참가자 {people.length}명</Text>
        {people.map((participant, index) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            mode="info"
            border={index < people.length - 1}
          />
        ))}
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>약속 메모</Text>
        <Text style={styles.memo}>예약자명: 김민수{"\n"}늦으면 커피 사기{"\n"}2차는 현장에서 정하기</Text>
      </InfoCard>
      <InfoCard style={styles.cardGap}>
        <Text style={styles.cardTitle}>빠른 상태</Text>
        <View style={styles.quickRow}>
          <StatusButton icon={Car} label="출발했어요" compact />
          <StatusButton icon={Clock3} label="조금 늦어요" compact />
          <StatusButton icon={DoorOpen} label="먼저 들어가세요" compact />
          <StatusButton icon={CheckCircle2} label="도착했어요" compact />
        </View>
      </InfoCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topRows: {
    gap: 14,
    marginTop: 2
  },
  countdown: {
    marginTop: 28,
    alignSelf: "flex-start",
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: colors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  countdownText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800"
  },
  settings: {
    marginTop: 24,
    paddingVertical: 10
  },
  cardGap: {
    marginTop: 18
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16
  },
  memo: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 30,
    fontWeight: "500"
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  }
});
