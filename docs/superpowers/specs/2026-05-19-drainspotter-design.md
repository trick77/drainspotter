# drainspotter — Design

**Date:** 2026-05-19
**Status:** Draft for review

## Context

As of June 1, 2026, GitHub Copilot switches to usage-based billing. Each Business seat ($19/month) comes with $19 in AI Credits; during the promotional months June–August 2026 an additional $30 is included. Credits are not reserved per seat — they flow into a shared org pool that all active users draw from.

GitHub provides a CSV report (`premiumRequestUsageReport_*.csv`) with per-user, per-model, per-day consumption — both in the legacy PRU world (`gross_amount`) and in the new AI-Credit world (`aic_gross_amount`, USD).

drainspotter is a local browser cockpit you drag and drop the CSV into. From that data the tool answers a set of related questions about AI-credit consumption and pool utilization:

- **Pool status:** How much of the shared budget has already been spent? How much remains?
- **Forecast:** Does the budget last until end of month at the current burn rate — or does the pool run dry?
- **Top drainers:** Which users spend the most? Who is above or below their fair share per seat?
- **Concentration:** How is consumption distributed — Pareto-style (a few users drive the majority) or spread broadly?
- **Model mix:** Which models are eating the pool? Where is the money going — into expensive Codex Max calls or spread across many models?
- **Model efficiency:** What does each model cost per request? Where is the lever for cheaper defaults?
- **User × model:** Which users rely heavily on which models (e.g., a single user dominating an expensive model)?
- **Burn over time:** When does the pool burn — steadily, or in burst peaks on individual days?
- **Seat utilization:** How many purchased slots are active? How many are we paying for but sitting idle?
- **Quota risk:** Who has exceeded their monthly limit (`exceeds_quota`) or is close to doing so?

No data leaves the browser.

## Scope

**In-Scope (MVP):**
- Drag/drop CSV upload
- 10 charts (see Components)
- Sliders: number of purchased slots + cost per seat in USD (default $19, manually set to $49 during promo months)
- End-of-month forecast (linear + 7-day average, with toggle)
- Date range toggle (`7d / 14d / all`) — filters only the time-series charts (DailyBurnRate, PoolBurnDown). Pool calculation and forecast remain monthly
- **Persistent settings via LocalStorage:** slot count, cost per seat, forecast mode, DailyBurnRate grouping (user/model), range toggle, sort order of UserDetailTable. Key: `drainspotter:settings:v1`. The CSV data itself is **not** persisted (privacy + size).
- **Bundled demo CSV:** A "Load sample data" button in the empty state loads a prepared CSV from `/public/demo.csv`. Content: a real sample provided by the user (15 days, April 1–15 2026, all models, ~120 users), with usernames anonymized as follows:
    - **Top drainers** (highest total `aic_gross_amount`): receive aristocratic-villain glutton names. **`gastown-steve` is explicitly the #1 top drainer** (mapped to the real user with the highest total spend). Ranks 2–10 in descending spend order: `chief-token-officer`, `lord-of-the-pool`, `count-contextula`, `sir-burns-a-lot`, `duke-of-drain`, `promptzilla`, `token-shredder`, `quota-muncher`, `voldetoken`
    - **Bottom-10 non-drainers** (lowest total `aic_gross_amount` > 0): receive lurker/license-zombie names, in ascending spend order (i.e., `copilot-bünzli` = absolute lowest): `copilot-bünzli`, `lizenz-leiche`, `enablement-target`, `quota-coward`, `token-tumbleweed`, `untapped-potential`, `ghost-coder`, `inference-abstainer`, `auto-complete-amish`, `still-on-stackoverflow`
    - **Middle-band users** (everyone in between, ~100 in the demo sample): assigned deterministically from a **pool of ~50 neutral dev-funny names** (mildly humorous, dev-culture themed, less extreme than top/bottom). Examples: `coffee-driven-dev`, `regex-rita`, `merge-conflict-mary`, `bug-magnet`, `rubber-ducker`, `semicolon-skipper`, `cache-miss-carl`, `null-pointer-nina`, `stale-branch-bob`, `force-push-fred`, and similar. When the pool is exhausted, additional users are mapped to `dev-NN` (two digits, zero-padded).
    - Each original username gets **exactly one** alias consistently across all rows (same person → same alias → correct heatmap/leaderboard data)
    - All numeric columns (`quantity`, `aic_quantity`, `aic_gross_amount`, etc.) remain **unchanged 1:1**
    - The organization column is set to `DemoOrg`
- **PDF export via `window.print()` + print stylesheet:** An "Export PDF" button triggers the native print dialog. Print CSS switches to A4 layout, white-on-paper theme (no glass/blur), explicit page breaks between sections. SVG charts remain vector.
- Locale: Swiss locale (`$1'234.56`, date `DD.MM.YYYY`, `de-CH` via `Intl.NumberFormat`/`DateTimeFormat`)
- Container deployment via `compose.yaml` + `Containerfile`, behind Traefik

**Re-upload UX:** Dropping a second CSV immediately replaces the existing data (no confirmation dialog); settings (LocalStorage) are preserved.

**Multi-month data in one CSV:** Warning banner + automatic filtering to the most recent month in the dataset.

**Out-of-Scope (YAGNI):**
- Multi-month history / merging multiple CSVs
- Auth, persistence, backend
- Anonymizing user CSVs (real names are fine, data stays local)
- Light-mode toggle — premium glass dark only
- USD/Credits toggle — always USD via `aic_gross_amount`
- i18n of UI strings — UI is pragmatically English (only numbers/dates are locale-formatted)

## Stack

- **Build:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui primitives (Button, Card, Slider, Toggle, Table, Tooltip)
- **Look & Feel:** "Premium glass" — dark indigo→slate gradient background, semi-transparent cards with `backdrop-blur`, orange→rose accent gradients for drainer visualization. Font: Inter
- **Charts:** Recharts (covers Bar, Area, Line, Pie/Donut, custom Heatmap, Scatter)
- **CSV:** PapaParse (streaming, robust against number-parsing quirks in the Copilot CSV)
- **Tests:** Vitest for CSV parser, aggregator, forecaster, pool math
- **Container:** Multi-stage Containerfile (`node:20-alpine` build → `nginx:alpine` serve), `compose.yaml` with Traefik labels for external routing

## Architecture / Units

Clean separation between pure calculation modules (testable without DOM) and UI components:

```
src/
├── lib/
│   ├── csv-parser.ts        # PapaParse + Validierung + Normalisierung
│   ├── types.ts             # UsageRow, Aggregations, PoolConfig, Forecast, Settings
│   ├── aggregator.ts        # rollups: per-user, per-model, per-day, user×model
│   ├── forecaster.ts        # linear + 7-day-avg Forecast
│   ├── pool-math.ts         # pool size, fair-share, deltas, exceeded?
│   └── settings-store.ts    # LocalStorage Get/Set + Schema-Migration via Version-Key
├── components/
│   ├── DropZone.tsx
│   ├── DemoDataButton.tsx   # lädt /assets/demo.csv im Empty-State
│   ├── PoolControls.tsx     # Slider gekaufte Slots, Cost-per-Seat Input
│   ├── ForecastToggle.tsx
│   ├── DateRangeToggle.tsx  # 7d / 14d / all
│   ├── ExportPdfButton.tsx  # triggert window.print()
│   ├── charts/
│   │   ├── PoolGauge.tsx
│   │   ├── KpiTiles.tsx
│   │   ├── UserLeaderboard.tsx
│   │   ├── ParetoChart.tsx
│   │   ├── UserModelHeatmap.tsx
│   │   ├── ModelMixTreemap.tsx
│   │   ├── CostPerRequest.tsx
│   │   ├── DailyBurnRate.tsx
│   │   ├── PoolBurnDown.tsx
│   │   └── UserDetailTable.tsx
│   └── ui/                  # shadcn-Primitive
├── App.tsx                  # Layout: Header + DropZone + Controls + Charts-Grid
└── main.tsx
```

**Boundaries:**
- `lib/*` has no knowledge of React or the DOM — pure data in, pure data out
- Charts receive pre-computed aggregations as props and perform no calculations themselves
- `App.tsx` orchestrates: holds state (CSV data, pool config, forecast mode), applies `aggregator` and `forecaster` via `useMemo`, and passes results down to charts

## Data Flow

```
File-Drop
  → csv-parser.parseUsageCsv(File): UsageRow[]
  → setRows(rows)
  
  ┌─ aggregator.aggregate(rows): Aggregations ─┐
  │   (per-user, per-model, per-day, etc.)     │
  └────────────────────────────────────────────┘
  
  ┌─ pool-math.computePool({slots, costPerSeat, rows}): PoolState ─┐
  │   (totalPool$, spent$, remaining$, fairSharePerSeat$)          │
  └────────────────────────────────────────────────────────────────┘
  
  ┌─ forecaster.forecast(rows, mode): Forecast ─┐
  │   (eomSpend$, dailyProjection)              │
  └─────────────────────────────────────────────┘
  
  → all results passed as props to chart components
```

## Components (10 Charts)

| # | Chart | Data source | Purpose |
|---|---|---|---|
| 1 | **PoolGauge** | `pool-math` + `forecaster` | Hero visual: spent vs. pool budget (gauge scale = `Slots × CostPerSeat`), forecast EoM as an additional marker. If forecast > pool: red overshoot zone |
| 2 | **KpiTiles** | Aggregations, Pool | Total spent · Active seats · Idle seats · Forecast EoM · Δ vs. Pool |
| 3 | **UserLeaderboard** | `aggregator.perUser` | Top-N users as horizontal bars, share of pool in %, forecast value |
| 4 | **ParetoChart** | `aggregator.perUser` | Cumulative bar + line: 80/20 concentration |
| 5 | **UserModelHeatmap** | `aggregator.userModel` | Which user uses which model heavily |
| 6 | **ModelMixTreemap** | `aggregator.perModel` | Dollar share per model |
| 7 | **CostPerRequest** | `aggregator.perModel` | Efficiency: `aic_gross_amount / quantity` per model |
| 8 | **DailyBurnRate** | `aggregator.perDay` (+ optional stacked) | Stacked area, toggle "by user" / "by model" |
| 9 | **PoolBurnDown** | `aggregator.perDay` + `pool-math` + `forecaster` | Cumulative spend per day, forecast line to end of month, **horizontal pool budget line** (`Slots × CostPerSeat`, e.g. 100 × $19 = $1900). Intersection of forecast line and budget line shows whether/when the pool runs out |
| 10 | **UserDetailTable** | `aggregator.perUser` | Sortable, with sparkline, `exceeds_quota` badge |

## Pool & Forecast Math

**Pool:**
```
totalPool$ = purchasedSlots × costPerSeat
fairSharePerSeat$ = costPerSeat
spent$ = sum(rows.aic_gross_amount)
remaining$ = totalPool$ - spent$
percentUsed = spent$ / totalPool$
```

During promo months the user sets `costPerSeat` manually to $49.

**Forecast (linear):**
```
daysElapsed = max(date in rows) - min(date in rows) + 1
daysInMonth = letzter Tag des Monats von max(date)
dailyAvg = spent$ / daysElapsed
forecastEoM$ = dailyAvg × daysInMonth
```

**Forecast (7-day average):**
```
last7Days = letzte 7 Tage im Datensatz (oder weniger, falls < 7 Tage Daten)
recentAvg = sum(last7Days.spent) / count(last7Days)
remainingDays = daysInMonth - lastDayInData
forecastEoM$ = spent$ + recentAvg × remainingDays
```

## Error Handling

- **Wrong CSV format:** Validation against required columns (`date, username, aic_gross_amount, model, quantity`). On failure: banner with a specific note identifying which column is missing.
- **Empty CSV / 0 rows:** Empty state with the message "No data detected."
- **Mixed-month data:** If the CSV contains multiple months, a banner is shown and calculations are based on the most recent month. (Edge case — GitHub normally exports one month at a time.)
- **Slots < active seats:** Warning: "You have configured fewer slots than active users in the CSV — pool is too small."
- **Date parsing:** PapaParse with explicit `dynamicTyping: false`, then manual `new Date(value)` with validation.
- **Floating-point in CSV:** `aic_gross_amount` often appears as `1.0800000000000004` etc. in the original CSV — the aggregator uses `parseFloat` and rounds only at display time.

## Testing

`vitest` focused on calculation logic:

- `csv-parser.test.ts` — valid CSV, missing columns, empty file, floating-point robustness, sample fixture from user CSV
- `aggregator.test.ts` — per-user/per-model/per-day roll-ups with a small fixture
- `forecaster.test.ts` — linear vs. 7-day average, edge cases (1 day of data, full month)
- `pool-math.test.ts` — pool calculation, fair share, exceeds flag

No component testing in MVP — charts are verified visually.

## Deployment

**`Containerfile`:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`compose.yaml`:** Service `drainspotter` with `build: .`, no port publish (Traefik routes internally), with labels:
```yaml
services:
  drainspotter:
    build: .
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.drainspotter.rule=Host(`drainspotter.<domain>`)"
      - "traefik.http.routers.drainspotter.entrypoints=websecure"
      - "traefik.http.routers.drainspotter.tls.certresolver=<resolver>"
      - "traefik.http.services.drainspotter.loadbalancer.server.port=80"
    networks:
      - traefik
networks:
  traefik:
    external: true
```

Specific domain and resolver names will be finalized with the user during the implementation step.

**`nginx.conf`:** SPA fallback (`try_files $uri /index.html`), gzip on, cache headers for `/assets/*`.

## Visual Design Notes

### Frame & Layout
- Background: `linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)` + subtle noise/grain overlay (1% opacity) to prevent banding
- Cards: `bg-white/4 backdrop-blur-md border border-white/8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]`
- Card headers: label (uppercase, tracking-wider, text-xs, white/60) + value (text-3xl, font-semibold, tabular-nums, gradient text)
- Font: Inter Variable (300–700), `font-variant-numeric: tabular-nums` for numbers (prevents layout shift)
- Spacing: 12-column grid at ≥xl, 6-column at md, 1-column on mobile. Charts minimum 320px height, KPI tiles 140px
- Empty state (before CSV upload): large DropZone hero (60vh), animated gradient glow on the drop target

### Color Palette (normative)
- **Brand accent (drainer / heatmap hot):** gradient `#fb923c → #f43f5e` (orange → rose)
- **Cool / idle / forecast:** `#818cf8 → #6366f1` (indigo)
- **Pool line (budget):** `#22d3ee` solid, 2px, dashed
- **Overshoot zone:** `#ef4444` with 20% opacity fill
- **Axes/grid:** `white/8` for gridlines (dashed `4 4`), `white/40` for axis labels
- **Model palette** (for stack/treemap/heatmap): 8 coordinated HSL colors `#6366f1, #8b5cf6, #d946ef, #ec4899, #fb7185, #fb923c, #facc15, #84cc16` — deterministically hashed by model name so the same model always gets the same color across all charts

### Charts: Required Polish (Recharts-specific)
Recharts is fully themed — no default styling remains visible:

- **Custom tooltips** (dedicated component): glass card, rounded, with a model color dot on the left and the value on the right in tabular-nums, delta pill color-coded. Never use the Recharts default tooltip.
- **Custom legends:** positioned below, with click-to-toggle (show/hide series), animated highlight on hover
- **Gradient fills (defined as `<defs><linearGradient>`):** every area and bar uses a gradient, no flat fills
  - Bars: vertical from full accent at top → 40% opacity at bottom + rounded `radius={[6,6,0,0]}`
  - Areas: 80% → 0% opacity vertically
  - Lines: 2.5px stroke, `type="monotone"`, gradient stroke via `stroke="url(#lineGrad)"`
- **Axes:** `tickLine={false}`, `axisLine={false}`, tick font `white/40 11px`, Y-axis labels with `$` and K-suffix (`$1.2k`)
- **CartesianGrid:** horizontal lines only, dashed, `white/8`
- **Animations:** mount animation 600ms ease-out, hover transitions 150ms. Re-renders (slider change) without re-mount — smooth interpolation.
- **Hover crosshair:** vertical dashed line, followed by a glow-pulse on the data point
- **Empty state per chart:** subtle placeholder with icon + "No data" instead of blank white

### Chart-specific Polish Requirements

| Chart | Specifics |
|---|---|
| **PoolGauge** | Custom half-donut (not Recharts default), sweep animation on mount, overshoot zone red with glow, large centered `$` number with gradient text, `% of pool` label beneath |
| **KpiTiles** | Mini sparkline area (7 days) in the background of each tile, value in the foreground, delta pill top-right |
| **UserLeaderboard** | Horizontal bars with orange→rose gradient, value in tabular-nums on the right, avatar initials bubble on the left (hashed background color), fair-share marker as a vertical dashed line at `$CostPerSeat` |
| **ParetoChart** | Bar + overlaid line, cumulative line visually highlights the 80% threshold (dotted guide line + annotation "Top X users = 80%") |
| **UserModelHeatmap** | Custom cell component (Recharts doesn't handle this well out of the box): cells as `rounded-md` with smooth color interpolation indigo→rose by dollar intensity, hover highlights the cell + its row/column |
| **ModelMixTreemap** | Recharts Treemap with custom content renderer: rounded rectangles, model color, label only in cells > 60px, hover highlights cell and shows tooltip |
| **CostPerRequest** | Horizontal bar per model, sorted, in model color; expensive models (>$0.10/req) get a warning pill |
| **DailyBurnRate** | Stacked area with gradient fills per series, hover crosshair shows daily total + breakdown in tooltip, "by user / by model" toggle as a segmented button |
| **PoolBurnDown** | Cumulative line (actual) + forecast line (dashed) + horizontal budget line (cyan dashed), intersection of forecast × budget with annotation ("Pool runs out on 24.04."), filled overshoot zone |
| **UserDetailTable** | shadcn Table + per-row sparkline (mini SVG, 80×24px), `exceeds_quota` badge in red with pulse, sortable columns with sort indicator, sticky header |

### Definition of Done for "Looks Stunning"
- No Recharts defaults visible anywhere (no default tooltips, no garish default color palette, no square bars)
- Consistent model colors across all charts
- All numbers in tabular-nums with `$`/`k` formatting
- Smooth animations on mount and on slider re-render
- Lighthouse > 90 for Performance despite the polish (lazy-mount charts with IntersectionObserver if needed)
- Visual A/B comparison before implementation sign-off: screenshot of stock Recharts defaults vs. a drainspotter chart — the difference must be "not even the same league"

## Verification (End-to-End)

1. `npm install && npm run dev` — app starts, empty state with DropZone visible
2. Upload sample CSV (see user example) via drag and drop — all 10 charts render
3. Set slider to 10 slots, cost to $19 → pool $190, forecast appears in gauge
4. Set slider to $49 (promo) → pool $490, charts update reactively
5. Toggle forecast between linear/7-day average → forecast values change
6. `npm test` — all Vitest tests green
7. `npm run build` — `dist/` contains static assets
8. `docker compose up --build` — app reachable via Traefik at configured domain
9. Manual check: `gastown-steve` should appear as top drainer (in the sample CSV: $29.24 AIC)

## Open Questions for Implementation Phase

- Specific Traefik domain & cert resolver name
- Maximum number of rows in the CSV — likely fine (<10k), but if someone uploads 100k+ rows: stream rather than batch
- Slider range for slot count (likely 1–500, to be finalized during implementation)
