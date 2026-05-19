import { describe, it, expect } from "vitest";
import { formatUsd, formatUsdCompact, formatDate, formatPercent } from "./format";

describe("formatUsd", () => {
  it("formats integer USD with CH locale", () => {
    expect(formatUsd(1234.56)).toBe("$1'234.56");
  });
  it("handles zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });
  it("rounds to two decimals", () => {
    expect(formatUsd(29.239824)).toBe("$29.24");
  });
});

describe("formatUsdCompact", () => {
  it("uses k-suffix for thousands", () => {
    expect(formatUsdCompact(1234)).toBe("$1.2k");
  });
  it("returns plain for < 1000", () => {
    expect(formatUsdCompact(284.5)).toBe("$285");
  });
});

describe("formatDate", () => {
  it("formats ISO date as DD.MM.YYYY", () => {
    expect(formatDate("2026-04-15")).toBe("15.04.2026");
  });
});

describe("formatPercent", () => {
  it("formats fraction as % with no decimals", () => {
    expect(formatPercent(0.671)).toBe("67%");
  });
});
