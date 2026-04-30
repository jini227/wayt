export function apiErrorMessage(rawMessage: string, status: number) {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return `API request failed: ${status}`;
  }

  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
  }

  return trimmed;
}
