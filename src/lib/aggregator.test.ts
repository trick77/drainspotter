import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregator";
import type { UsageRow } from "./types";

function row(over: Partial<UsageRow> = {}): UsageRow {
  return {
    date: "2026-04-01",
    username: "alice",
    product: "copilot",
    sku: "copilot_ai_credit",
    model: "GPT-5.4",
    quantity: 1,
    unitType: "ai-credits",
    appliedCostPerQuantity: 0.01,
    grossAmount: 1,
    discountAmount: 1,
    netAmount: 0,
    totalMonthlyQuota: 1900,
    organization: "DemoOrg",
    costCenterName: "",
    aicQuantity: 100,
    aicGrossAmount: 1,
    ...over,
  };
}

describe("aggregate", () => {
  it("returns empty aggregation for no rows", () => {
    const a = aggregate([]);
    expect(a.rowCount).toBe(0);
    expect(a.totalAic).toBe(0);
    expect(a.activeUsernames).toEqual([]);
    expect(a.spannedMonths).toEqual([]);
  });

  it("rolls up per-user totals across multiple rows", () => {
    const a = aggregate([
      row({ username: "alice", aicGrossAmount: 2 }),
      row({ username: "alice", date: "2026-04-02", aicGrossAmount: 3 }),
      row({ username: "bob", aicGrossAmount: 5 }),
    ]);
    expect(a.totalAic).toBeCloseTo(10, 5);
    expect(a.perUser).toHaveLength(2);
    const alice = a.perUser.find((u) => u.username === "alice")!;
    expect(alice.totalAic).toBeCloseTo(5, 5);
    expect(alice.perDay).toHaveLength(2);
  });

  it("sorts perUser descending by totalAic", () => {
    const a = aggregate([
      row({ username: "alice", aicGrossAmount: 2 }),
      row({ username: "bob", aicGrossAmount: 5 }),
      row({ username: "carol", aicGrossAmount: 1 }),
    ]);
    expect(a.perUser.map((u) => u.username)).toEqual(["bob", "alice", "carol"]);
  });

  it("rolls up per-model with cost-per-credit", () => {
    const a = aggregate([
      row({ model: "GPT-5.4", quantity: 10, aicQuantity: 100, aicGrossAmount: 1 }),
      row({ model: "GPT-5.4", quantity: 10, aicQuantity: 100, aicGrossAmount: 1 }),
      row({ model: "GPT-5.3-Codex", quantity: 5, aicQuantity: 2000, aicGrossAmount: 20 }),
    ]);
    expect(a.perModel).toHaveLength(2);
    const codex = a.perModel.find((m) => m.model === "GPT-5.3-Codex")!;
    expect(codex.totalAic).toBeCloseTo(20, 5);
    expect(codex.costPerCredit).toBeCloseTo(0.01, 5);
    expect(a.totalCredits).toBeCloseTo(2200, 5);
  });

  it("rolls up perDay with byUser and byModel maps", () => {
    const a = aggregate([
      row({ date: "2026-04-01", username: "alice", model: "GPT-5.4", aicGrossAmount: 2 }),
      row({ date: "2026-04-01", username: "bob", model: "GPT-5.3-Codex", aicGrossAmount: 3 }),
      row({ date: "2026-04-02", username: "alice", model: "GPT-5.4", aicGrossAmount: 1 }),
    ]);
    expect(a.perDay).toHaveLength(2);
    expect(a.perDay[0].date).toBe("2026-04-01");
    expect(a.perDay[0].totalAic).toBeCloseTo(5, 5);
    expect(a.perDay[0].byUser.alice).toBeCloseTo(2, 5);
    expect(a.perDay[0].byModel["GPT-5.3-Codex"]).toBeCloseTo(3, 5);
  });

  it("flags multi-month spans and filters to latest month", () => {
    const a = aggregate([
      row({ date: "2026-03-30", aicGrossAmount: 1 }),
      row({ date: "2026-04-01", aicGrossAmount: 2 }),
      row({ date: "2026-04-02", aicGrossAmount: 3 }),
    ]);
    expect(a.spannedMonths.length).toBeGreaterThan(1);
    expect(a.totalAic).toBeCloseTo(5, 5);
    expect(a.monthStart).toBe("2026-04-01");
    expect(a.monthEnd).toBe("2026-04-30");
    expect(a.daysInMonth).toBe(30);
  });

  it("computes daysElapsed from first to last date in latest month", () => {
    const a = aggregate([
      row({ date: "2026-04-01" }),
      row({ date: "2026-04-08" }),
    ]);
    expect(a.daysElapsed).toBe(8);
    expect(a.lastDayInData).toBe("2026-04-08");
  });

  it("collects userModel cells for heatmap", () => {
    const a = aggregate([
      row({ username: "alice", model: "GPT-5.4", aicGrossAmount: 2 }),
      row({ username: "alice", model: "GPT-5.4", aicGrossAmount: 1 }),
      row({ username: "bob", model: "GPT-5.4", aicGrossAmount: 4 }),
    ]);
    const aliceCell = a.userModel.find(
      (c) => c.username === "alice" && c.model === "GPT-5.4"
    )!;
    expect(aliceCell.aic).toBeCloseTo(3, 5);
  });

  it("uses aic_quantity for per-user credit totals", () => {
    const a = aggregate([
      row({ username: "alice", quantity: 1, aicQuantity: 25 }),
      row({ username: "alice", quantity: 1, aicQuantity: 75 }),
    ]);
    expect(a.perUser[0].totalCredits).toBeCloseTo(100, 5);
  });
});
