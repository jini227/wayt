const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const pushRegistrationPath = path.join(__dirname, "pushRegistration.ts");

test("Metro importAll evaluates enumerable React Native getters", () => {
  const reactNativeExports = {};
  Object.defineProperty(reactNativeExports, "Platform", {
    enumerable: true,
    get: () => ({ OS: "ios" })
  });
  Object.defineProperty(reactNativeExports, "PushNotificationIOS", {
    enumerable: true,
    get: () => {
      throw new Error("PushNotificationIOS native module is unavailable");
    }
  });

  assert.throws(
    () => metroImportAllLikeExpo(reactNativeExports),
    /PushNotificationIOS native module is unavailable/
  );
});

test("push registration avoids dynamic namespace import of react-native", () => {
  const source = fs.readFileSync(pushRegistrationPath, "utf8");

  assert.doesNotMatch(
    source,
    /import\s*\(\s*["']react-native["']\s*\)/,
    "dynamic import(\"react-native\") makes Expo Metro enumerate PushNotificationIOS"
  );
});

function metroImportAllLikeExpo(exports) {
  const importedAll = {};
  for (const key in exports) {
    if (Object.prototype.hasOwnProperty.call(exports, key)) {
      importedAll[key] = exports[key];
    }
  }
  importedAll.default = exports;
  return importedAll;
}
