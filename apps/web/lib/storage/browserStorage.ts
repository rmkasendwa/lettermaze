import type { StorageAdapter } from "./storage";

function available(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const browserStorage: StorageAdapter = {
  get<T>(key: string): T | null {
    try {
      const value = available()?.getItem(key);
      return value == null ? null : (JSON.parse(value) as T);
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      available()?.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key: string): void {
    try {
      available()?.removeItem(key);
    } catch {}
  },
};
