import { StyleSheet, View } from "react-native";
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapView
} from "@mj-studio/react-native-naver-map";
import type { MapSurfaceProps } from "./MapSurface";

export function RealNaverMap({ meetingPlace, radiusMeters = 100, participantMarkers = [], variant = "card" }: MapSurfaceProps) {
  return (
    <View style={[styles.wrap, variant === "fill" && styles.fillWrap]}>
      <NaverMapView
        style={StyleSheet.absoluteFill}
        initialCamera={{ ...meetingPlace, zoom: 15.5 }}
        isShowZoomControls={false}
        isShowScaleBar={false}
        isShowCompass={false}
      >
        <NaverMapCircleOverlay
          {...meetingPlace}
          radius={radiusMeters}
          color="#1478FF22"
          outlineColor="#1478FF88"
          outlineWidth={2}
        />
        <NaverMapMarkerOverlay
          {...meetingPlace}
          width={30}
          height={36}
          image={{ symbol: "blue" }}
        />
        {participantMarkers.map((marker) => (
          <NaverMapMarkerOverlay
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            width={marker.isCurrentUser ? 42 : 36}
            height={marker.isCurrentUser ? 42 : 36}
            image={marker.avatarUrl ? { httpUri: marker.avatarUrl } : { symbol: "lightblue" }}
            caption={{ text: marker.isCurrentUser ? "나" : marker.label, textSize: 11 }}
          />
        ))}
      </NaverMapView>
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
    backgroundColor: "#F7F6F2"
  },
  fillWrap: {
    flex: 1,
    height: "100%",
    borderRadius: 0,
    borderWidth: 0
  }
});
