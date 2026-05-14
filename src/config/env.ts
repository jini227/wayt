const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const naverMapsNcpKeyId = process.env.EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID;

export const env = {
  apiBaseUrl: requireEnv("EXPO_PUBLIC_API_BASE_URL", apiBaseUrl),
  naverMapsNcpKeyId: requireEnv("EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID", naverMapsNcpKeyId)
};

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
