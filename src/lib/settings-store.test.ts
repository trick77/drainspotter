import { describe, it, expect, beforeEach } from "vitest";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "./settings-store";

const store: Record<string, string> = {};
const mockLocalStorage: Storage = {
  get length() {
    return Object.keys(store).length;
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  getItem: (k) => (k in store ? store[k] : null),
  key: (i) => Object.keys(store)[i] ?? null,
  removeItem: (k) => {
    delete store[k];
  },
  setItem: (k, v) => {
    store[k] = v;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

beforeEach(() => {
  localStorage.clear();
});

describe("settings-store", () => {
  it("returns DEFAULT_SETTINGS when nothing stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips settings via saveSettings + loadSettings", () => {
    const s = {
      ...DEFAULT_SETTINGS,
      purchasedSlots: 42,
      costPerSeat: 49,
      forecastMode: "rolling7" as const,
    };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it("merges partial stored settings with defaults", () => {
    localStorage.setItem(
      "drainspotter:settings:v1",
      JSON.stringify({ purchasedSlots: 7 })
    );
    const loaded = loadSettings();
    expect(loaded.purchasedSlots).toBe(7);
    expect(loaded.costPerSeat).toBe(DEFAULT_SETTINGS.costPerSeat);
  });

  it("falls back to defaults on corrupt JSON", () => {
    localStorage.setItem("drainspotter:settings:v1", "{not-json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
