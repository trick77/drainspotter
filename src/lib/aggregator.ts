import type {
  Aggregations,
  PerDay,
  PerModel,
  PerUser,
  UsageRow,
  UserModelCell,
} from "./types";

function lastDayOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yearMonth}-${dd}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(...(fromIso.split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(toIso.split("-").map(Number) as [number, number, number]));
  return Math.floor((b - a) / 86400000) + 1;
}

export function aggregate(rows: UsageRow[]): Aggregations {
  if (rows.length === 0) {
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
      monthStart: "",
      monthEnd: "",
      daysInMonth: 0,
      lastDayInData: "",
      daysElapsed: 0,
      spannedMonths: [],
    };
  }

  const monthsSet = new Set(rows.map((r) => r.date.slice(0, 7)));
  const spannedMonths = [...monthsSet].sort();
  const latestMonth = spannedMonths[spannedMonths.length - 1];
  const monthRows = rows.filter((r) => r.date.startsWith(latestMonth));

  const monthStart = `${latestMonth}-01`;
  const monthEnd = lastDayOfMonth(latestMonth);
  const daysInMonth = Number(monthEnd.slice(-2));
  const sortedDates = [...monthRows].map((r) => r.date).sort();
  const lastDayInData = sortedDates[sortedDates.length - 1];
  const firstDayInData = sortedDates[0];
  const daysElapsed = daysBetween(firstDayInData, lastDayInData);

  const perUserMap = new Map<string, PerUser>();
  const perModelMap = new Map<
    string,
    { totalAic: number; totalRequests: number }
  >();
  const perDayMap = new Map<string, PerDay>();
  const perDayBreachSet = new Map<string, Set<string>>();
  const userModelMap = new Map<string, UserModelCell>();

  let totalAic = 0;
  let totalRequests = 0;

  for (const r of monthRows) {
    totalAic += r.aicGrossAmount;
    totalRequests += r.quantity;

    let u = perUserMap.get(r.username);
    if (!u) {
      u = {
        username: r.username,
        totalAic: 0,
        totalRequests: 0,
        exceedsQuota: false,
        perDay: [],
        perModel: [],
      };
      perUserMap.set(r.username, u);
    }
    u.totalAic += r.aicGrossAmount;
    u.totalRequests += r.quantity;
    if (r.exceedsQuota) u.exceedsQuota = true;
    let uDay = u.perDay.find((d) => d.date === r.date);
    if (!uDay) {
      uDay = { date: r.date, aic: 0 };
      u.perDay.push(uDay);
    }
    uDay.aic += r.aicGrossAmount;
    let uModel = u.perModel.find((m) => m.model === r.model);
    if (!uModel) {
      uModel = { model: r.model, aic: 0 };
      u.perModel.push(uModel);
    }
    uModel.aic += r.aicGrossAmount;

    let mAgg = perModelMap.get(r.model);
    if (!mAgg) {
      mAgg = { totalAic: 0, totalRequests: 0 };
      perModelMap.set(r.model, mAgg);
    }
    mAgg.totalAic += r.aicGrossAmount;
    mAgg.totalRequests += r.quantity;

    let pd = perDayMap.get(r.date);
    if (!pd) {
      pd = { date: r.date, totalAic: 0, byUser: {}, byModel: {}, breachedUsers: [] };
      perDayMap.set(r.date, pd);
    }
    pd.totalAic += r.aicGrossAmount;
    pd.byUser[r.username] = (pd.byUser[r.username] ?? 0) + r.aicGrossAmount;
    pd.byModel[r.model] = (pd.byModel[r.model] ?? 0) + r.aicGrossAmount;
    if (r.exceedsQuota) {
      let breachSet = perDayBreachSet.get(r.date);
      if (!breachSet) {
        breachSet = new Set<string>();
        perDayBreachSet.set(r.date, breachSet);
      }
      breachSet.add(r.username);
    }

    const cellKey = `${r.username}|${r.model}`;
    const cell = userModelMap.get(cellKey);
    if (cell) {
      cell.aic += r.aicGrossAmount;
    } else {
      userModelMap.set(cellKey, {
        username: r.username,
        model: r.model,
        aic: r.aicGrossAmount,
      });
    }
  }

  const perUser = [...perUserMap.values()].sort(
    (a, b) => b.totalAic - a.totalAic
  );
  perUser.forEach((u) => {
    u.perDay.sort((a, b) => a.date.localeCompare(b.date));
    u.perModel.sort((a, b) => b.aic - a.aic);
  });
  const perModel: PerModel[] = [...perModelMap.entries()]
    .map(([model, v]) => ({
      model,
      totalAic: v.totalAic,
      totalRequests: v.totalRequests,
      costPerRequest: v.totalRequests > 0 ? v.totalAic / v.totalRequests : 0,
    }))
    .sort((a, b) => b.totalAic - a.totalAic);
  const perDay = [...perDayMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  perDay.forEach((d) => {
    const set = perDayBreachSet.get(d.date);
    d.breachedUsers = set ? [...set].sort() : [];
  });
  const userModel = [...userModelMap.values()];

  return {
    rowCount: monthRows.length,
    totalAic,
    totalRequests,
    activeUsernames: perUser.map((u) => u.username),
    models: perModel.map((m) => m.model),
    perUser,
    perModel,
    perDay,
    userModel,
    monthStart,
    monthEnd,
    daysInMonth,
    lastDayInData,
    daysElapsed,
    spannedMonths,
  };
}
