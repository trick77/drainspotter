import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "./settings-store";

// Ensure we have a proper localStorage implementation for tests
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  },
  length: 0,
  key: (index: number) => null,
};

Object.defineProperty(window, "localStorage", {
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
