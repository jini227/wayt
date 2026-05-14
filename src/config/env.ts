export const env = {
  apiBaseUrl: requireEnv("EXPO_PUBLIC_API_BASE_URL"),
  naverMapsNcpKeyId: requireEnv("EXPO_PUBLIC_NAVER_MAPS_NCP_KEY_ID")
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
