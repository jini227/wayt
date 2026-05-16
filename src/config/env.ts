const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const naverMapsNcpKeyId = process.env.EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID;
const kakaoJavascriptKey = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY;

export const env = {
  apiBaseUrl: requireEnv("EXPO_PUBLIC_API_BASE_URL", apiBaseUrl),
  naverMapsNcpKeyId: requireEnv("EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID", naverMapsNcpKeyId),
  kakaoJavascriptKey
};

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
