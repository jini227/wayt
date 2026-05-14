import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { env } from "../src/config/env";
import type { MapMarker } from "../src/components/MapSurface";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type FrameConfig =
  | {
      mode: "display";
      center: Coordinate;
      radiusMeters: number;
      participantMarkers: MapMarker[];
    }
  | {
      mode: "picker";
      center: Coordinate;
      selectedPlace: Coordinate | null;
    };

type NaverWindow = Window &
  typeof globalThis & {
    naver?: {
      maps?: any;
    };
  };

let naverMapsPromise: Promise<any> | null = null;

export default function NaverMapFrameScreen() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const config = useMemo(() => readFrameConfig(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !config) {
      return undefined;
    }

    let cancelled = false;
    const mapElement = mapElementRef.current;
    if (!mapElement) {
      setError("Map container is not ready.");
      return undefined;
    }

    loadNaverMaps()
      .then((naver) => {
        if (!cancelled) {
          renderMap(naver, mapElement, config);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load the map.");
        }
      });

    return () => {
      cancelled = true;
      mapElement.innerHTML = "";
    };
  }, [config]);

  if (Platform.OS !== "web") {
    return null;
  }

  if (!config) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Invalid map parameters.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {createElement("div", {
        ref: mapElementRef,
        style: webMapElementStyle
      })}
      {error ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function renderMap(naver: any, mapElement: HTMLDivElement, config: FrameConfig) {
  mapElement.innerHTML = "";

  const center = new naver.maps.LatLng(config.center.latitude, config.center.longitude);
  const map = new naver.maps.Map(mapElement, {
    center,
    zoom: 15,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false,
    zoomControl: false
  });

  if (config.mode === "picker") {
    let marker: any = null;
    const setMarker = (position: any, notify: boolean) => {
      if (marker) {
        marker.setMap(null);
      }
      marker = new naver.maps.Marker({
        position,
        map,
        icon: {
          content:
            '<div style="padding:5px 10px;border-radius:999px;background:#fff;color:#111;font:800 12px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.16);white-space:nowrap">Meeting place</div>',
          anchor: new naver.maps.Point(46, 18)
        }
      });
      map.panTo(position);

      if (notify) {
        window.parent.postMessage(
          {
            type: "wayt-place-picker-select",
            latitude: position.lat(),
            longitude: position.lng()
          },
          window.location.origin
        );
      }
    };

    naver.maps.Event.addListener(map, "click", (event: { coord: any }) => {
      setMarker(event.coord, true);
    });

    if (config.selectedPlace) {
      setMarker(new naver.maps.LatLng(config.selectedPlace.latitude, config.selectedPlace.longitude), false);
    }
    return;
  }

  new naver.maps.Circle({
    map,
    center,
    radius: config.radiusMeters,
    fillColor: "#1478FF",
    fillOpacity: 0.12,
    strokeColor: "#1478FF",
    strokeOpacity: 0.55,
    strokeWeight: 2
  });

  new naver.maps.Marker({
    position: center,
    map,
    icon: {
      content:
        '<div style="width:26px;height:26px;border-radius:14px 14px 14px 4px;background:#1478ff;border:2px solid #fff;box-shadow:0 4px 10px rgba(20,120,255,.28);transform:rotate(-45deg);position:relative"><span style="position:absolute;width:7px;height:7px;border-radius:999px;background:#fff;left:7.5px;top:7.5px"></span></div>',
      anchor: new naver.maps.Point(13, 26)
    }
  });

  config.participantMarkers.forEach((item) => {
    const label = escapeText(item.label || "");
    const avatar = item.avatarUrl
      ? `<img src="${escapeAttr(item.avatarUrl)}" alt="${escapeAttr(label)}" style="width:100%;height:100%;object-fit:cover" />`
      : escapeText(label.charAt(0));
    const borderColor = item.isCurrentUser ? "#1478ff" : "#fff";
    new naver.maps.Marker({
      position: new naver.maps.LatLng(item.latitude, item.longitude),
      map,
      icon: {
        content: `<div style="width:40px;height:40px;border-radius:999px;overflow:hidden;background:#1478ff;border:3px solid ${borderColor};box-shadow:0 5px 15px rgba(15,23,42,.22);display:flex;align-items:center;justify-content:center;color:#fff;font:800 15px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">${avatar}</div>`,
        anchor: new naver.maps.Point(20, 20)
      }
    });
  });
}

function loadNaverMaps() {
  const existingNaver = (window as NaverWindow).naver;
  if (existingNaver?.maps) {
    return Promise.resolve(existingNaver);
  }

  if (naverMapsPromise) {
    return naverMapsPromise;
  }

  naverMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(env.naverMapsNcpKeyId)}`;
    script.async = true;
    script.onload = () => {
      const loadedNaver = (window as NaverWindow).naver;
      if (loadedNaver?.maps) {
        resolve(loadedNaver);
        return;
      }
      reject(new Error("Naver map API authentication failed."));
    };
    script.onerror = () => {
      reject(new Error("Naver map API authentication failed."));
    };
    document.head.appendChild(script);
  });

  return naverMapsPromise;
}

function readFrameConfig(): FrameConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const center = readCoordinate(params.get("lat"), params.get("lng"));
  if (!center) {
    return null;
  }

  if (params.get("mode") === "picker") {
    return {
      mode: "picker",
      center,
      selectedPlace: readCoordinate(params.get("selectedLat"), params.get("selectedLng"))
    };
  }

  return {
    mode: "display",
    center,
    radiusMeters: readNumber(params.get("radius")) ?? 100,
    participantMarkers: readMarkers(params.get("markers"))
  };
}

function readCoordinate(latitudeValue: string | null, longitudeValue: string | null): Coordinate | null {
  const latitude = readNumber(latitudeValue);
  const longitude = readNumber(longitudeValue);
  if (latitude == null || longitude == null) {
    return null;
  }
  return { latitude, longitude };
}

function readNumber(value: string | null) {
  if (value == null || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readMarkers(value: string | null): MapMarker[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as MapMarker[];
    return Array.isArray(parsed) ? parsed.filter(isMapMarker) : [];
  } catch {
    return [];
  }
}

function isMapMarker(value: unknown): value is MapMarker {
  if (!value || typeof value !== "object") {
    return false;
  }
  const marker = value as Partial<MapMarker>;
  return typeof marker.latitude === "number" && typeof marker.longitude === "number";
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string) {
  return escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F7F6F2"
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  errorText: {
    color: "#9BA1AA",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  }
});

const webMapElementStyle = {
  width: "100%",
  height: "100%",
  backgroundColor: "#F7F6F2"
};
