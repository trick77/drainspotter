import type { Settings, SubscriptionTier } from "./types";
import { TIER_DEFAULTS } from "./pricing";

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
// `costPerSeat` field becomes the seat price; when it matches a known tier's seat
// price, infer that tier and its promo bonus (so an Enterprise user on $39 doesn't
// get stuck with the Business +$11 bonus). Unrecognized values fall back to defaults.
function migrate(parsed: unknown): Record<string, unknown> {
  if (!parsed || typeof parsed !== "object") return {};
  const s = { ...(parsed as Record<string, unknown>) };
  if (typeof s.seatPrice !== "number" && typeof s.costPerSeat === "number") {
    s.seatPrice = s.costPerSeat;
    if (s.tier === undefined && typeof s.promoBonus !== "number") {
      const match = (Object.keys(TIER_DEFAULTS) as SubscriptionTier[]).find(
        (t) => TIER_DEFAULTS[t].seatPrice === s.costPerSeat
      );
      if (match) {
        s.tier = match;
        s.promoBonus = TIER_DEFAULTS[match].promoBonus;
      }
    }
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
