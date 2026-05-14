import { appendAvatarFileToFormData } from "./avatarUploadFormData";

type AppendCall = {
  name: string;
  value: unknown;
  fileName?: string;
};

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertSame(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(message);
  }
}

function fakeFormData() {
  const calls: AppendCall[] = [];
  return {
    calls,
    formData: {
      append(name: string, value: unknown, fileName?: string) {
        calls.push({ name, value, fileName });
      }
    }
  };
}

const webFile = new Blob(["avatar"], { type: "image/png" });
const webForm = fakeFormData();
appendAvatarFileToFormData(
  webForm.formData,
  {
    uri: "blob:http://localhost/avatar",
    name: "profile.png",
    type: "image/png",
    file: webFile
  },
  "web"
);

assertEqual(webForm.calls.length, 1, "web upload appends one multipart field");
assertEqual(webForm.calls[0]?.name, "file", "web upload uses the file field name");
assertSame(webForm.calls[0]?.value, webFile, "web upload appends the actual File or Blob");
assertEqual(webForm.calls[0]?.fileName, "profile.png", "web upload preserves the selected filename");

const nativeForm = fakeFormData();
appendAvatarFileToFormData(
  nativeForm.formData,
  {
    uri: "file:///avatar.jpg",
    name: "avatar.jpg",
    type: "image/jpeg",
    file: webFile
  },
  "ios"
);

assertEqual(nativeForm.calls.length, 1, "native upload appends one multipart field");
assertEqual(nativeForm.calls[0]?.name, "file", "native upload uses the file field name");
assertEqual(
  (nativeForm.calls[0]?.value as { uri?: string }).uri,
  "file:///avatar.jpg",
  "native upload keeps the file uri payload"
);
