import { createElement, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { env } from "../config/env";
import type { MapSurfaceProps } from "./MapSurface";
import { createNaverMapFrameUrl } from "./naverMapFrameUrl";

export function NaverWebMap({ meetingPlace, radiusMeters = 100, participantMarkers = [], variant = "card" }: MapSurfaceProps) {
  const html = useMemo(
    () => mapHtml({ meetingPlace, radiusMeters, participantMarkers }),
    [meetingPlace.latitude, meetingPlace.longitude, radiusMeters, participantMarkers]
  );
  const frameUrl = useMemo(
    () =>
      createNaverMapFrameUrl({
        mode: "display",
        center: meetingPlace,
        radiusMeters,
        participantMarkers
      }),
    [meetingPlace.latitude, meetingPlace.longitude, radiusMeters, participantMarkers]
  );

  return (
    <View style={[styles.wrap, variant === "fill" && styles.fillWrap]}>
      {Platform.OS === "web" ? (
        <WebMapFrame src={frameUrl} title="Wayt map" />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html, baseUrl: "http://localhost:8083" }}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          style={styles.webview}
        />
      )}
    </View>
  );
}

function WebMapFrame({ src, title }: { src: string; title: string }) {
  return createElement("iframe", {
    src,
    title,
    style: webFrameStyle
  });
}

type MapHtmlProps = Required<Pick<MapSurfaceProps, "meetingPlace" | "radiusMeters" | "participantMarkers">>;

function mapHtml({ meetingPlace, radiusMeters, participantMarkers }: MapHtmlProps) {
  const markers = JSON.stringify(participantMarkers);
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
    <style>
      html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #f7f6f2; }
      .place-pin {
        width: 26px;
        height: 26px;
        border-radius: 14px 14px 14px 4px;
        background: #1478ff;
        border: 2px solid #fff;
        box-shadow: 0 4px 10px rgba(20, 120, 255, .28);
        transform: rotate(-45deg);
        position: relative;
      }
      .place-pin::after {
        content: "";
        position: absolute;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #fff;
        left: 7.5px;
        top: 7.5px;
      }
      .person-pin {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        overflow: hidden;
        background: #1478ff;
        border: 3px solid #fff;
        box-shadow: 0 5px 15px rgba(15, 23, 42, .22);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font: 800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .person-pin.current {
        border-color: #1478ff;
        box-shadow: 0 0 0 3px rgba(20, 120, 255, .18), 0 5px 15px rgba(15, 23, 42, .22);
      }
      .person-pin img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    </style>
    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${env.naverMapsNcpKeyId}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const meeting = new naver.maps.LatLng(${meetingPlace.latitude}, ${meetingPlace.longitude});
      const map = new naver.maps.Map("map", {
        center: meeting,
        zoom: 15,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false
      });

      new naver.maps.Circle({
        map,
        center: meeting,
        radius: ${radiusMeters},
        fillColor: "#1478FF",
        fillOpacity: 0.12,
        strokeColor: "#1478FF",
        strokeOpacity: 0.55,
        strokeWeight: 2
      });

      new naver.maps.Marker({
        position: meeting,
        map,
        icon: {
          content: '<div class="place-pin" aria-label="meeting-place"></div>',
          anchor: new naver.maps.Point(13, 26)
        }
      });

      ${markers}.forEach((item) => {
        const label = escapeText(item.label || "");
        const avatar = item.avatarUrl
          ? '<img src="' + escapeAttr(item.avatarUrl) + '" alt="' + escapeAttr(label) + '" />'
          : label.charAt(0);
        new naver.maps.Marker({
          position: new naver.maps.LatLng(item.latitude, item.longitude),
          map,
          icon: {
            content: '<div class="person-pin ' + (item.isCurrentUser ? 'current' : '') + '">' + avatar + '</div>',
            anchor: new naver.maps.Point(20, 20)
          }
        });
      });

      function escapeText(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      function escapeAttr(value) {
        return escapeText(value)
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }
    </script>
  </body>
</html>`;
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
  },
  webview: {
    flex: 1,
    backgroundColor: "#F7F6F2"
  }
});

const webFrameStyle = {
  width: "100%",
  height: "100%",
  border: 0,
  display: "block",
  backgroundColor: "#F7F6F2"
};
