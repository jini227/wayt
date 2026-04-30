require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const kakaoNativeAppKey = required("EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY");
const naverMapsNcpKeyId = required("EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID");

module.exports = {
  expo: {
    name: "가는중",
    slug: "wayt",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "wayt",
    icon: "./assets/wayt-icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/wayt-splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hyozk.wayt",
      infoPlist: {
        LSApplicationQueriesSchemes: ["nmap"],
        NSLocationWhenInUseUsageDescription: "실시간 약속 참여자의 위치와 이동 상태를 공유하기 위해 위치 권한이 필요합니다.",
        NSPhotoLibraryUsageDescription: "프로필 사진을 선택하기 위해 사진 접근 권한이 필요합니다."
      }
    },
    android: {
      package: "com.hyozk.wayt",
      adaptiveIcon: {
        foregroundImage: "./assets/wayt-adaptive-icon.png",
        backgroundColor: "#1478FF"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "READ_MEDIA_IMAGES",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/wayt-favicon.png"
    },
    extra: {
      eas: {
        projectId: "5f992236-d41c-4e0f-9380-39199d8e7941"
      }
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      [
        "expo-splash-screen",
        {
          image: "./assets/wayt-splash.png",
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 24
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ],
      [
        "@react-native-kakao/core",
        {
          nativeAppKey: kakaoNativeAppKey,
          android: {
            authCodeHandlerActivity: true
          },
          ios: {
            handleKakaoOpenUrl: true
          }
        }
      ],
      [
        "@mj-studio/react-native-naver-map",
        {
          client_id: naverMapsNcpKeyId,
          android: {
            ACCESS_FINE_LOCATION: true,
            ACCESS_COARSE_LOCATION: true
          },
          ios: {
            NSLocationWhenInUseUsageDescription: "실시간 약속 참여자의 위치와 이동 상태를 공유하기 위해 위치 권한이 필요합니다."
          }
        }
      ]
    ]
  }
};
