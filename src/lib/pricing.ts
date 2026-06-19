import type { SubscriptionTier } from "./types";

// GitHub Copilot usage-based billing (Jun 1, 2026). Each seat brings its price in
// AI Credits into the shared org pool. During the Jun–Aug 2026 promo, GitHub gifts
// bonus credits on top of the base (Business +$11 → $30 total, Enterprise +$31 →
// $70 total). The seat *price* never changes; only the included *credits* rise.
export const TIER_DEFAULTS: Record<
  SubscriptionTier,
  { seatPrice: number; promoBonus: number }
> = {
  business: { seatPrice: 19, promoBonus: 11 },
  enterprise: { seatPrice: 39, promoBonus: 31 },
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  business: "Business",
  enterprise: "Enterprise",
};

// Promo window: June, July, August 2026.
export function isPromoMonth(d: Date): boolean {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return y === 2026 && m >= 5 && m <= 7;
}

// Included credits per seat for a given month — base price, plus the promo bonus
// during promo months. The bonus does NOT replace the base; it stacks onto it.
export function includedCreditsForMonth(
  seatPrice: number,
  promoBonus: number,
  d: Date
): number {
  return isPromoMonth(d) ? seatPrice + promoBonus : seatPrice;
}
