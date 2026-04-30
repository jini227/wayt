import { shouldRenderRemoteAvatar } from "./avatarState";

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

assertEqual(shouldRenderRemoteAvatar("https://example.com/avatar.jpg", false), true, "valid URI renders remote avatar");
assertEqual(shouldRenderRemoteAvatar("https://example.com/avatar.jpg", true), false, "failed remote image falls back");
assertEqual(shouldRenderRemoteAvatar("", false), false, "empty URI falls back");
assertEqual(shouldRenderRemoteAvatar(undefined, false), false, "missing URI falls back");
