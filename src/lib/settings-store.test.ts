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
      tier: "enterprise" as const,
      seatPrice: 39,
      promoBonus: 31,
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
    expect(loaded.seatPrice).toBe(DEFAULT_SETTINGS.seatPrice);
  });

  it("migrates legacy costPerSeat onto seatPrice and infers the tier", () => {
    localStorage.setItem(
      "drainspotter:settings:v1",
      JSON.stringify({ purchasedSlots: 50, costPerSeat: 39 })
    );
    const loaded = loadSettings();
    expect(loaded.seatPrice).toBe(39);
    // $39 matches the Enterprise seat price → infer Enterprise + its +$31 bonus.
    expect(loaded.tier).toBe("enterprise");
    expect(loaded.promoBonus).toBe(31);
    expect("costPerSeat" in loaded).toBe(false);
  });

  it("infers Business tier from a legacy $19 costPerSeat", () => {
    localStorage.setItem(
      "drainspotter:settings:v1",
      JSON.stringify({ costPerSeat: 19 })
    );
    const loaded = loadSettings();
    expect(loaded.tier).toBe("business");
    expect(loaded.seatPrice).toBe(19);
    expect(loaded.promoBonus).toBe(11);
  });

  it("keeps default tier/bonus for an unrecognized legacy costPerSeat", () => {
    localStorage.setItem(
      "drainspotter:settings:v1",
      JSON.stringify({ costPerSeat: 49 })
    );
    const loaded = loadSettings();
    expect(loaded.seatPrice).toBe(49);
    expect(loaded.tier).toBe(DEFAULT_SETTINGS.tier);
    expect(loaded.promoBonus).toBe(DEFAULT_SETTINGS.promoBonus);
  });

  it("falls back to defaults on corrupt JSON", () => {
    localStorage.setItem("drainspotter:settings:v1", "{not-json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
