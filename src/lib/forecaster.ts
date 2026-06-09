import type { Aggregations, Forecast, ForecastMode } from "./types";

function iterDates(start: string, days: number): string[] {
  const [y, m, d] = start.split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    out.push(`${yy}-${mm}-${dd}`);
  }
  return out;
}

function isWeekend(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 || day === 6;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function forecast(
  a: Aggregations,
  mode: ForecastMode,
  totalPool: number
): Forecast {
  if (a.daysElapsed <= 0 || a.daysInMonth <= 0) {
    return {
      mode,
      dailyAvg: 0,
      forecastEoM: 0,
      forecastVsPool: -totalPool,
      pierceDate: null,
      dailyProjection: [],
    };
  }

  const allDates = iterDates(a.monthStart, a.daysInMonth);
  const actualByDate = new Map(a.perDay.map((d) => [d.date, d.totalAic]));
  const elapsedDates = allDates.filter((date) => date <= a.lastDayInData);
  const observedWindow =
    mode === "linear" ? elapsedDates : elapsedDates.slice(-7);

  let dailyAvg: number;
  if (mode === "linear") {
    dailyAvg = a.totalAic / a.daysElapsed;
  } else {
    const lastN = a.perDay.slice(-7);
    const sum = lastN.reduce((s, d) => s + d.totalAic, 0);
    dailyAvg = lastN.length > 0 ? sum / lastN.length : 0;
  }

  const hasDailySeries = a.perDay.length > 0;
  const fallbackDailyAvg = hasDailySeries
    ? average(observedWindow.map((date) => actualByDate.get(date) ?? 0)) ?? dailyAvg
    : dailyAvg;
  const weekdayAvg = hasDailySeries
    ? average(
        observedWindow
          .filter((date) => !isWeekend(date))
          .map((date) => actualByDate.get(date) ?? 0)
      )
    : dailyAvg;
  const weekendAvg = hasDailySeries
    ? average(
        observedWindow
          .filter((date) => isWeekend(date))
          .map((date) => actualByDate.get(date) ?? 0)
      )
    : dailyAvg;

  let cum = 0;
  const dailyProjection = allDates.map((date) => {
    if (date <= a.lastDayInData) {
      cum += actualByDate.get(date) ?? (hasDailySeries ? 0 : dailyAvg);
    } else {
      const projectedDaily = isWeekend(date)
        ? weekendAvg ?? fallbackDailyAvg
        : weekdayAvg ?? fallbackDailyAvg;
      cum += projectedDaily;
    }
    return { date, projected: cum };
  });

  const forecastEoM = dailyProjection[dailyProjection.length - 1].projected;

  let pierceDate: string | null = null;
  for (const p of dailyProjection) {
    if (p.projected >= totalPool && totalPool > 0) {
      pierceDate = p.date;
      break;
    }
  }

  return {
    mode,
    dailyAvg,
    forecastEoM,
    forecastVsPool: forecastEoM - totalPool,
    pierceDate,
    dailyProjection,
  };
}
