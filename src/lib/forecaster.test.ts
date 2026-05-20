import { describe, it, expect } from "vitest";
import { forecast } from "./forecaster";
import type { Aggregations } from "./types";

function agg(over: Partial<Aggregations> = {}): Aggregations {
  return {
    rowCount: 0,
    totalAic: 0,
    totalRequests: 0,
    activeUsernames: [],
    models: [],
    perUser: [],
    perModel: [],
    perDay: [],
    userModel: [],
    monthStart: "2026-04-01",
    monthEnd: "2026-04-30",
    daysInMonth: 30,
    lastDayInData: "2026-04-10",
    daysElapsed: 10,
    spannedMonths: ["2026-04"],
    ...over,
  };
}

describe("forecast", () => {
  it("linear: extrapolates daily avg to full month", () => {
    const f = forecast(
      agg({
        totalAic: 100,
        daysInMonth: 30,
        daysElapsed: 10,
        lastDayInData: "2026-04-10",
        monthStart: "2026-04-01",
      }),
      "linear",
      1000
    );
    expect(f.dailyAvg).toBeCloseTo(10, 5);
    expect(f.forecastEoM).toBeCloseTo(300, 5);
    expect(f.forecastVsPool).toBeCloseTo(-700, 5);
  });

  it("linear: produces dailyProjection extending to end of month", () => {
    const f = forecast(
      agg({
        totalAic: 50,
        daysInMonth: 30,
        daysElapsed: 5,
        lastDayInData: "2026-04-05",
        perDay: [
          { date: "2026-04-01", totalAic: 10, byUser: {}, byModel: {}, breachedUsers: [] },
          { date: "2026-04-02", totalAic: 10, byUser: {}, byModel: {}, breachedUsers: [] },
          { date: "2026-04-03", totalAic: 10, byUser: {}, byModel: {}, breachedUsers: [] },
          { date: "2026-04-04", totalAic: 10, byUser: {}, byModel: {}, breachedUsers: [] },
          { date: "2026-04-05", totalAic: 10, byUser: {}, byModel: {}, breachedUsers: [] },
        ],
      }),
      "linear",
      1000
    );
    expect(f.dailyProjection).toHaveLength(30);
    expect(f.dailyProjection[0].projected).toBeCloseTo(10, 5);
    expect(f.dailyProjection[4].projected).toBeCloseTo(50, 5);
    expect(f.dailyProjection[29].projected).toBeCloseTo(300, 5);
  });

  it("rolling7: uses last 7 days average", () => {
    const perDay = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-04-${String(i + 1).padStart(2, "0")}`,
      totalAic: i < 3 ? 100 : 20,
      byUser: {},
      byModel: {},
      breachedUsers: [],
    }));
    const f = forecast(
      agg({
        totalAic: 100 * 3 + 20 * 7,
        daysInMonth: 30,
        daysElapsed: 10,
        lastDayInData: "2026-04-10",
        perDay,
      }),
      "rolling7",
      1000
    );
    expect(f.dailyAvg).toBeCloseTo(20, 5);
    expect(f.forecastEoM).toBeCloseTo(440 + 20 * 20, 5);
  });

  it("returns pierceDate when forecast crosses pool", () => {
    const f = forecast(
      agg({
        totalAic: 100,
        daysInMonth: 30,
        daysElapsed: 10,
        lastDayInData: "2026-04-10",
        monthStart: "2026-04-01",
        perDay: Array.from({ length: 10 }, (_, i) => ({
          date: `2026-04-${String(i + 1).padStart(2, "0")}`,
          totalAic: 10,
          byUser: {},
          byModel: {},
          breachedUsers: [],
        })),
      }),
      "linear",
      150
    );
    expect(f.pierceDate).toBe("2026-04-15");
  });

  it("pierceDate is null when forecast stays under pool", () => {
    const f = forecast(
      agg({ totalAic: 50, daysInMonth: 30, daysElapsed: 10 }),
      "linear",
      1000
    );
    expect(f.pierceDate).toBeNull();
  });

  it("handles zero daysElapsed safely", () => {
    const f = forecast(
      agg({ totalAic: 0, daysElapsed: 0, perDay: [] }),
      "linear",
      1000
    );
    expect(f.dailyAvg).toBe(0);
    expect(f.forecastEoM).toBe(0);
  });
});
