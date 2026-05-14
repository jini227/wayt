import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const memoryStorage = new Map<string, string>();

export async function getAuthItem(key: string) {
  if (Platform.OS === "web") {
    return webStorageGet(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setAuthItem(key: string, value: string) {
  if (Platform.OS === "web") {
    webStorageSet(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteAuthItem(key: string) {
  if (Platform.OS === "web") {
    webStorageDelete(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

function webStorageGet(key: string) {
  const storage = browserStorage();
  if (storage) {
    return storage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

function webStorageSet(key: string, value: string) {
  const storage = browserStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

function webStorageDelete(key: string) {
  const storage = browserStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
}

function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
