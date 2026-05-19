import { describe, it, expect } from "vitest";
import { computePool } from "./pool-math";

describe("computePool", () => {
  it("calculates pool size from slots × costPerSeat", () => {
    const p = computePool({
      purchasedSlots: 100,
      costPerSeat: 19,
      spent: 0,
      activeUsernames: [],
    });
    expect(p.totalPool).toBe(1900);
    expect(p.fairSharePerSeat).toBe(19);
    expect(p.remaining).toBe(1900);
    expect(p.percentUsed).toBe(0);
  });

  it("computes spent, remaining, percentUsed", () => {
    const p = computePool({
      purchasedSlots: 10,
      costPerSeat: 19,
      spent: 127,
      activeUsernames: [],
    });
    expect(p.spent).toBe(127);
    expect(p.remaining).toBeCloseTo(63, 5);
    expect(p.percentUsed).toBeCloseTo(127 / 190, 5);
  });

  it("computes idleSeats from purchased minus active", () => {
    const p = computePool({
      purchasedSlots: 10,
      costPerSeat: 19,
      spent: 0,
      activeUsernames: ["a", "b", "c"],
    });
    expect(p.activeSeats).toBe(3);
    expect(p.idleSeats).toBe(7);
  });

  it("clamps idleSeats to 0 when active > purchased", () => {
    const p = computePool({
      purchasedSlots: 2,
      costPerSeat: 19,
      spent: 0,
      activeUsernames: ["a", "b", "c"],
    });
    expect(p.idleSeats).toBe(0);
  });

  it("handles zero slots gracefully (no NaN)", () => {
    const p = computePool({
      purchasedSlots: 0,
      costPerSeat: 19,
      spent: 50,
      activeUsernames: [],
    });
    expect(p.totalPool).toBe(0);
    expect(p.percentUsed).toBe(0);
  });
});
