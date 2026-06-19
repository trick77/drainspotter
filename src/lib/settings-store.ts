import type { Settings } from "./types";

const KEY = "drainspotter:settings:v1";

export const DEFAULT_SETTINGS: Settings = {
  purchasedSlots: 100,
  tier: "business",
  seatPrice: 19,
  promoBonus: 11,
  overageBudget: 0,
  forecastMode: "rolling7",
  burnRateGroupBy: "user",
  forecastGrowth: "moderate",
  tableSort: { column: "totalAic", direction: "desc" },
  obfuscateUsernames: false,
};

// Map legacy settings (pre tier/seatPrice model) onto the current shape. The old
// `costPerSeat` field becomes the seat price; tier/promoBonus fall back to defaults.
function migrate(parsed: unknown): Record<string, unknown> {
  if (!parsed || typeof parsed !== "object") return {};
  const s = { ...(parsed as Record<string, unknown>) };
  if (typeof s.seatPrice !== "number" && typeof s.costPerSeat === "number") {
    s.seatPrice = s.costPerSeat;
  }
  delete s.costPerSeat;
  return s;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = migrate(JSON.parse(raw));
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
