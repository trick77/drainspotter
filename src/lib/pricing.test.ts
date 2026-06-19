import { describe, it, expect } from "vitest";
import {
  TIER_DEFAULTS,
  isPromoMonth,
  includedCreditsForMonth,
} from "./pricing";

const jun2026 = new Date("2026-06-15T00:00:00Z");
const jul2026 = new Date("2026-07-15T00:00:00Z");
const aug2026 = new Date("2026-08-15T00:00:00Z");
const may2026 = new Date("2026-05-15T00:00:00Z");
const sep2026 = new Date("2026-09-15T00:00:00Z");
const jun2025 = new Date("2025-06-15T00:00:00Z");

describe("isPromoMonth", () => {
  it("is true for Jun–Aug 2026", () => {
    expect(isPromoMonth(jun2026)).toBe(true);
    expect(isPromoMonth(jul2026)).toBe(true);
    expect(isPromoMonth(aug2026)).toBe(true);
  });

  it("is false outside the window", () => {
    expect(isPromoMonth(may2026)).toBe(false);
    expect(isPromoMonth(sep2026)).toBe(false);
    expect(isPromoMonth(jun2025)).toBe(false);
  });
});

describe("includedCreditsForMonth", () => {
  it("returns the seat price in non-promo months", () => {
    expect(includedCreditsForMonth(19, 11, sep2026)).toBe(19);
    expect(includedCreditsForMonth(39, 31, sep2026)).toBe(39);
  });

  it("adds the promo bonus on top of the seat price in promo months", () => {
    // Business: $19 + $11 = $30 total (NOT $49 — bonus does not double-count)
    expect(includedCreditsForMonth(19, 11, jun2026)).toBe(30);
    // Enterprise: $39 + $31 = $70 total
    expect(includedCreditsForMonth(39, 31, jul2026)).toBe(70);
  });

  it("does not stack the full base+bonus on the price (regression for $49 bug)", () => {
    expect(includedCreditsForMonth(19, 11, jun2026)).not.toBe(49);
  });
});

describe("TIER_DEFAULTS", () => {
  it("frames the promo as a bonus, not a total", () => {
    expect(TIER_DEFAULTS.business).toEqual({ seatPrice: 19, promoBonus: 11 });
    expect(TIER_DEFAULTS.enterprise).toEqual({ seatPrice: 39, promoBonus: 31 });
  });
});
