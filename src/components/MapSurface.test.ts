import type { MapSurfaceProps } from "./MapSurface";

const fillSurfaceProps: MapSurfaceProps = {
  meetingPlace: {
    latitude: 37.557192,
    longitude: 126.924634,
    label: "홍대입구역"
  },
  radiusMeters: 100,
  participantMarkers: [],
  variant: "fill"
};

if (fillSurfaceProps.variant !== "fill") {
  throw new Error("fullscreen map surfaces should opt into fill layout");
}
