import type { Settings } from "./types";

const KEY = "drainspotter:settings:v1";

export const DEFAULT_SETTINGS: Settings = {
  purchasedSlots: 100,
  costPerSeat: 19,
  forecastMode: "rolling7",
  burnRateGroupBy: "user",
  tableSort: { column: "totalAic", direction: "desc" },
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota or privacy mode — ignore
  }
}
