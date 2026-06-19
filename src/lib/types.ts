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
  totalMonthlyQuota: number;
  organization: string;
  costCenterName: string;
  aicQuantity: number;
  aicGrossAmount: number;
};

export type ForecastMode = "linear" | "rolling7";

export type ForecastGrowth = "conservative" | "moderate" | "aggressive";

export type SubscriptionTier = "business" | "enterprise";

export type Settings = {
  purchasedSlots: number;
  tier: SubscriptionTier;
  seatPrice: number;       // USD paid per seat (= base included credits)
  promoBonus: number;      // bonus credits per seat during promo months (gifted)
  overageBudget: number;
  forecastMode: ForecastMode;
  burnRateGroupBy: "user" | "model";
  forecastGrowth: ForecastGrowth;
  tableSort: { column: string; direction: "asc" | "desc" };
  obfuscateUsernames: boolean;
};

export type PerUser = {
  username: string;
  totalAic: number;
  totalCredits: number;
  perDay: { date: string; aic: number }[];
  perModel: { model: string; aic: number }[];
};

export type PerModel = {
  model: string;
  totalAic: number;
  totalCredits: number;
  costPerCredit: number;
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
  totalCredits: number;
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
  seatPrice: number;              // USD paid per seat (idle-waste basis)
  includedCreditsPerSeat: number; // credits per seat for current month (promo-aware)
  overageBudget: number;
  totalPool: number;              // purchasedSlots * includedCreditsPerSeat + overageBudget
  spent: number;
  remaining: number;
  percentUsed: number;            // 0..1
  fairSharePerSeat: number;       // = includedCreditsPerSeat
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
