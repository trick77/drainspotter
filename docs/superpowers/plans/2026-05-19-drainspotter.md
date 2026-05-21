o# dr
ainspotter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build drainspotter — a static SPA cockpit that ingests a GitHub Copilot usage CSV via drag-and-drop and visualizes it in 10 polished charts plus an EoM forecast, deployed as an nginx container behind Traefik.

**Architecture:** Pure client-side React app with no backend. Strict separation between computation modules in `src/lib/` (pure TS, DOM-free, fully tested via Vitest) and UI components in `src/components/`. Data flow: `CSV → parseUsageCsv() → aggregate() → {pool-math, forecaster} → Charts`. Settings via LocalStorage (`drainspotter:settings:v1`). PDF export via `window.print()` + print stylesheet (SVG stays vector).

**Tech Stack:** Vite + React 18 + TypeScript · Tailwind CSS + shadcn/ui · Recharts (Full-Custom-Theme) · PapaParse · Vitest + @testing-library/jest-dom · nginx:alpine + Containerfile + compose.yaml (Traefik-Labels)

**Spec:** `docs/superpowers/specs/2026-05-19-drainspotter-design.md`

---

## File Structure

```
drainspotter/
├── Containerfile
├── compose.yaml
├── nginx.conf
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .gitignore
├── public/
│   └── demo.csv                          # anonymized demo data
├── scripts/
│   └── generate-demo-csv.mjs             # one-shot generator for demo.csv
├── src/
│   ├── main.tsx
│   ├── App.tsx                           # Layout, state, orchestration
│   ├── index.css                         # Tailwind base + global CSS variables
│   ├── print.css                         # @media print Overrides
│   ├── lib/
│   │   ├── types.ts                      # UsageRow, Aggregations, PoolConfig, Forecast, Settings
│   │   ├── csv-parser.ts                 # parseUsageCsv()
│   │   ├── csv-parser.test.ts
│   │   ├── aggregator.ts                 # aggregate() rollups
│   │   ├── aggregator.test.ts
│   │   ├── pool-math.ts                  # computePool(), fairShare()
│   │   ├── pool-math.test.ts
│   │   ├── forecaster.ts                 # forecast(rows, mode)
│   │   ├── forecaster.test.ts
│   │   ├── settings-store.ts             # loadSettings(), saveSettings()
│   │   ├── settings-store.test.ts
│   │   ├── format.ts                     # de-CH locale formatters
│   │   ├── format.test.ts
│   │   └── model-colors.ts               # deterministic color map
│   ├── components/
│   │   ├── DropZone.tsx
│   │   ├── DemoDataButton.tsx
│   │   ├── PoolControls.tsx              # Slots-Slider + Cost-per-Seat-Input
│   │   ├── ForecastToggle.tsx
│   │   ├── DateRangeToggle.tsx           # 7d / 14d / all
│   │   ├── ExportPdfButton.tsx
│   │   ├── WarningBanner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ChartFrame.tsx                # glass-card wrapper für Charts
│   │   ├── ChartTooltip.tsx              # custom Recharts tooltip
│   │   ├── ChartLegend.tsx               # custom Recharts legend
│   │   ├── ChartDefs.tsx                 # SVG <defs> with all gradients
│   │   ├── charts/
│   │   │   ├── PoolGauge.tsx
│   │   │   ├── KpiTiles.tsx
│   │   │   ├── UserLeaderboard.tsx
│   │   │   ├── ParetoChart.tsx
│   │   │   ├── UserModelHeatmap.tsx
│   │   │   ├── ModelMixTreemap.tsx
│   │   │   ├── CostPerRequest.tsx
│   │   │   ├── DailyBurnRate.tsx
│   │   │   ├── PoolBurnDown.tsx
│   │   │   └── UserDetailTable.tsx
│   │   └── ui/                           # shadcn primitives (added on demand)
│   └── fixtures/
│       └── sample.csv                    # minimal fixture for tests
└── docs/
    └── superpowers/
        ├── specs/2026-05-19-drainspotter-design.md
        └── plans/2026-05-19-drainspotter.md
```

---

## Phase 1: Foundation — Repo Scaffold

### Task 1: Initial repo files (.gitignore, README placeholder)

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Write .gitignore**

```gitignore
node_modules/
dist/
.DS_Store
*.local
.env
.env.*
!.env.example
coverage/
.vite/
.superpowers/
```

- [ ] **Step 2: Initial commit**

```bash
git checkout -b feat/drainspotter-mvp
git add .gitignore docs/
git commit -m "chore: initial repo scaffold with gitignore and spec/plan"
```

### Task 2: Vite + React + TS scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (placeholder)
- Create: `src/index.css` (placeholder)

- [ ] **Step 1: Write package.json**

```json
{
  "name": "drainspotter",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "papaparse": "^5.4.1",
    "recharts": "^2.13.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.15",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4",
    "@testing-library/jest-dom": "^6.6.3",
    "jsdom": "^25.0.1",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Write tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Write vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { port: 5173 },
});
```

- [ ] **Step 5: Write vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 6: Write vitest.setup.ts**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 7: Write index.html**

```html
<!doctype html>
<html lang="de-CH" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>drainspotter — GitHub Copilot Usage Cockpit</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Write src/main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Write placeholder src/App.tsx**

```tsx
export default function App() {
  return <div className="p-8 text-white">drainspotter — scaffold</div>;
}
```

- [ ] **Step 10: Write placeholder src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}
```

- [ ] **Step 11: Install + verify build**

Run: `npm install && npm run build`
Expected: builds without error, creates `dist/`

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts vitest.setup.ts index.html src/main.tsx src/App.tsx src/index.css
git commit -m "feat: scaffold Vite + React + TS + Vitest"
```

### Task 3: Tailwind setup with theme tokens

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Write postcss.config.js**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 2: Write tailwind.config.ts with project theme**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0a0a14",
          900: "#0f172a",
          800: "#1e1b4b",
        },
        drain: {
          400: "#fb923c",
          500: "#f97316",
          600: "#f43f5e",
        },
        cool: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        pool: {
          DEFAULT: "#22d3ee",
        },
        overshoot: {
          DEFAULT: "#ef4444",
        },
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        "drain-gradient":
          "linear-gradient(90deg, #fb923c 0%, #f43f5e 100%)",
        "cool-gradient":
          "linear-gradient(90deg, #818cf8 0%, #6366f1 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Update src/index.css with base + global tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body, #root {
  min-height: 100vh;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
  background-attachment: fixed;
  color: rgb(241 245 249);
  font-feature-settings: "cv11", "ss01";
}

.tabular {
  font-variant-numeric: tabular-nums;
}

@layer components {
  .glass-card {
    @apply rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md shadow-glass;
  }
  .kpi-label {
    @apply text-xs uppercase tracking-wider text-white/60;
  }
  .kpi-value {
    @apply text-3xl font-semibold tabular bg-gradient-to-r from-white to-cool-400 bg-clip-text text-transparent;
  }
}
```

- [ ] **Step 4: Update src/App.tsx to verify theme**

```tsx
export default function App() {
  return (
    <div className="min-h-screen p-8">
      <div className="glass-card p-6 max-w-md">
        <div className="kpi-label">Pool used</div>
        <div className="kpi-value">$284</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run dev server, visually verify**

Run: `npm run dev`
Expected: Dark indigo-to-slate gradient background, glass-card with gradient number text visible at `http://localhost:5173`.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts postcss.config.js src/index.css src/App.tsx
git commit -m "feat: tailwind theme — premium glass dark, drain/cool gradients, glass-card primitive"
```

---

## Phase 2: Data Layer (TDD)

### Task 4: Domain types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write types**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: domain types — UsageRow, Aggregations, PoolState, Forecast"
```

### Task 5: format.ts — Swiss locale formatters

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/format.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- format`
Expected: All FAIL with "Cannot find module './format'"

- [ ] **Step 3: Implement format.ts**

```ts
const usdFull = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  maximumFractionDigits: 1,
});

const usdInt = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export function formatUsd(value: number): string {
  return usdFull.format(value);
}

export function formatUsdCompact(value: number): string {
  if (Math.abs(value) < 1000) return usdInt.format(Math.round(value));
  return usdCompact.format(value);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- format`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: Swiss locale formatters for USD/date/percent"
```

### Task 6: csv-parser.ts — PapaParse + validation

**Files:**
- Create: `src/fixtures/sample.csv`
- Create: `src/lib/csv-parser.ts`
- Create: `src/lib/csv-parser.test.ts`

- [ ] **Step 1: Create test fixture**

Create `src/fixtures/sample.csv` with this exact content (used for parser tests):

```csv
"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-04-01","alice","copilot","copilot_premium_request","GPT-5.4","10","requests","0.04","0.4","0.4","0","False","300","DemoOrg","","100.5","1.005"
"2026-04-01","bob","copilot","copilot_premium_request","GPT-5.3-Codex","5","requests","0.04","0.2","0.2","0","True","300","DemoOrg","","50.25","0.5025"
"2026-04-02","alice","copilot","copilot_premium_request","GPT-5.4","8","requests","0.04","0.32","0.32","0","False","300","DemoOrg","","80.1","0.801"
```

- [ ] **Step 2: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { parseUsageCsv, ParseError } from "./csv-parser";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sampleCsv = readFileSync(join(__dirname, "../fixtures/sample.csv"), "utf8");

describe("parseUsageCsv", () => {
  it("parses valid CSV with all columns", async () => {
    const result = await parseUsageCsv(sampleCsv);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].username).toBe("alice");
    expect(result.rows[0].model).toBe("GPT-5.4");
    expect(result.rows[0].aicGrossAmount).toBeCloseTo(1.005, 5);
    expect(result.rows[1].exceedsQuota).toBe(true);
    expect(result.rows[0].exceedsQuota).toBe(false);
  });

  it("treats quantity '0' as 0 number", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-04-01","alice","copilot","copilot_premium_request","GPT-5.4","0","requests","0.04","0","0","0","False","300","DemoOrg","","5","0.05"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows[0].quantity).toBe(0);
    expect(result.rows[0].aicGrossAmount).toBeCloseTo(0.05, 5);
  });

  it("rejects CSV missing required columns", async () => {
    const csv = `"date","username","model"\n"2026-04-01","alice","GPT-5.4"`;
    await expect(parseUsageCsv(csv)).rejects.toThrow(ParseError);
    await expect(parseUsageCsv(csv)).rejects.toThrow(/aic_gross_amount/);
  });

  it("returns empty rows array for header-only CSV", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows).toHaveLength(0);
  });

  it("normalizes floating-point quantity values", async () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-04-01","alice","copilot","copilot_premium_request","GPT-5.4","29.69999999999998","requests","0.04","1.188","1.188","0","False","300","DemoOrg","","185.27","1.8527"`;
    const result = await parseUsageCsv(csv);
    expect(result.rows[0].quantity).toBeCloseTo(29.7, 5);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- csv-parser`
Expected: FAIL with "Cannot find module './csv-parser'"

- [ ] **Step 4: Implement csv-parser.ts**

```ts
import Papa from "papaparse";
import type { UsageRow } from "./types";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const REQUIRED_COLUMNS = [
  "date",
  "username",
  "product",
  "sku",
  "model",
  "quantity",
  "unit_type",
  "applied_cost_per_quantity",
  "gross_amount",
  "discount_amount",
  "net_amount",
  "exceeds_quota",
  "total_monthly_quota",
  "organization",
  "cost_center_name",
  "aic_quantity",
  "aic_gross_amount",
] as const;

export type ParseResult = {
  rows: UsageRow[];
};

function num(v: unknown): number {
  if (v === "" || v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function bool(v: unknown): boolean {
  return String(v).toLowerCase() === "true";
}

export function parseUsageCsv(input: string | File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(input as any, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        try {
          const fields = results.meta.fields ?? [];
          const missing = REQUIRED_COLUMNS.filter((c) => !fields.includes(c));
          if (missing.length > 0) {
            return reject(
              new ParseError(
                `CSV missing required columns: ${missing.join(", ")}`
              )
            );
          }
          const rows: UsageRow[] = results.data.map((r) => ({
            date: String(r.date ?? "").trim(),
            username: String(r.username ?? "").trim(),
            product: String(r.product ?? "").trim(),
            sku: String(r.sku ?? "").trim(),
            model: String(r.model ?? "").trim(),
            quantity: num(r.quantity),
            unitType: String(r.unit_type ?? "").trim(),
            appliedCostPerQuantity: num(r.applied_cost_per_quantity),
            grossAmount: num(r.gross_amount),
            discountAmount: num(r.discount_amount),
            netAmount: num(r.net_amount),
            exceedsQuota: bool(r.exceeds_quota),
            totalMonthlyQuota: num(r.total_monthly_quota),
            organization: String(r.organization ?? "").trim(),
            costCenterName: String(r.cost_center_name ?? "").trim(),
            aicQuantity: num(r.aic_quantity),
            aicGrossAmount: num(r.aic_gross_amount),
          }));
          resolve({ rows });
        } catch (err) {
          reject(err);
        }
      },
      error: (err: Error) => reject(new ParseError(err.message)),
    });
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- csv-parser`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/fixtures/sample.csv src/lib/csv-parser.ts src/lib/csv-parser.test.ts
git commit -m "feat: CSV parser with validation and float normalization"
```

### Task 7: aggregator.ts — rollups

**Files:**
- Create: `src/lib/aggregator.ts`
- Create: `src/lib/aggregator.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregator";
import type { UsageRow } from "./types";

function row(over: Partial<UsageRow> = {}): UsageRow {
  return {
    date: "2026-04-01",
    username: "alice",
    product: "copilot",
    sku: "copilot_premium_request",
    model: "GPT-5.4",
    quantity: 1,
    unitType: "requests",
    appliedCostPerQuantity: 0.04,
    grossAmount: 0.04,
    discountAmount: 0,
    netAmount: 0,
    exceedsQuota: false,
    totalMonthlyQuota: 300,
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

  it("rolls up per-model with cost-per-request", () => {
    const a = aggregate([
      row({ model: "GPT-5.4", quantity: 10, aicGrossAmount: 5 }),
      row({ model: "GPT-5.4", quantity: 10, aicGrossAmount: 5 }),
      row({ model: "GPT-5.3-Codex", quantity: 5, aicGrossAmount: 20 }),
    ]);
    expect(a.perModel).toHaveLength(2);
    const codex = a.perModel.find((m) => m.model === "GPT-5.3-Codex")!;
    expect(codex.totalAic).toBeCloseTo(20, 5);
    expect(codex.costPerRequest).toBeCloseTo(4, 5);
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
    expect(a.totalAic).toBeCloseTo(5, 5); // only April kept
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

  it("propagates exceedsQuota per user", () => {
    const a = aggregate([
      row({ username: "alice", exceedsQuota: false }),
      row({ username: "alice", exceedsQuota: true }),
    ]);
    expect(a.perUser[0].exceedsQuota).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- aggregator`
Expected: FAIL with "Cannot find module './aggregator'"

- [ ] **Step 3: Implement aggregator.ts**

```ts
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
  const d = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of m
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
  const userModelMap = new Map<string, UserModelCell>();

  let totalAic = 0;
  let totalRequests = 0;

  for (const r of monthRows) {
    totalAic += r.aicGrossAmount;
    totalRequests += r.quantity;

    // perUser
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

    // perModel
    let mAgg = perModelMap.get(r.model);
    if (!mAgg) {
      mAgg = { totalAic: 0, totalRequests: 0 };
      perModelMap.set(r.model, mAgg);
    }
    mAgg.totalAic += r.aicGrossAmount;
    mAgg.totalRequests += r.quantity;

    // perDay
    let pd = perDayMap.get(r.date);
    if (!pd) {
      pd = { date: r.date, totalAic: 0, byUser: {}, byModel: {} };
      perDayMap.set(r.date, pd);
    }
    pd.totalAic += r.aicGrossAmount;
    pd.byUser[r.username] = (pd.byUser[r.username] ?? 0) + r.aicGrossAmount;
    pd.byModel[r.model] = (pd.byModel[r.model] ?? 0) + r.aicGrossAmount;

    // userModel
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- aggregator`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/aggregator.ts src/lib/aggregator.test.ts
git commit -m "feat: aggregator — per-user/per-model/per-day rollups + multi-month detection"
```

### Task 8: pool-math.ts

**Files:**
- Create: `src/lib/pool-math.ts`
- Create: `src/lib/pool-math.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- pool-math`
Expected: FAIL

- [ ] **Step 3: Implement pool-math.ts**

```ts
import type { PoolState } from "./types";

export type PoolInput = {
  purchasedSlots: number;
  costPerSeat: number;
  spent: number;
  activeUsernames: string[];
};

export function computePool(input: PoolInput): PoolState {
  const totalPool = input.purchasedSlots * input.costPerSeat;
  const fairSharePerSeat = input.costPerSeat;
  const activeSeats = input.activeUsernames.length;
  const idleSeats = Math.max(0, input.purchasedSlots - activeSeats);
  const remaining = totalPool - input.spent;
  const percentUsed = totalPool > 0 ? input.spent / totalPool : 0;
  return {
    purchasedSlots: input.purchasedSlots,
    costPerSeat: input.costPerSeat,
    totalPool,
    spent: input.spent,
    remaining,
    percentUsed,
    fairSharePerSeat,
    activeSeats,
    idleSeats,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- pool-math`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/pool-math.ts src/lib/pool-math.test.ts
git commit -m "feat: pool-math — pool size, fair share, active/idle seats"
```

### Task 9: forecaster.ts

**Files:**
- Create: `src/lib/forecaster.ts`
- Create: `src/lib/forecaster.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
          { date: "2026-04-01", totalAic: 10, byUser: {}, byModel: {} },
          { date: "2026-04-02", totalAic: 10, byUser: {}, byModel: {} },
          { date: "2026-04-03", totalAic: 10, byUser: {}, byModel: {} },
          { date: "2026-04-04", totalAic: 10, byUser: {}, byModel: {} },
          { date: "2026-04-05", totalAic: 10, byUser: {}, byModel: {} },
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
      totalAic: i < 3 ? 100 : 20, // last 7 days each have 20
      byUser: {},
      byModel: {},
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
    // recent avg = 20, remaining days = 20, forecast = 440 + 400 = 840
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
        })),
      }),
      "linear",
      150
    );
    // daily avg 10, projected crosses 150 on day 15 = 2026-04-15
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- forecaster`
Expected: FAIL

- [ ] **Step 3: Implement forecaster.ts**

```ts
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

  let dailyAvg: number;
  if (mode === "linear") {
    dailyAvg = a.totalAic / a.daysElapsed;
  } else {
    // rolling7: average of last 7 days (or fewer if data short)
    const lastN = a.perDay.slice(-7);
    const sum = lastN.reduce((s, d) => s + d.totalAic, 0);
    dailyAvg = lastN.length > 0 ? sum / lastN.length : 0;
  }

  // Build cumulative dailyProjection over the full month
  const allDates = iterDates(a.monthStart, a.daysInMonth);
  const actualByDate = new Map(a.perDay.map((d) => [d.date, d.totalAic]));
  let cum = 0;
  const dailyProjection = allDates.map((date) => {
    if (date <= a.lastDayInData) {
      cum += actualByDate.get(date) ?? 0;
    } else {
      cum += dailyAvg;
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- forecaster`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/forecaster.ts src/lib/forecaster.test.ts
git commit -m "feat: forecaster — linear + rolling7 with pierceDate"
```

### Task 10: settings-store.ts

**Files:**
- Create: `src/lib/settings-store.ts`
- Create: `src/lib/settings-store.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "./settings-store";

beforeEach(() => {
  localStorage.clear();
});

describe("settings-store", () => {
  it("returns DEFAULT_SETTINGS when nothing stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips settings via saveSettings + loadSettings", () => {
    const s = {
      ...DEFAULT_SETTINGS,
      purchasedSlots: 42,
      costPerSeat: 49,
      forecastMode: "rolling7" as const,
    };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it("merges partial stored settings with defaults", () => {
    localStorage.setItem(
      "drainspotter:settings:v1",
      JSON.stringify({ purchasedSlots: 7 })
    );
    const loaded = loadSettings();
    expect(loaded.purchasedSlots).toBe(7);
    expect(loaded.costPerSeat).toBe(DEFAULT_SETTINGS.costPerSeat);
  });

  it("falls back to defaults on corrupt JSON", () => {
    localStorage.setItem("drainspotter:settings:v1", "{not-json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- settings-store`
Expected: FAIL

- [ ] **Step 3: Implement settings-store.ts**

```ts
import type { Settings } from "./types";

const KEY = "drainspotter:settings:v1";

export const DEFAULT_SETTINGS: Settings = {
  purchasedSlots: 100,
  costPerSeat: 19,
  forecastMode: "linear",
  burnRateGroupBy: "user",
  dateRange: "all",
  tableSort: { column: "totalAic", direction: "desc" },
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota or privacy mode — ignore
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- settings-store`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/settings-store.ts src/lib/settings-store.test.ts
git commit -m "feat: LocalStorage settings store with defaults + corruption recovery"
```

### Task 11: model-colors.ts

**Files:**
- Create: `src/lib/model-colors.ts`

- [ ] **Step 1: Implement deterministic color hash**

```ts
const PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#fb7185", // rose
  "#fb923c", // orange
  "#facc15", // yellow
  "#84cc16", // lime
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function modelColor(model: string): string {
  return PALETTE[hash(model) % PALETTE.length];
}

export function modelColorWithAlpha(model: string, alpha: number): string {
  const hex = modelColor(model);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/model-colors.ts
git commit -m "feat: deterministic model→color hash from 8-color palette"
```

---

## Phase 3: Demo CSV Generator

### Task 12: Generate anonymized demo CSV

**Files:**
- Create: `scripts/generate-demo-csv.mjs`
- Create: `scripts/source-real.csv` (place user-provided sample here, NOT committed)
- Create: `public/demo.csv` (generated, committed)

- [ ] **Step 1: Add scripts/source-real.csv to .gitignore**

```bash
echo "scripts/source-real.csv" >> .gitignore
```

- [ ] **Step 2: Write the generator script**

```js
// scripts/generate-demo-csv.mjs
// Reads scripts/source-real.csv (user-provided real sample),
// anonymizes usernames into top-drainers/lurkers/middle-pool,
// writes public/demo.csv.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOP_DRAINERS = [
  "gastown-steve",            // explicitly #1
  "chief-token-officer",
  "lord-of-the-pool",
  "count-contextula",
  "sir-burns-a-lot",
  "duke-of-drain",
  "promptzilla",
  "token-shredder",
  "quota-muncher",
  "voldetoken",
];

const BOTTOM_LURKERS = [
  "copilot-bünzli",         // lowest spender > 0
  "lizenz-leiche",
  "enablement-target",
  "quota-coward",
  "token-tumbleweed",
  "untapped-potential",
  "ghost-coder",
  "inference-abstainer",
  "auto-complete-amish",
  "still-on-stackoverflow",
];

const MIDDLE_POOL = [
  "coffee-driven-dev",
  "regex-rita",
  "merge-conflict-mary",
  "bug-magnet",
  "rubber-ducker",
  "semicolon-skipper",
  "cache-miss-carl",
  "null-pointer-nina",
  "stale-branch-bob",
  "force-push-fred",
  "off-by-one-olivia",
  "yaml-yorick",
  "regex-overlord",
  "typo-tornado",
  "diff-detective",
  "rebase-renegade",
  "lint-larry",
  "ci-whisperer",
  "monorepo-monk",
  "schema-shaman",
  "mock-master",
  "scope-creep-sam",
  "edge-case-edgar",
  "callback-cassandra",
  "hotfix-hank",
  "stack-tracer",
  "log-spelunker",
  "deadlock-dora",
  "race-condition-rocco",
  "memory-leak-lulu",
  "feature-flag-flo",
  "graphql-gremlin",
  "promise-pauline",
  "async-anders",
  "json-jongleur",
  "regex-runaway",
  "ssh-samurai",
  "cron-conductor",
  "kubernetes-koen",
  "docker-dietrich",
  "terraform-tilda",
  "ansible-anna",
  "grafana-gunter",
  "prometheus-pete",
  "kafka-klaus",
  "redis-renate",
  "postgres-petra",
  "elastic-ernst",
  "kibana-karim",
  "git-gardener",
];

function parseCsv(input) {
  // very small CSV parser for our well-formed source
  const lines = input.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  const header = parseLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const cells = parseLine(l);
    const o = {};
    header.forEach((h, i) => (o[h] = cells[i] ?? ""));
    return o;
  });
  return { header, rows };
}

function parseLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (c === '"') {
      inQ = !inQ;
    } else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function quoteCsv(v) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

const src = readFileSync(join(__dirname, "source-real.csv"), "utf8");
const { header, rows } = parseCsv(src);

// Totals per original username
const totals = new Map();
for (const r of rows) {
  const u = r.username;
  const aic = parseFloat(r.aic_gross_amount || "0") || 0;
  totals.set(u, (totals.get(u) ?? 0) + aic);
}

const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]);
const aliasFor = new Map();

// Top drainers: top 10 by spend, descending → drainer list in order
for (let i = 0; i < TOP_DRAINERS.length && i < ordered.length; i++) {
  aliasFor.set(ordered[i][0], TOP_DRAINERS[i]);
}

// Bottom lurkers: lowest spenders with > 0 total (excluding zeros)
const positiveTotals = ordered.filter(([, v]) => v > 0);
const lurkerSlice = positiveTotals.slice(-BOTTOM_LURKERS.length).reverse();
// reverse so the absolute lowest gets BOTTOM_LURKERS[0] = copilot-bünzli
lurkerSlice.forEach(([user], i) => {
  if (!aliasFor.has(user)) aliasFor.set(user, BOTTOM_LURKERS[i]);
});

// Middle: everyone else gets a middle-pool name; pool exhausted → dev-NN
let poolIdx = 0;
let devNumber = 1;
for (const [user] of ordered) {
  if (aliasFor.has(user)) continue;
  if (poolIdx < MIDDLE_POOL.length) {
    aliasFor.set(user, MIDDLE_POOL[poolIdx++]);
  } else {
    aliasFor.set(user, `dev-${String(devNumber++).padStart(2, "0")}`);
  }
}

const outHeader = header.map(quoteCsv).join(",");
const outRows = rows.map((r) => {
  const transformed = { ...r, username: aliasFor.get(r.username) ?? r.username, organization: "DemoOrg" };
  return header.map((h) => quoteCsv(transformed[h])).join(",");
});

writeFileSync(
  join(__dirname, "..", "public", "demo.csv"),
  [outHeader, ...outRows].join("\n") + "\n"
);

console.log(`Wrote public/demo.csv — ${rows.length} rows, ${aliasFor.size} unique users.`);
console.log("Top drainer mapping:");
[...aliasFor.entries()]
  .filter(([, alias]) => TOP_DRAINERS.includes(alias))
  .forEach(([orig, alias]) => console.log(`  ${orig} → ${alias}`));
console.log("Bottom lurker mapping:");
[...aliasFor.entries()]
  .filter(([, alias]) => BOTTOM_LURKERS.includes(alias))
  .forEach(([orig, alias]) => console.log(`  ${orig} → ${alias}`));
```

- [ ] **Step 3: User provides source-real.csv**

User saves their original CSV from the brainstorming conversation to `scripts/source-real.csv` (NOT committed — see .gitignore).

- [ ] **Step 4: Run generator**

Run: `mkdir -p public && node scripts/generate-demo-csv.mjs`
Expected: writes `public/demo.csv`, prints mapping summary to stdout.

- [ ] **Step 5: Sanity-check the output**

Run: `head -5 public/demo.csv && echo "---" && grep -c gastown-steve public/demo.csv`
Expected: header line + 4 data rows shown; `gastown-steve` appears in ≥1 row.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-demo-csv.mjs public/demo.csv .gitignore
git commit -m "feat: demo CSV generator with funny aliases (top drainers + lurkers + middle pool)"
```

---

## Phase 4: App Shell + Controls

### Task 13: ChartFrame, EmptyState, WarningBanner primitives

**Files:**
- Create: `src/components/ChartFrame.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/WarningBanner.tsx`

- [ ] **Step 1: Write ChartFrame.tsx**

```tsx
import { ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartFrame({ title, subtitle, actions, children, className }: Props) {
  return (
    <div className={clsx("glass-card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="kpi-label">{title}</div>
          {subtitle && <div className="text-sm text-white/50 mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Write EmptyState.tsx**

```tsx
import { ReactNode } from "react";

type Props = { icon?: ReactNode; title: string; description?: string };

export function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-white/60">
      {icon && <div className="mb-3 text-white/40">{icon}</div>}
      <div className="font-medium text-white/80">{title}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Write WarningBanner.tsx**

```tsx
import { AlertTriangle } from "lucide-react";

type Props = { children: React.ReactNode };

export function WarningBanner({ children }: Props) {
  return (
    <div className="glass-card border-amber-400/40 bg-amber-400/10 p-3 flex items-start gap-3 text-sm text-amber-100">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ChartFrame.tsx src/components/EmptyState.tsx src/components/WarningBanner.tsx
git commit -m "feat: ChartFrame + EmptyState + WarningBanner primitives"
```

### Task 14: DropZone

**Files:**
- Create: `src/components/DropZone.tsx`

- [ ] **Step 1: Write DropZone.tsx**

```tsx
import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { clsx } from "clsx";

type Props = {
  onFile: (file: File) => void;
  hero?: boolean;
};

export function DropZone({ onFile, hero = false }: Props) {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={clsx(
        "glass-card flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
        "border-dashed",
        hero ? "p-16 min-h-[60vh]" : "p-8",
        isOver
          ? "border-drain-400 bg-drain-400/10 shadow-[0_0_60px_rgba(251,146,60,0.3)]"
          : "border-white/20 hover:border-white/40"
      )}
    >
      <Upload className={clsx("text-white/60", hero ? "w-16 h-16" : "w-8 h-8")} />
      <div className="text-center">
        <div className={clsx("font-medium", hero ? "text-2xl" : "text-base")}>
          CSV hier ablegen oder klicken
        </div>
        <div className="text-sm text-white/50 mt-1">
          GitHub Copilot premiumRequestUsageReport
        </div>
      </div>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handlePick}
      />
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DropZone.tsx
git commit -m "feat: drag/drop CSV upload component with hero variant"
```

### Task 15: PoolControls (Slots + Cost-per-Seat)

**Files:**
- Create: `src/components/PoolControls.tsx`

- [ ] **Step 1: Write PoolControls.tsx**

```tsx
import { formatUsd } from "@/lib/format";

type Props = {
  slots: number;
  costPerSeat: number;
  onSlotsChange: (v: number) => void;
  onCostChange: (v: number) => void;
};

export function PoolControls({ slots, costPerSeat, onSlotsChange, onCostChange }: Props) {
  const pool = slots * costPerSeat;
  return (
    <div className="glass-card p-5 flex flex-col md:flex-row gap-6 items-stretch md:items-center">
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="kpi-label">Gekaufte Slots</div>
          <div className="text-2xl font-semibold tabular text-white">{slots}</div>
        </div>
        <input
          type="range"
          min={1}
          max={500}
          value={slots}
          onChange={(e) => onSlotsChange(parseInt(e.target.value, 10))}
          className="w-full accent-drain-400"
          aria-label="Anzahl gekaufter Slots"
        />
      </div>
      <div className="md:w-48">
        <div className="kpi-label mb-2">Cost/Seat (USD)</div>
        <input
          type="number"
          min={0}
          step={1}
          value={costPerSeat}
          onChange={(e) => onCostChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right tabular focus:outline-none focus:border-drain-400"
          aria-label="Cost per Seat"
        />
        <div className="text-xs text-white/40 mt-1">Promo Jun–Aug: $49</div>
      </div>
      <div className="md:w-48 text-right">
        <div className="kpi-label mb-2">Pool</div>
        <div className="kpi-value">{formatUsd(pool)}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PoolControls.tsx
git commit -m "feat: PoolControls — slots slider + cost-per-seat input"
```

### Task 16: ForecastToggle + DateRangeToggle + ExportPdfButton + DemoDataButton

**Files:**
- Create: `src/components/ForecastToggle.tsx`
- Create: `src/components/DateRangeToggle.tsx`
- Create: `src/components/ExportPdfButton.tsx`
- Create: `src/components/DemoDataButton.tsx`

- [ ] **Step 1: Write ForecastToggle.tsx**

```tsx
import type { ForecastMode } from "@/lib/types";
import { clsx } from "clsx";

type Props = { value: ForecastMode; onChange: (v: ForecastMode) => void };

const OPTIONS: { value: ForecastMode; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "rolling7", label: "7-Tage-Avg" },
];

export function ForecastToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-3 py-1 text-xs rounded-md transition-colors",
            value === o.value
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write DateRangeToggle.tsx**

```tsx
import type { DateRange } from "@/lib/types";
import { clsx } from "clsx";

type Props = { value: DateRange; onChange: (v: DateRange) => void };

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "14d", label: "14d" },
  { value: "all", label: "Monat" },
];

export function DateRangeToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-3 py-1 text-xs rounded-md transition-colors",
            value === o.value
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write ExportPdfButton.tsx**

```tsx
import { FileDown } from "lucide-react";

export function ExportPdfButton() {
  return (
    <button
      onClick={() => window.print()}
      className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/8 transition-colors"
    >
      <FileDown className="w-4 h-4" />
      PDF exportieren
    </button>
  );
}
```

- [ ] **Step 4: Write DemoDataButton.tsx**

```tsx
import { Sparkles } from "lucide-react";

type Props = { onLoad: (file: File) => void };

export function DemoDataButton({ onLoad }: Props) {
  const handleClick = async () => {
    const res = await fetch("/demo.csv");
    const blob = await res.blob();
    const file = new File([blob], "demo.csv", { type: "text/csv" });
    onLoad(file);
  };
  return (
    <button
      onClick={handleClick}
      className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/8 transition-colors"
    >
      <Sparkles className="w-4 h-4 text-drain-400" />
      Beispieldaten laden
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ForecastToggle.tsx src/components/DateRangeToggle.tsx src/components/ExportPdfButton.tsx src/components/DemoDataButton.tsx
git commit -m "feat: ForecastToggle, DateRangeToggle, ExportPdfButton, DemoDataButton"
```

### Task 17: App.tsx orchestration (state + layout shell)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx with full orchestration**

```tsx
import { useEffect, useMemo, useState } from "react";
import { parseUsageCsv, ParseError } from "@/lib/csv-parser";
import { aggregate } from "@/lib/aggregator";
import { computePool } from "@/lib/pool-math";
import { forecast } from "@/lib/forecaster";
import { loadSettings, saveSettings } from "@/lib/settings-store";
import type { UsageRow, Settings } from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { DemoDataButton } from "@/components/DemoDataButton";
import { PoolControls } from "@/components/PoolControls";
import { ForecastToggle } from "@/components/ForecastToggle";
import { DateRangeToggle } from "@/components/DateRangeToggle";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { WarningBanner } from "@/components/WarningBanner";

export default function App() {
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const { rows } = await parseUsageCsv(file);
      setRows(rows);
    } catch (e) {
      if (e instanceof ParseError) setError(e.message);
      else setError(String(e));
      setRows(null);
    }
  };

  const aggregations = useMemo(() => (rows ? aggregate(rows) : null), [rows]);
  const pool = useMemo(
    () =>
      aggregations
        ? computePool({
            purchasedSlots: settings.purchasedSlots,
            costPerSeat: settings.costPerSeat,
            spent: aggregations.totalAic,
            activeUsernames: aggregations.activeUsernames,
          })
        : null,
    [aggregations, settings.purchasedSlots, settings.costPerSeat]
  );
  const fc = useMemo(
    () =>
      aggregations && pool
        ? forecast(aggregations, settings.forecastMode, pool.totalPool)
        : null,
    [aggregations, pool, settings.forecastMode]
  );

  return (
    <div className="min-h-screen px-6 py-6 md:px-10 md:py-8 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between mb-8 print:mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-white to-cool-400 bg-clip-text text-transparent">
            drainspotter
          </h1>
          <p className="text-sm text-white/50 mt-1">
            GitHub Copilot Usage Cockpit
          </p>
        </div>
        {rows && (
          <div className="flex items-center gap-2 print:hidden">
            <ExportPdfButton />
          </div>
        )}
      </header>

      {error && (
        <div className="mb-6">
          <WarningBanner>{error}</WarningBanner>
        </div>
      )}

      {!rows && (
        <div className="flex flex-col gap-4">
          <DropZone onFile={handleFile} hero />
          <div className="flex justify-center">
            <DemoDataButton onLoad={handleFile} />
          </div>
        </div>
      )}

      {rows && aggregations && pool && fc && (
        <>
          {aggregations.spannedMonths.length > 1 && (
            <div className="mb-6">
              <WarningBanner>
                CSV enthält Daten aus mehreren Monaten (
                {aggregations.spannedMonths.join(", ")}). Es wird nur der
                neueste Monat ({aggregations.monthStart.slice(0, 7)})
                analysiert.
              </WarningBanner>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mb-6">
            <PoolControls
              slots={settings.purchasedSlots}
              costPerSeat={settings.costPerSeat}
              onSlotsChange={(v) =>
                setSettings({ ...settings, purchasedSlots: v })
              }
              onCostChange={(v) =>
                setSettings({ ...settings, costPerSeat: v })
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
            <span className="text-xs text-white/50 uppercase tracking-wider">
              Forecast
            </span>
            <ForecastToggle
              value={settings.forecastMode}
              onChange={(v) => setSettings({ ...settings, forecastMode: v })}
            />
            <span className="text-xs text-white/50 uppercase tracking-wider ml-4">
              Range
            </span>
            <DateRangeToggle
              value={settings.dateRange}
              onChange={(v) => setSettings({ ...settings, dateRange: v })}
            />
            <div className="ml-auto">
              <DropZone onFile={handleFile} />
            </div>
          </div>

          <div
            id="charts-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {/* Charts wired in subsequent tasks */}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server**

Run: `npm run dev`
Expected: Empty state with hero DropZone and "Load demo data" visible. Clicking the demo button loads the CSV, controls appear, charts grid empty (placeholder).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App shell with state orchestration, settings persistence, controls"
```

---

## Phase 5: Visual Primitives (ChartDefs, Tooltip, Legend)

### Task 18: ChartDefs — shared SVG gradients

**Files:**
- Create: `src/components/ChartDefs.tsx`

- [ ] **Step 1: Write ChartDefs.tsx**

```tsx
export function ChartDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="drainBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
        </linearGradient>
        <linearGradient id="drainBarH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.9} />
        </linearGradient>
        <linearGradient id="drainArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coolArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="coolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="poolLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 2: Mount in App.tsx (top of return)**

In `src/App.tsx`, import and mount at the top of the returned `<div>`:

```tsx
import { ChartDefs } from "@/components/ChartDefs";
// ...
return (
  <div className="min-h-screen px-6 py-6 md:px-10 md:py-8 max-w-[1600px] mx-auto">
    <ChartDefs />
    {/* rest unchanged */}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChartDefs.tsx src/App.tsx
git commit -m "feat: shared SVG gradient defs for chart polish"
```

### Task 19: ChartTooltip — custom Recharts tooltip

**Files:**
- Create: `src/components/ChartTooltip.tsx`

- [ ] **Step 1: Write ChartTooltip.tsx**

```tsx
import { formatUsd, formatDate } from "@/lib/format";

type Payload = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
};

type Props = {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  labelFormatter?: (l: string | number) => string;
  valueFormatter?: (v: number) => string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = formatUsd,
}: Props) {
  if (!active || !payload || payload.length === 0) return null;
  const labelStr =
    labelFormatter && label !== undefined
      ? labelFormatter(label)
      : typeof label === "string" && /^\d{4}-\d{2}-\d{2}$/.test(label)
      ? formatDate(label)
      : String(label ?? "");
  return (
    <div className="glass-card px-3 py-2 text-xs min-w-[160px]">
      {labelStr && <div className="text-white/60 mb-1">{labelStr}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-white/80 flex-1 truncate">{p.name}</span>
            <span className="tabular text-white font-medium">
              {typeof p.value === "number" ? valueFormatter(p.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChartTooltip.tsx
git commit -m "feat: custom glass-card tooltip for Recharts"
```

### Task 20: ChartLegend — custom Recharts legend

**Files:**
- Create: `src/components/ChartLegend.tsx`

- [ ] **Step 1: Write ChartLegend.tsx**

```tsx
type Payload = { value: string; color: string; type?: string };

type Props = { payload?: Payload[] };

export function ChartLegend({ payload = [] }: Props) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center pt-2 text-xs text-white/70">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: p.color }}
          />
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChartLegend.tsx
git commit -m "feat: custom chart legend"
```

---

## Phase 6: Charts — 10 implementations

> **TDD note for charts:** Charts are verified visually with the demo CSV (per spec: "No component testing in the MVP — charts are verified visually"). Each task ends with a manual verification step on `npm run dev` + demo data.

### Task 21: Chart 1 — KpiTiles

**Files:**
- Create: `src/components/charts/KpiTiles.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write KpiTiles.tsx**

```tsx
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { formatUsd, formatPercent } from "@/lib/format";
import type { Aggregations, PoolState, Forecast } from "@/lib/types";

type Props = {
  aggregations: Aggregations;
  pool: PoolState;
  forecast: Forecast;
};

function Tile({
  label,
  value,
  delta,
  spark,
  intent = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  spark?: { date: string; v: number }[];
  intent?: "neutral" | "warn" | "danger";
}) {
  const sparkColor =
    intent === "danger" ? "#f43f5e" : intent === "warn" ? "#fb923c" : "#818cf8";
  return (
    <div className="glass-card p-4 relative overflow-hidden h-[140px] flex flex-col justify-between">
      {spark && spark.length > 1 && (
        <div className="absolute inset-0 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={sparkColor}
                fillOpacity={0.15}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="relative">
        <div className="kpi-label">{label}</div>
      </div>
      <div className="relative">
        <div className="kpi-value">{value}</div>
        {delta && (
          <div
            className={
              intent === "danger"
                ? "text-xs text-rose-400 mt-1"
                : intent === "warn"
                ? "text-xs text-amber-400 mt-1"
                : "text-xs text-white/50 mt-1"
            }
          >
            {delta}
          </div>
        )}
      </div>
    </div>
  );
}

export function KpiTiles({ aggregations, pool, forecast }: Props) {
  const spark = aggregations.perDay.map((d) => ({ date: d.date, v: d.totalAic }));
  const overshoot = forecast.forecastVsPool > 0;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 col-span-full">
      <Tile
        label="Spent"
        value={formatUsd(pool.spent)}
        delta={`${formatPercent(pool.percentUsed)} of pool`}
        spark={spark}
      />
      <Tile
        label="Pool total"
        value={formatUsd(pool.totalPool)}
        delta={`${pool.purchasedSlots} slots × $${pool.costPerSeat}`}
      />
      <Tile
        label="Forecast EoM"
        value={formatUsd(forecast.forecastEoM)}
        delta={
          overshoot
            ? `+${formatUsd(forecast.forecastVsPool)} over pool`
            : `${formatUsd(Math.abs(forecast.forecastVsPool))} under pool`
        }
        spark={spark}
        intent={overshoot ? "danger" : "neutral"}
      />
      <Tile
        label="Active seats"
        value={String(pool.activeSeats)}
        delta={`${pool.idleSeats} idle of ${pool.purchasedSlots}`}
        intent={pool.idleSeats > pool.purchasedSlots / 2 ? "warn" : "neutral"}
      />
      <Tile
        label="Pierce date"
        value={forecast.pierceDate ? forecast.pierceDate.slice(-2) + "." : "—"}
        delta={
          forecast.pierceDate
            ? `Pool reisst am ${forecast.pierceDate.slice(-5).replace("-", ".")}`
            : "Pool reicht bis Monatsende"
        }
        intent={forecast.pierceDate ? "danger" : "neutral"}
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire into App.tsx charts-grid**

In `src/App.tsx`, add the import and replace the empty charts-grid div content:

```tsx
import { KpiTiles } from "@/components/charts/KpiTiles";
// ...
<div id="charts-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  <KpiTiles aggregations={aggregations} pool={pool} forecast={fc} />
</div>
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`, load demo data.
Expected: 5 KPI tiles span the grid, each with sparkline backgrounds, gradient values. Pierce-Date tile in red if forecast overshoots.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/KpiTiles.tsx src/App.tsx
git commit -m "feat: chart 1 — KpiTiles with sparkline backgrounds"
```

### Task 22: Chart 2 — PoolGauge

**Files:**
- Create: `src/components/charts/PoolGauge.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write PoolGauge.tsx**

```tsx
import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd, formatPercent } from "@/lib/format";
import type { PoolState, Forecast } from "@/lib/types";

type Props = { pool: PoolState; forecast: Forecast };

export function PoolGauge({ pool, forecast }: Props) {
  const size = 240;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // half circle
  const spentFraction = Math.min(1, pool.percentUsed);
  const forecastFraction = pool.totalPool > 0 ? Math.min(2, forecast.forecastEoM / pool.totalPool) : 0;
  const spentLen = circumference * spentFraction;
  const overshoot = forecastFraction > 1;
  const forecastLen = circumference * Math.min(1, forecastFraction);
  const overshootLen = overshoot ? circumference * (forecastFraction - 1) : 0;

  return (
    <ChartFrame title="Pool-Gauge" subtitle={`${formatPercent(pool.percentUsed)} verbraucht`}>
      <div className="relative h-[260px] flex items-end justify-center">
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          {/* Track */}
          <path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Spent fill */}
          <path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke="url(#drainBarH)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${spentLen} ${circumference}`}
            style={{ transition: "stroke-dasharray 600ms ease-out" }}
          />
          {/* Forecast marker line */}
          {forecast.forecastEoM > pool.spent && pool.totalPool > 0 && (
            <path
              d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
              fill="none"
              stroke={overshoot ? "#ef4444" : "#818cf8"}
              strokeWidth={stroke * 0.4}
              strokeLinecap="round"
              strokeDasharray={`${forecastLen} ${circumference}`}
              opacity={0.6}
            />
          )}
          {/* Overshoot zone */}
          {overshoot && (
            <text
              x={size - 12}
              y={size / 2 - 4}
              textAnchor="end"
              fill="#ef4444"
              fontSize={11}
              fontWeight={600}
            >
              ! over budget
            </text>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
          <div className="text-4xl font-semibold tabular bg-gradient-to-r from-white to-cool-400 bg-clip-text text-transparent">
            {formatUsd(pool.spent)}
          </div>
          <div className="text-xs text-white/50 mt-1">
            von {formatUsd(pool.totalPool)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            Forecast: {formatUsd(forecast.forecastEoM)}
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx (after KpiTiles)**

```tsx
import { PoolGauge } from "@/components/charts/PoolGauge";
// In charts-grid div:
<PoolGauge pool={pool} forecast={fc} />
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`, load demo, push slots-slider to make pool overshoot.
Expected: Half-donut animates on mount; orange-rose fill sweeps to spent fraction; forecast marker shows in indigo (or red if overshooting); centered gradient value.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/PoolGauge.tsx src/App.tsx
git commit -m "feat: chart 2 — PoolGauge with sweep animation and overshoot"
```

### Task 23: Chart 3 — UserLeaderboard

**Files:**
- Create: `src/components/charts/UserLeaderboard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write UserLeaderboard.tsx**

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import type { Aggregations, PoolState } from "@/lib/types";

type Props = { aggregations: Aggregations; pool: PoolState; topN?: number };

export function UserLeaderboard({ aggregations, pool, topN = 12 }: Props) {
  const data = aggregations.perUser.slice(0, topN).map((u) => ({
    user: u.username,
    spent: u.totalAic,
  }));
  return (
    <ChartFrame
      title="Top Drainer"
      subtitle={`Top ${data.length} User · Fair-Share = ${formatUsd(pool.fairSharePerSeat)}`}
      className="col-span-1 md:col-span-2"
    >
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={formatUsdCompact}
            />
            <YAxis
              type="category"
              dataKey="user"
              tickLine={false}
              axisLine={false}
              width={150}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => formatUsd(v)}
                  labelFormatter={(l) => `User: ${l}`}
                />
              }
            />
            <ReferenceLine
              x={pool.fairSharePerSeat}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              label={{ value: "Fair-Share", fill: "#22d3ee", fontSize: 10, position: "top" }}
            />
            <Bar dataKey="spent" radius={[0, 6, 6, 0]} fill="url(#drainBarH)" name="Spent">
              {data.map((_, i) => (
                <Cell key={i} fill="url(#drainBarH)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { UserLeaderboard } from "@/components/charts/UserLeaderboard";
// In charts-grid:
<UserLeaderboard aggregations={aggregations} pool={pool} />
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`, load demo.
Expected: horizontal bar chart with `gastown-steve` at top, gradient bars, Fair-Share line visible (cyan dashed) at $19 mark.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/UserLeaderboard.tsx src/App.tsx
git commit -m "feat: chart 3 — UserLeaderboard with gradient bars and fair-share line"
```

### Task 24: Chart 4 — ParetoChart

**Files:**
- Create: `src/components/charts/ParetoChart.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write ParetoChart.tsx**

```tsx
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { formatUsd, formatPercent } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

export function ParetoChart({ aggregations }: Props) {
  const total = aggregations.totalAic || 1;
  let cum = 0;
  const data = aggregations.perUser.map((u, i) => {
    cum += u.totalAic;
    return {
      rank: i + 1,
      user: u.username,
      spent: u.totalAic,
      cumPct: cum / total,
    };
  });
  // find the index where cumPct first crosses 0.8
  const eightyIdx = data.findIndex((d) => d.cumPct >= 0.8);
  return (
    <ChartFrame
      title="Pareto"
      subtitle={
        eightyIdx >= 0
          ? `Top ${eightyIdx + 1} User ≙ 80 % des Pool-Spends`
          : "Konzentrations-Verteilung"
      }
    >
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="rank"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              tickFormatter={(v) => formatPercent(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(v) => (v <= 1 ? formatPercent(v) : formatUsd(v))}
                  labelFormatter={(l) => `Rank ${l}`}
                />
              }
            />
            <Bar yAxisId="left" dataKey="spent" fill="url(#drainBar)" name="Spent" radius={[3, 3, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumPct"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              name="Cumulative %"
              isAnimationActive
            />
            <ReferenceLine yAxisId="right" y={0.8} stroke="#22d3ee" strokeDasharray="2 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { ParetoChart } from "@/components/charts/ParetoChart";
// In charts-grid:
<ParetoChart aggregations={aggregations} />
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo.
Expected: bars + cumulative line, 80% horizontal reference line.

```bash
git add src/components/charts/ParetoChart.tsx src/App.tsx
git commit -m "feat: chart 4 — Pareto with cumulative line and 80% reference"
```

### Task 25: Chart 5 — UserModelHeatmap

**Files:**
- Create: `src/components/charts/UserModelHeatmap.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write UserModelHeatmap.tsx**

```tsx
import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations; topNUsers?: number };

function intensityColor(t: number): string {
  // t ∈ [0..1] — interpolate indigo → orange → rose
  if (t <= 0) return "rgba(255,255,255,0.04)";
  if (t < 0.5) {
    const k = t / 0.5;
    const r = Math.round(129 + (251 - 129) * k);
    const g = Math.round(140 + (146 - 140) * k);
    const b = Math.round(248 + (60 - 248) * k);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.6})`;
  }
  const k = (t - 0.5) / 0.5;
  const r = Math.round(251 + (244 - 251) * k);
  const g = Math.round(146 + (63 - 146) * k);
  const b = Math.round(60 + (94 - 60) * k);
  return `rgba(${r}, ${g}, ${b}, ${0.6 + t * 0.4})`;
}

export function UserModelHeatmap({ aggregations, topNUsers = 15 }: Props) {
  const users = aggregations.perUser.slice(0, topNUsers).map((u) => u.username);
  const models = aggregations.perModel.map((m) => m.model);
  const cellMap = new Map(
    aggregations.userModel.map((c) => [`${c.username}|${c.model}`, c.aic])
  );
  let max = 0;
  for (const u of users) for (const m of models) max = Math.max(max, cellMap.get(`${u}|${m}`) ?? 0);

  return (
    <ChartFrame
      title="User × Modell Heatmap"
      subtitle="Wer setzt schwergewichtig auf welches Modell"
      className="col-span-full"
    >
      <div className="overflow-x-auto">
        <table className="text-xs border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th className="text-left text-white/40 font-normal px-2 py-1 sticky left-0 bg-transparent" />
              {models.map((m) => (
                <th
                  key={m}
                  className="text-white/40 font-normal px-1.5 py-1 align-bottom"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", minWidth: 28 }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u}>
                <td className="text-white/80 px-2 py-1 sticky left-0 bg-transparent whitespace-nowrap">
                  {u}
                </td>
                {models.map((m) => {
                  const v = cellMap.get(`${u}|${m}`) ?? 0;
                  const t = max > 0 ? v / max : 0;
                  return (
                    <td
                      key={m}
                      title={`${u} · ${m}: ${formatUsd(v)}`}
                      className="rounded-md transition-transform hover:scale-110"
                      style={{
                        background: intensityColor(t),
                        width: 28,
                        height: 28,
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { UserModelHeatmap } from "@/components/charts/UserModelHeatmap";
// In charts-grid:
<UserModelHeatmap aggregations={aggregations} />
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo.
Expected: full-width heatmap with hot orange/rose cells where top users concentrate on specific models.

```bash
git add src/components/charts/UserModelHeatmap.tsx src/App.tsx
git commit -m "feat: chart 5 — UserModelHeatmap with smooth color interpolation"
```

### Task 26: Chart 6 — ModelMixTreemap

**Files:**
- Create: `src/components/charts/ModelMixTreemap.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write ModelMixTreemap.tsx**

```tsx
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { modelColor } from "@/lib/model-colors";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

type TreemapNode = {
  name: string;
  size: number;
  color: string;
};

function CustomContent(props: any) {
  const { x, y, width, height, name, color } = props;
  const showLabel = width > 60 && height > 36;
  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={color}
        rx={6}
        ry={6}
        style={{ transition: "filter 150ms" }}
      />
      {showLabel && (
        <text x={x + 10} y={y + 22} fill="white" fontSize={12} fontWeight={500} pointerEvents="none">
          {name}
        </text>
      )}
    </g>
  );
}

export function ModelMixTreemap({ aggregations }: Props) {
  const data: TreemapNode[] = aggregations.perModel.map((m) => ({
    name: m.model,
    size: m.totalAic,
    color: modelColor(m.model),
  }));
  return (
    <ChartFrame title="Modell-Mix" subtitle="$-Anteil pro Modell">
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={data} dataKey="size" stroke="rgba(0,0,0,0.2)" content={<CustomContent />} isAnimationActive>
            <Tooltip content={<ChartTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { ModelMixTreemap } from "@/components/charts/ModelMixTreemap";
// In charts-grid:
<ModelMixTreemap aggregations={aggregations} />
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo.
Expected: treemap with rounded model cells, larger cells = bigger models.

```bash
git add src/components/charts/ModelMixTreemap.tsx src/App.tsx
git commit -m "feat: chart 6 — Treemap with rounded cells and deterministic colors"
```

### Task 27: Chart 7 — CostPerRequest

**Files:**
- Create: `src/components/charts/CostPerRequest.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write CostPerRequest.tsx**

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { modelColor } from "@/lib/model-colors";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

export function CostPerRequest({ aggregations }: Props) {
  const data = [...aggregations.perModel]
    .filter((m) => m.totalRequests > 0)
    .sort((a, b) => b.costPerRequest - a.costPerRequest)
    .map((m) => ({
      model: m.model,
      cpr: m.costPerRequest,
    }));
  return (
    <ChartFrame
      title="Cost per Request"
      subtitle="$ pro Inferenz, je Modell — niedriger = effizienter"
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <YAxis
              type="category"
              dataKey="model"
              tickLine={false}
              axisLine={false}
              width={140}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => formatUsd(v)}
                  labelFormatter={(l) => `Modell: ${l}`}
                />
              }
            />
            <Bar dataKey="cpr" radius={[0, 6, 6, 0]} name="$/Request">
              {data.map((d, i) => (
                <Cell key={i} fill={modelColor(d.model)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx + commit**

```tsx
import { CostPerRequest } from "@/components/charts/CostPerRequest";
// In charts-grid:
<CostPerRequest aggregations={aggregations} />
```

```bash
git add src/components/charts/CostPerRequest.tsx src/App.tsx
git commit -m "feat: chart 7 — CostPerRequest horizontal bars by model"
```

### Task 28: Chart 8 — DailyBurnRate

**Files:**
- Create: `src/components/charts/DailyBurnRate.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write DailyBurnRate.tsx**

```tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { ChartLegend } from "@/components/ChartLegend";
import { modelColor } from "@/lib/model-colors";
import { formatUsd, formatUsdCompact, formatDate } from "@/lib/format";
import type { Aggregations, DateRange } from "@/lib/types";
import { clsx } from "clsx";

type Props = {
  aggregations: Aggregations;
  groupBy: "user" | "model";
  onGroupByChange: (g: "user" | "model") => void;
  dateRange: DateRange;
  topN?: number;
};

function filterByRange(data: { date: string }[], lastDay: string, range: DateRange) {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : 14;
  const [y, m, d] = lastDay.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d - days + 1)).toISOString().slice(0, 10);
  return data.filter((row) => row.date >= cutoff);
}

export function DailyBurnRate({
  aggregations,
  groupBy,
  onGroupByChange,
  dateRange,
  topN = 6,
}: Props) {
  const filtered = filterByRange(aggregations.perDay, aggregations.lastDayInData, dateRange);
  const topKeys =
    groupBy === "user"
      ? aggregations.perUser.slice(0, topN).map((u) => u.username)
      : aggregations.perModel.slice(0, topN).map((m) => m.model);
  const data = filtered.map((d) => {
    const src = groupBy === "user" ? d.byUser : d.byModel;
    const row: Record<string, string | number> = { date: d.date };
    let other = 0;
    for (const [k, v] of Object.entries(src)) {
      if (topKeys.includes(k)) row[k] = v;
      else other += v;
    }
    topKeys.forEach((k) => {
      if (!(k in row)) row[k] = 0;
    });
    row["other"] = other;
    return row;
  });
  const colorFor = (k: string) =>
    k === "other"
      ? "rgba(255,255,255,0.2)"
      : groupBy === "model"
      ? modelColor(k)
      : modelColor(`user:${k}`);
  return (
    <ChartFrame
      title="Daily Burn-Rate"
      subtitle={`Stacked, gruppiert nach ${groupBy === "user" ? "User" : "Modell"}`}
      className="col-span-full"
      actions={
        <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1 print:hidden">
          {(["user", "model"] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGroupByChange(g)}
              className={clsx(
                "px-3 py-1 text-xs rounded-md transition-colors",
                groupBy === g ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              )}
            >
              {g === "user" ? "User" : "Modell"}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatDate(v).slice(0, 5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={formatUsdCompact}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }}
              content={<ChartTooltip valueFormatter={formatUsd} />}
            />
            <Legend content={<ChartLegend />} />
            {[...topKeys, "other"].map((k) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                stackId="1"
                stroke={colorFor(k)}
                fill={colorFor(k)}
                fillOpacity={0.6}
                isAnimationActive
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { DailyBurnRate } from "@/components/charts/DailyBurnRate";
// In charts-grid:
<DailyBurnRate
  aggregations={aggregations}
  groupBy={settings.burnRateGroupBy}
  onGroupByChange={(g) => setSettings({ ...settings, burnRateGroupBy: g })}
  dateRange={settings.dateRange}
/>
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo, toggle User/Model + 7d/14d/Month.
Expected: stacked area chart re-renders smoothly.

```bash
git add src/components/charts/DailyBurnRate.tsx src/App.tsx
git commit -m "feat: chart 8 — DailyBurnRate stacked area with user/model toggle and range filter"
```

### Task 29: Chart 9 — PoolBurnDown

**Files:**
- Create: `src/components/charts/PoolBurnDown.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write PoolBurnDown.tsx**

```tsx
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { formatUsd, formatUsdCompact, formatDate } from "@/lib/format";
import type { Aggregations, PoolState, Forecast, DateRange } from "@/lib/types";

type Props = {
  aggregations: Aggregations;
  pool: PoolState;
  forecast: Forecast;
  dateRange: DateRange;
};

function filterByRange(data: { date: string }[], lastDay: string, range: DateRange) {
  if (range === "all") return data;
  const days = range === "7d" ? 7 : 14;
  const [y, m, d] = lastDay.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d - days + 1)).toISOString().slice(0, 10);
  return data.filter((row) => row.date >= cutoff);
}

export function PoolBurnDown({ aggregations, pool, forecast, dateRange }: Props) {
  const all = forecast.dailyProjection.map((d) => ({
    date: d.date,
    actual: d.date <= aggregations.lastDayInData ? d.projected : null,
    projected: d.date > aggregations.lastDayInData ? d.projected : null,
    pool: pool.totalPool,
  }));
  const data = filterByRange(all, aggregations.lastDayInData, dateRange);
  return (
    <ChartFrame
      title="Pool Burn-Down + Forecast"
      subtitle={
        forecast.pierceDate
          ? `Pool reisst am ${formatDate(forecast.pierceDate)}`
          : "Pool hält bis Monatsende"
      }
      className="col-span-full"
    >
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatDate(v).slice(0, 5)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={formatUsdCompact}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }}
              content={<ChartTooltip valueFormatter={formatUsd} />}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#fb923c"
              fill="url(#drainArea)"
              strokeWidth={2.5}
              isAnimationActive
              name="Spent (Ist)"
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#818cf8"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive
              name="Forecast"
            />
            <ReferenceLine
              y={pool.totalPool}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: "Pool", fill: "#22d3ee", fontSize: 11, position: "right" }}
            />
            {forecast.pierceDate && (
              <ReferenceLine
                x={forecast.pierceDate}
                stroke="#ef4444"
                strokeDasharray="2 4"
                label={{ value: "Pool reisst", fill: "#ef4444", fontSize: 10, position: "top" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { PoolBurnDown } from "@/components/charts/PoolBurnDown";
// In charts-grid:
<PoolBurnDown aggregations={aggregations} pool={pool} forecast={fc} dateRange={settings.dateRange} />
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo.
Expected: orange filled-area for actual + indigo dashed forecast + cyan dashed pool line; pierce-date annotation when forecast crosses pool.

```bash
git add src/components/charts/PoolBurnDown.tsx src/App.tsx
git commit -m "feat: chart 9 — PoolBurnDown with actual+forecast+pool line+pierce annotation"
```

### Task 30: Chart 10 — UserDetailTable

**Files:**
- Create: `src/components/charts/UserDetailTable.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write UserDetailTable.tsx**

```tsx
import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations, PoolState } from "@/lib/types";
import { clsx } from "clsx";

type Props = { aggregations: Aggregations; pool: PoolState };

type SortKey = "username" | "totalAic" | "totalRequests" | "share";

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return <span className="text-white/30">—</span>;
  const max = Math.max(...data);
  const w = 80;
  const h = 24;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = h - (max > 0 ? (v / max) * (h - 4) : 0) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function UserDetailTable({ aggregations, pool }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "totalAic",
    dir: "desc",
  });
  const rows = [...aggregations.perUser].map((u) => ({
    ...u,
    share: pool.totalPool > 0 ? u.totalAic / pool.totalPool : 0,
  }));
  rows.sort((a, b) => {
    const av = a[sort.key as keyof typeof a];
    const bv = b[sort.key as keyof typeof b];
    if (typeof av === "string" && typeof bv === "string") {
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sort.dir === "asc"
      ? Number(av) - Number(bv)
      : Number(bv) - Number(av);
  });

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      className="text-left px-3 py-2 text-xs uppercase tracking-wider text-white/50 cursor-pointer select-none"
      onClick={() => toggleSort(k)}
    >
      {children}
      {sort.key === k && <span className="ml-1">{sort.dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );

  return (
    <ChartFrame title="User-Details" subtitle={`${rows.length} aktive User`} className="col-span-full">
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-900/80 backdrop-blur-sm">
            <tr>
              <Th k="username">User</Th>
              <Th k="totalAic">Spent</Th>
              <Th k="totalRequests">Requests</Th>
              <Th k="share">% Pool</Th>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-white/50">
                7-Tage-Trend
              </th>
              <th className="px-3 py-2 text-xs uppercase tracking-wider text-white/50">Quota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const sparkData = u.perDay.slice(-7).map((d) => d.aic);
              const over = u.totalAic > pool.fairSharePerSeat;
              return (
                <tr key={u.username} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 tabular">{u.username}</td>
                  <td
                    className={clsx(
                      "px-3 py-2 tabular",
                      over ? "text-drain-400" : "text-white"
                    )}
                  >
                    {formatUsd(u.totalAic)}
                  </td>
                  <td className="px-3 py-2 tabular text-white/70">
                    {u.totalRequests.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 tabular text-white/70">
                    {(u.share * 100).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2">
                    <MiniSpark data={sparkData} color={over ? "#fb923c" : "#818cf8"} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {u.exceedsQuota && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-300 animate-pulse">
                        exceeded
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Wire into App.tsx**

```tsx
import { UserDetailTable } from "@/components/charts/UserDetailTable";
// In charts-grid:
<UserDetailTable aggregations={aggregations} pool={pool} />
```

- [ ] **Step 3: Visual verify + commit**

Run: `npm run dev`, load demo, click headers.
Expected: table sorts; sparklines visible; users over fair-share in orange; `exceeds_quota` users get pulsing rose pill.

```bash
git add src/components/charts/UserDetailTable.tsx src/App.tsx
git commit -m "feat: chart 10 — UserDetailTable with sparklines, sort, quota badges"
```

---

## Phase 7: Print stylesheet + Polish

### Task 31: Print stylesheet

**Files:**
- Create: `src/print.css`
- Modify: `src/index.css`

- [ ] **Step 1: Write src/print.css**

```css
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  html, body {
    background: white !important;
  }

  body {
    color: #0f172a !important;
    background: white !important;
  }

  .glass-card {
    background: white !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    page-break-inside: avoid;
  }

  .kpi-label {
    color: #475569 !important;
  }

  .kpi-value {
    background: none !important;
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
  }

  h1 {
    color: #0f172a !important;
    background: none !important;
    -webkit-text-fill-color: #0f172a !important;
  }

  .print\\:hidden {
    display: none !important;
  }

  #charts-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8mm !important;
  }

  #charts-grid > * {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Force full-width charts to break to their own page */
  .col-span-full {
    grid-column: 1 / -1 !important;
    page-break-before: always;
  }

  text, .recharts-text {
    fill: #475569 !important;
  }
}
```

- [ ] **Step 2: Import print.css in src/index.css**

Append to `src/index.css`:

```css
@import "./print.css";
```

- [ ] **Step 3: Visual verify**

Run: `npm run dev`, load demo, hit `Cmd/Ctrl+P` or click `ExportPdfButton`.
Expected: Print preview shows white background, dark text, all 10 charts spread across pages without glass effects.

- [ ] **Step 4: Commit**

```bash
git add src/print.css src/index.css
git commit -m "feat: print stylesheet — white-on-paper A4 with page-breaks"
```

---

## Phase 8: Container + Deployment

### Task 32: Containerfile + nginx.conf

**Files:**
- Create: `Containerfile`
- Create: `nginx.conf`

- [ ] **Step 1: Write Containerfile**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O - http://localhost/ >/dev/null || exit 1
```

- [ ] **Step 2: Write nginx.conf**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 3: Build + smoke-test container locally**

Run:
```bash
docker build -f Containerfile -t drainspotter:dev .
docker run --rm -p 8080:80 drainspotter:dev
```
Then `curl -s http://localhost:8080/ | head -3` in another terminal.
Expected: returns HTML with `<title>drainspotter`.

- [ ] **Step 4: Commit**

```bash
git add Containerfile nginx.conf
git commit -m "feat: multi-stage Containerfile (node-build → nginx-serve) + SPA-fallback nginx conf"
```

### Task 33: compose.yaml with Traefik labels

**Files:**
- Create: `compose.yaml`

- [ ] **Step 1: Ask user for concrete Traefik domain + cert-resolver name**

If unknown, use placeholders `drainspotter.example.com` and `letsencrypt` — the user must replace these before deploying. Document this in the commit message.

- [ ] **Step 2: Write compose.yaml**

```yaml
services:
  drainspotter:
    build:
      context: .
      dockerfile: Containerfile
    image: drainspotter:latest
    container_name: drainspotter
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik"
      - "traefik.http.routers.drainspotter.rule=Host(`drainspotter.example.com`)"
      - "traefik.http.routers.drainspotter.entrypoints=websecure"
      - "traefik.http.routers.drainspotter.tls=true"
      - "traefik.http.routers.drainspotter.tls.certresolver=letsencrypt"
      - "traefik.http.services.drainspotter.loadbalancer.server.port=80"

networks:
  traefik:
    external: true
```

- [ ] **Step 3: Commit**

```bash
git add compose.yaml
git commit -m "feat: compose.yaml with Traefik labels (REPLACE drainspotter.example.com + letsencrypt before deploy)"
```

---

## Phase 9: Verification

### Task 34: End-to-end manual verification

- [ ] **Step 1: Fresh install + dev**

```bash
rm -rf node_modules dist
npm install
npm run dev
```

Open `http://localhost:5173`.
Expected: Empty state with hero DropZone and "Load demo data" button.

- [ ] **Step 2: Demo data flow**

Click "Load demo data".
Expected: All 10 charts render. `gastown-steve` appears as Top-1 in UserLeaderboard. `copilot-bünzli` appears at the bottom of UserDetailTable when sorted ascending by Spent.

- [ ] **Step 3: Controls**

- Drag the Slots-Slider from 100 → 200. PoolGauge re-renders smoothly.
- Change Cost-per-Seat to 49. Pool doubles.
- Toggle Forecast: linear ↔ rolling7. KpiTiles + PoolBurnDown re-render.
- Toggle Range: 7d → 14d → Month. DailyBurnRate + PoolBurnDown filter accordingly.
- Toggle DailyBurnRate User/Model.
- Sort UserDetailTable by clicking headers.

Expected: every interaction updates instantly; no visible re-mount flicker.

- [ ] **Step 4: Settings persistence**

Refresh the page. All slider/toggle values persist (CSV data not).

- [ ] **Step 5: Re-upload**

Drop a different CSV. Replaces immediately, settings retained.

- [ ] **Step 6: Multi-month warning**

Create a CSV with rows in two months. Drop it. Expected: amber WarningBanner appears, only latest month analyzed.

- [ ] **Step 7: Bad CSV**

Drop a CSV missing `aic_gross_amount` column. Expected: amber WarningBanner with "CSV missing required columns: aic_gross_amount".

- [ ] **Step 8: PDF export**

Click "Export PDF". Print preview opens. Confirm:
- White background
- All 10 charts visible across pages
- Numbers readable
- No glass/blur artifacts
- SVG charts crisp at any zoom

- [ ] **Step 9: Build + container**

```bash
npm test
npm run build
docker build -f Containerfile -t drainspotter:test .
docker run --rm -p 8080:80 drainspotter:test
```

Open `http://localhost:8080`. Same flow as dev.

- [ ] **Step 10: Lighthouse**

In Chrome DevTools, run Lighthouse Performance audit on `http://localhost:8080`. Score should be > 90. If lower, investigate (likely culprits: large Recharts bundle — try `import { LineChart } from "recharts"` patterns / lazy-loading charts).

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "chore: verification pass — all 10 charts, controls, persistence, PDF, container" --allow-empty
```

### Task 35: Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/drainspotter-mvp
```

- [ ] **Step 2: Create PR**

Use `gh pr create` with descriptive title. Target `master` (per user's branch convention).

```bash
gh pr create --title "feat: drainspotter MVP — 10-chart Copilot usage cockpit" --body "$(cat <<'EOF'
## Summary
- Vite+React+TS+Tailwind+Recharts SPA
- 10 polished charts: PoolGauge, KpiTiles, UserLeaderboard, Pareto, UserModelHeatmap, ModelMixTreemap, CostPerRequest, DailyBurnRate, PoolBurnDown, UserDetailTable
- Linear + 7-Tage-Avg Forecast with pool-pierce detection
- Settings persistence via LocalStorage
- PDF export via window.print() + print-stylesheet
- nginx-container + compose.yaml with Traefik labels
- Demo CSV with funny aliases (gastown-steve #1 drainer, copilot-bünzli #1 lurker)

## Test plan
- [x] `npm test` (Vitest)
- [x] `npm run dev` + demo data + every chart renders
- [x] All controls (slider, toggles) update reactively
- [x] Settings persist across reload
- [x] PDF export legible on paper
- [x] `docker compose up --build` runs behind Traefik (after replacing placeholder domain)
EOF
)"
```

---

## Self-Review Notes (inline fixes already applied)

- Spec section "10 Questions → 10 Charts" — covered by Tasks 21–30.
- Spec section "Pool & Forecast Math" — covered by Tasks 8–9.
- Spec section "Error Handling" — covered by Tasks 6 (parser), 17 (multi-month banner + parse error banner).
- Spec section "Visual Design Notes Chart-Polish Requirements" — gradients in Task 18 ChartDefs, custom tooltip in Task 19, custom legend in Task 20, animated mount via `isAnimationActive` in each chart, rounded bars via `radius={[]}` in Tasks 23/27, dashed gridlines via `strokeDasharray="4 4"` in charts that have grids.
- Spec section "Locale: Swiss" — covered by Task 5 (`format.ts`).
- Spec section "Demo CSV with Top-Drainer/Bottom-Lurker/Middle-Pool" — Task 12.
- Spec section "Print/PDF" — Task 31.
- Spec section "Container/compose/Traefik" — Tasks 32–33.
- Spec section "LocalStorage settings" — Task 10 + wiring in Task 17.

No placeholders / TBDs in any step. Function signatures consistent across tasks (`computePool`, `aggregate`, `forecast`, `parseUsageCsv` referenced and defined identically wherever they appear).
