# Wayt App

Expo React Native app for Wayt.

## Expo Go Preview

Use this for quick UI checks with a QR code:

```bash
npm run expo-go
```

This mode uses mock login and a mock map so it can run inside Expo Go.

## Local Test With Real Kakao Login And Naver Map

This project uses one codebase for Android and iOS.
Because it uses native Kakao Login and Naver Map SDKs, Expo Go is not the source of truth.
Use an EAS development build.

Backend port:

```text
19191
```

Metro port:

```text
8083
```

Create `.env.local` first:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_LAN_IP:19191/api
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=your_kakao_native_app_key
EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY=your_kakao_javascript_key
EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID=your_naver_maps_ncp_key_id
```

Log in to EAS:

```bash
npx eas login
```

Build the Android development client:

```bash
npm run build:android:dev
```

Start Metro after installing the development client on the phone:

```bash
npm run dev-client
```

For iOS:

```bash
npm run build:ios:dev
npm run dev-client
```

## UI-Only Web Preview

This only checks layout. It is not a production-like login/map test.

```bash
npm run start:go -- --port 8083
```

## Checks

```bash
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## Production Build

```bash
npx eas login
npm run build:android
npm run build:ios
```

App identifiers:

- Android: `com.hyozk.wayt`
- iOS: `com.hyozk.wayt`

## Subscription Roadmap

V3 subscription is planned, not implemented as payment yet.

- Free: one ETA calculation per participant after first valid shared location, plus one late-boundary check.
- Plus: KRW 2,900/month, ETA auto refresh every 10 minutes.
- Pro: KRW 4,900/month, ETA auto refresh every 3 minutes.
