import { apiErrorMessage } from "./errors";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(
  apiErrorMessage('{"status":400,"message":"이미 주소록에 있는 사용자예요."}', 400),
  "이미 주소록에 있는 사용자예요.",
  "API JSON errors show their message field"
);

assertEqual(
  apiErrorMessage("plain failure", 500),
  "plain failure",
  "plain text API errors stay readable"
);

assertEqual(
  apiErrorMessage("", 404),
  "API request failed: 404",
  "empty API errors fall back to status"
);
