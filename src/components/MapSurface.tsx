import type { ComponentType } from "react";
import Constants from "expo-constants";
import { NaverWebMap } from "./NaverWebMap";

declare const require: (path: string) => unknown;

export type MapMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  avatarUrl?: string;
  isCurrentUser?: boolean;
};

export type MapSurfaceProps = {
  meetingPlace: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  radiusMeters?: number;
  participantMarkers?: MapMarker[];
  variant?: "card" | "fill";
};

export function MapSurface(props: MapSurfaceProps) {
  if (Constants.appOwnership === "expo") {
    return <NaverWebMap {...props} />;
  }

  const module = require("./RealNaverMap") as { RealNaverMap: ComponentType<MapSurfaceProps> };
  const RealNaverMap = module.RealNaverMap;
  return <RealNaverMap {...props} />;
}
