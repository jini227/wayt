import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { Flag } from "lucide-react-native";
import { participants } from "../data/mock";
import { colors } from "../theme";
import { Avatar } from "./Avatar";

const markers = [
  { id: "jiyoon", left: "22%", top: "46%" },
  { id: "hyunwoo", left: "42%", top: "68%" },
  { id: "minsu", left: "76%", top: "48%" }
];

export function MockMap() {
  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox="0 0 360 170" style={StyleSheet.absoluteFill}>
        <Rect width="360" height="170" fill="#F7F6F2" />
        <Path d="M0 28 C55 18, 82 14, 130 28 S235 46, 360 20" stroke="#65B34E" strokeWidth="6" fill="none" />
        <Path d="M0 92 C60 76, 112 88, 160 70 S250 36, 360 64" stroke="#E5E1D8" strokeWidth="10" fill="none" />
        <Path d="M0 126 C45 112, 120 128, 180 110 S280 102, 360 134" stroke="#DEDAD2" strokeWidth="9" fill="none" />
        {[30, 70, 110, 150, 190, 230, 270, 310].map((x) => (
          <Line key={`v-${x}`} x1={x} x2={x + 28} y1="0" y2="170" stroke="#DDD9D1" strokeWidth="2" />
        ))}
        {[42, 82, 122, 154].map((y) => (
          <Line key={`h-${y}`} x1="0" x2="360" y1={y} y2={y - 18} stroke="#DDD9D1" strokeWidth="2" />
        ))}
        <Circle cx="128" cy="31" r="11" fill="#4CB944" />
        <Circle cx="128" cy="31" r="7" fill="#FFFFFF" />
      </Svg>
      <Text style={[styles.mapLabel, { left: 24, top: 30 }]}>KT&G{"\n"}상상마당</Text>
      <Text style={[styles.greenLabel, { left: 112, top: 42 }]}>홍대입구역</Text>
      <Text style={[styles.mapLabel, { right: 20, top: 50 }]}>홍익대학교{"\n"}서울캠퍼스</Text>
      <View style={styles.placePin}>
        <Flag color="#FFFFFF" size={24} strokeWidth={2.4} />
      </View>
      <Text style={styles.placeTitle}>만남 장소</Text>
      <Text style={styles.placeSub}>홍대입구역 9번 출구</Text>
      {markers.map((marker) => {
        const participant = participants.find((item) => item.id === marker.id)!;
        return (
          <View key={marker.id} style={[styles.marker, { left: marker.left as `${number}%`, top: marker.top as `${number}%` }]}>
            <Avatar uri={participant.avatar} name={participant.name} accent={participant.accent} size={42} />
            <View style={[styles.dot, { backgroundColor: participant.accent }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 238,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E4E4",
    backgroundColor: "#F7F6F2",
    position: "relative"
  },
  mapLabel: {
    position: "absolute",
    color: "#6E7278",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  },
  greenLabel: {
    position: "absolute",
    color: "#2EA83A",
    fontSize: 15,
    fontWeight: "800"
  },
  placePin: {
    position: "absolute",
    left: "50%",
    top: "30%",
    width: 52,
    height: 52,
    marginLeft: -26,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  placeTitle: {
    position: "absolute",
    top: "52%",
    left: 0,
    right: 0,
    textAlign: "center",
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  placeSub: {
    position: "absolute",
    top: "65%",
    left: 0,
    right: 0,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600"
  },
  marker: {
    position: "absolute"
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    position: "absolute",
    right: -3,
    bottom: 2
  }
});
