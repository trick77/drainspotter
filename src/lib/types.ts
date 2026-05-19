export type UsageRow = {
  date: string;            // ISO YYYY-MM-DD
  username: string;
  product: string;
  sku: string;
  model: string;
  quantity: number;
  unitType: string;
  appliedCostPerQuantity: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  exceedsQuota: boolean;
  totalMonthlyQuota: number;
  organization: string;
  costCenterName: string;
  aicQuantity: number;
  aicGrossAmount: number;
};

export type ForecastMode = "linear" | "rolling7";

export type DateRange = "7d" | "14d" | "all";

export type Settings = {
  purchasedSlots: number;
  costPerSeat: number;
  forecastMode: ForecastMode;
  burnRateGroupBy: "user" | "model";
  dateRange: DateRange;
  tableSort: { column: string; direction: "asc" | "desc" };
};

export type PerUser = {
  username: string;
  totalAic: number;
  totalRequests: number;
  exceedsQuota: boolean;
  perDay: { date: string; aic: number }[];
  perModel: { model: string; aic: number }[];
};

export type PerModel = {
  model: string;
  totalAic: number;
  totalRequests: number;
  costPerRequest: number;
};

export type PerDay = {
  date: string;
  totalAic: number;
  byUser: Record<string, number>;
  byModel: Record<string, number>;
};

export type UserModelCell = {
  username: string;
  model: string;
  aic: number;
};

export type Aggregations = {
  rowCount: number;
  totalAic: number;
  totalRequests: number;
  activeUsernames: string[];
  models: string[];
  perUser: PerUser[];
  perModel: PerModel[];
  perDay: PerDay[];
  userModel: UserModelCell[];
  monthStart: string;             // ISO first day of latest month in data
  monthEnd: string;               // ISO last day of latest month in data
  daysInMonth: number;
  lastDayInData: string;          // ISO
  daysElapsed: number;
  spannedMonths: string[];        // ISO YYYY-MM list (>1 → warn)
};

export type PoolState = {
  purchasedSlots: number;
  costPerSeat: number;
  totalPool: number;              // purchasedSlots * costPerSeat
  spent: number;
  remaining: number;
  percentUsed: number;            // 0..1
  fairSharePerSeat: number;
  activeSeats: number;
  idleSeats: number;              // max(0, purchasedSlots - activeSeats)
};

export type Forecast = {
  mode: ForecastMode;
  dailyAvg: number;
  forecastEoM: number;
  forecastVsPool: number;          // forecastEoM - totalPool
  pierceDate: string | null;       // ISO date forecast crosses pool, or null
  dailyProjection: { date: string; projected: number }[];
};
