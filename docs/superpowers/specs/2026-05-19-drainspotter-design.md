# drainspotter — Design

**Date:** 2026-05-19
**Status:** Draft for review

## Context

Ab 1.6.2026 stellt GitHub Copilot auf usage-based Billing um. Jeder Business-Seat ($19/Monat) bringt $19 AI Credits mit; in den Promo-Monaten Juni–August 2026 zusätzlich $30. Die Credits sind nicht pro Seat reserviert, sondern fliessen in einen gemeinsamen Org-Pool: alle aktiven User können daraus zehren.

GitHub liefert einen CSV-Report (`premiumRequestUsageReport_*.csv`) mit pro-User, pro-Modell, pro-Tag Verbrauch — sowohl in der alten PRU-Welt (`gross_amount`) als auch in der neuen AI-Credit-Welt (`aic_gross_amount`, USD).

drainspotter ist ein lokales Browser-Cockpit, in das man die CSV drag-and-droppt. Daraus beantwortet das Tool eine Reihe zusammenhängender Fragen rund um AI-Credit-Konsum und Pool-Auslastung:

- **Pool-Status:** Wie viel des gemeinsamen Budgets ist bereits aufgebraucht? Wie viel bleibt?
- **Forecast:** Reicht das Budget bei aktuellem Burn bis Monatsende — oder läuft der Pool leer?
- **Top-Drainer:** Welche User verbrauchen am meisten? Wer liegt über/unter Fair-Share je Seat?
- **Konzentration:** Wie ist der Verbrauch verteilt — Pareto-typisch (wenige treiben den Grossteil) oder breit gestreut?
- **Modell-Mix:** Welche Modelle fressen den Pool? Wo geht das Geld hin — in teure Codex-Max-Calls oder breit gestreut?
- **Modell-Effizienz:** Welches Modell kostet wie viel pro Request? Wo ist der Hebel für günstigere Defaults?
- **User × Modell:** Welche User setzen schwergewichtig auf welche Modelle (z.B. Single-User dominiert ein teures Modell)?
- **Zeitverlauf:** Wann brennt der Pool — gleichmässig, oder Burst-Peaks an einzelnen Tagen?
- **Seat-Auslastung:** Wie viele gekaufte Slots sind aktiv? Wie viele Slots zahlen wir leer mit?
- **Quota-Risiko:** Wer hat sein Monats-Limit gerissen (`exceeds_quota`) oder steht kurz davor?

Keine Daten verlassen den Browser.

## Scope

**In-Scope (MVP):**
- Drag/Drop CSV-Upload
- 10 Charts (siehe Components)
- Slider: gekaufte Slots (Stückzahl) + Cost-per-Seat in USD (default $19, in Promo-Monaten manuell auf $49)
- Forecast bis Monatsende (linear + 7-Tage-Avg, mit Toggle)
- Datum-Range-Toggle (`7d / 14d / all`) — filtert nur die Zeitverlauf-Charts (DailyBurnRate, PoolBurnDown). Pool-Berechnung und Forecast bleiben monatlich
- **Persistente Einstellungen via LocalStorage:** Slots-Anzahl, Cost-per-Seat, Forecast-Modus, DailyBurnRate-Gruppierung (User/Modell), Range-Toggle, Sortierreihenfolge UserDetailTable. Key: `drainspotter:settings:v1`. CSV-Daten selbst werden **nicht** persistiert (Privacy + Volumen).
- **Demo-CSV bundled:** Button „Beispieldaten laden" im Empty-State lädt eine vorbereitete CSV unter `/public/demo.csv`. Inhalt: User-bereitgestelltes Real-Sample (15 Tage, 1.–15.04.2026, alle Modelle, ~120 User), Usernames anonymisiert nach folgendem Schema:
    - **Top-Drainer** (höchster Summen-`aic_gross_amount`): bekommen aristokratisch-villainöse Vielfrass-Namen. **`joe-gastown` ist explizit der Top-1-Drainer** (wird auf den Real-User mit dem höchsten Summen-Spend gemappt). Plätze 2–10 in absteigender Spend-Reihenfolge: `chief-token-officer`, `lord-of-the-pool`, `count-contextula`, `sir-burns-a-lot`, `duke-of-drain`, `promptzilla`, `token-schredder`, `quota-muncher`, `voldetoken`
    - **Bottom-10-Non-Drainer** (niedrigster Summen-`aic_gross_amount` > 0): bekommen Lurker-/Lizenz-Leichen-Namen, in aufsteigender Spend-Reihenfolge (also: `copilot-bünzli` = absoluter Tiefststand): `copilot-bünzli`, `lizenz-leiche`, `enablement-target`, `quota-coward`, `token-tumbleweed`, `untapped-potential`, `ghost-coder`, `inference-abstainer`, `auto-complete-amish`, `still-on-stackoverflow`
    - **Middle-Band-User** (alle dazwischen, ~100 im Demo-Sample): zuerst deterministisch aus einem **Pool von ~50 neutralen Dev-Funny-Names** verteilt (mild humorvoll, Dev-Kultur, weniger extrem als Top/Bottom). Beispiele: `coffee-driven-dev`, `regex-rita`, `merge-conflict-mary`, `bug-magnet`, `rubber-ducker`, `semicolon-skipper`, `cache-miss-carl`, `null-pointer-nina`, `stale-branch-bob`, `force-push-fred` u.ä. Wenn Pool erschöpft, werden weitere User auf `dev-NN` (zweistellig, nullgepaddet) gemappt.
    - Jeder Original-Username bekommt **genau einen** Alias konsistent über alle Rows hinweg (gleiche Person ergibt gleichen Alias → korrekte Heatmap/Leaderboard-Daten)
    - Alle Zahlen-Spalten (`quantity`, `aic_quantity`, `aic_gross_amount`, etc.) bleiben **1:1 unverändert**
    - Organization-Spalte wird auf `DemoOrg` gesetzt
- **PDF-Export via `window.print()` + Print-Stylesheet:** Button „Export PDF" triggert nativen Print-Dialog. Print-CSS schaltet auf A4-Layout, white-on-paper-Theme (kein Glass/Blur), explizite Page-Breaks zwischen den Sektionen. SVG-Charts bleiben vektoriell.
- Locale: Schweizer Format (`$1'234.56`, Datum `DD.MM.YYYY`, `de-CH` via `Intl.NumberFormat`/`DateTimeFormat`)
- Container-Deployment via `compose.yaml` + `Containerfile`, hinter Traefik

**Re-Upload-UX:** Drop einer zweiten CSV ersetzt die bestehende sofort (kein Confirm-Dialog), Settings (LocalStorage) bleiben erhalten.

**Multi-Month-Daten in einer CSV:** Warn-Banner + automatisches Filtern auf neuesten Monat im Datensatz.

**Out-of-Scope (YAGNI):**
- Multi-Month-Historie / mehrere CSVs mergen
- Auth, Persistenz, Backend
- Anonymisierung der User-CSV (Klarnamen reichen, Daten bleiben lokal)
- Light-Mode-Toggle — nur Premium-Glass-Dark
- USD/Credits-Toggle — immer USD via `aic_gross_amount`
- i18n der UI-Strings — UI ist Deutsch/Englisch gemischt-pragmatisch (nur Zahlen/Daten locale-formatiert)

## Stack

- **Build:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui Primitive (Button, Card, Slider, Toggle, Table, Tooltip)
- **Look & Feel:** „Premium glass" — dunkler Indigo→Slate-Gradient-Background, halbtransparente Karten mit `backdrop-blur`, Orange→Rose-Akzent-Gradients für Drainer-Visualisierung. Font: Inter
- **Charts:** Recharts (deckt Bar, Area, Line, Pie/Donut, Heatmap-via-custom, Scatter ab)
- **CSV:** PapaParse (streaming, robust gegen Number-Parsing-Quirks der Copilot-CSV)
- **Tests:** Vitest für CSV-Parser, Aggregator, Forecaster, Pool-Math
- **Container:** Multi-stage Containerfile (`node:20-alpine` Build → `nginx:alpine` Serve), `compose.yaml` mit Traefik-Labels für externes Routing

## Architecture / Units

Klare Trennung in reine Berechnungs-Module (testbar ohne DOM) und UI-Komponenten:

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
- `lib/*` kennt kein React, keinen DOM — nur Datentypen rein, Datentypen raus
- Charts erhalten fertige Aggregationen als Props, machen keine eigenen Berechnungen
- `App.tsx` orchestriert: hält State (CSV-Daten, Pool-Config, Forecast-Modus), wendet `aggregator` und `forecaster` per `useMemo` an, gibt Resultate an Charts

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
  
  → alles als Props in Charts-Komponenten
```

## Components (10 Charts)

| # | Chart | Datenquelle | Zweck |
|---|---|---|---|
| 1 | **PoolGauge** | `pool-math` + `forecaster` | Hero-Visual: spent vs. Pool-Budget (Gauge-Skala = `Slots × CostPerSeat`), Forecast-EoM als zusätzliche Markierung. Wenn Forecast > Pool: roter Overshoot-Bereich |
| 2 | **KpiTiles** | Aggregations, Pool | Total spent · Active seats · Idle seats · Forecast EoM · Δ vs. Pool |
| 3 | **UserLeaderboard** | `aggregator.perUser` | Top-N User horizontal Bars, Anteil am Pool in %, Forecast-Wert |
| 4 | **ParetoChart** | `aggregator.perUser` | Kumulierte Bar+Line: 80/20-Konzentration |
| 5 | **UserModelHeatmap** | `aggregator.userModel` | Welcher User intensiv welches Modell |
| 6 | **ModelMixTreemap** | `aggregator.perModel` | $-Anteil pro Modell |
| 7 | **CostPerRequest** | `aggregator.perModel` | Effizienz: `aic_gross_amount / quantity` je Modell |
| 8 | **DailyBurnRate** | `aggregator.perDay` (+ optional gestapelt) | Stacked Area, Toggle „nach User" / „nach Modell" |
| 9 | **PoolBurnDown** | `aggregator.perDay` + `pool-math` + `forecaster` | Kumulierter Spend pro Tag, Forecast-Linie bis Monatsende, **horizontale Pool-Budget-Linie** (`Slots × CostPerSeat`, z.B. 100 × $19 = $1900). Schnittpunkt Forecast × Budget-Linie zeigt, ob/wann der Pool reisst |
| 10 | **UserDetailTable** | `aggregator.perUser` | Sortierbar, mit Sparkline, exceeds_quota-Badge |

## Pool & Forecast Math

**Pool:**
```
totalPool$ = purchasedSlots × costPerSeat
fairSharePerSeat$ = costPerSeat
spent$ = sum(rows.aic_gross_amount)
remaining$ = totalPool$ - spent$
percentUsed = spent$ / totalPool$
```

User stellt in Promo-Monaten `costPerSeat` manuell auf $49.

**Forecast (linear):**
```
daysElapsed = max(date in rows) - min(date in rows) + 1
daysInMonth = letzter Tag des Monats von max(date)
dailyAvg = spent$ / daysElapsed
forecastEoM$ = dailyAvg × daysInMonth
```

**Forecast (7-Tage-Avg):**
```
last7Days = letzte 7 Tage im Datensatz (oder weniger, falls < 7 Tage Daten)
recentAvg = sum(last7Days.spent) / count(last7Days)
remainingDays = daysInMonth - lastDayInData
forecastEoM$ = spent$ + recentAvg × remainingDays
```

## Error Handling

- **Falsches CSV-Format:** Validation gegen Required-Columns (`date, username, aic_gross_amount, model, quantity`). Bei Fehlern: Banner mit konkretem Hinweis welche Spalte fehlt.
- **Leeres CSV / 0 Zeilen:** Empty-State mit Hinweis „Keine Daten erkannt".
- **Mixed-Month Daten:** Wenn CSV mehrere Monate enthält, Banner mit Hinweis + Berechnung basiert auf neuestem Monat. (Edge-Case, normalerweise liefert GitHub einen Monat.)
- **Slots < Active Seats:** Warnung „Du hast weniger Slots eingestellt als aktive User in CSV — Pool zu klein".
- **Date-Parsing:** PapaParse mit explizitem `dynamicTyping: false`, dann manuelles `new Date(value)` mit Validierung.
- **Floating-Point in CSV:** `aic_gross_amount` ist in der Original-CSV oft `1.0800000000000004` etc. — Aggregator nutzt `parseFloat` und rundet erst bei der Anzeige.

## Testing

`vitest` mit dem Fokus auf Berechnungs-Logik:

- `csv-parser.test.ts` — gültiges CSV, fehlende Spalten, leeres File, Floating-Point Robustheit, Sample-Fixture aus dem User-CSV
- `aggregator.test.ts` — per-user/per-model/per-day Roll-Ups mit kleinem Fixture
- `forecaster.test.ts` — linear vs. 7-Tage-Avg, Edge-Cases (1 Tag Daten, kompletter Monat)
- `pool-math.test.ts` — Pool-Berechnung, Fair-Share, exceeds-flag

Kein Component-Testing im MVP — Charts werden visuell verifiziert.

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

**`compose.yaml`:** Service `drainspotter` mit `build: .`, ohne Port-Publish (Traefik routet intern), mit Labels:
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

Konkrete Domain/Resolver-Namen werden im Implement-Schritt mit dem User finalisiert.

**`nginx.conf`:** SPA-Fallback (`try_files $uri /index.html`), gzip on, cache headers für `/assets/*`.

## Visual Design Notes

### Frame & Layout
- Background: `linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)` + dezentes Noise-/Grain-Overlay (1% opacity) gegen Banding
- Karten: `bg-white/4 backdrop-blur-md border border-white/8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]`
- Karten-Header: Label (uppercase, tracking-wider, text-xs, white/60) + Value (text-3xl, font-semibold, tabular-nums, Gradient-Text)
- Font: Inter Variable (300–700), für Zahlen `font-variant-numeric: tabular-nums` (kein Springen)
- Spacing: 12-Column Grid auf ≥xl, 6-Column md, 1-Column mobile. Charts mind. 320px Höhe, KPI-Tiles 140px
- Empty-State (vor CSV-Upload): grosser DropZone-Hero (60vh), animierter Gradient-Glow am Drop-Target

### Farb-Palette (verbindlich)
- **Brand-Akzent (Drainer / Heatmap-Hot):** Gradient `#fb923c → #f43f5e` (Orange → Rose)
- **Cool / Idle / Forecast:** `#818cf8 → #6366f1` (Indigo)
- **Pool-Linie (Budget):** `#22d3ee` solid, 2px, dashed
- **Overshoot-Zone:** `#ef4444` mit 20% opacity Fill
- **Achsen/Grid:** `white/8` für Gridlines (dashed `4 4`), `white/40` für Achsen-Text
- **Modell-Palette** (für Stack/Treemap/Heatmap): 8 abgestimmte Farben in HSL-Reihe `#6366f1, #8b5cf6, #d946ef, #ec4899, #fb7185, #fb923c, #facc15, #84cc16` — deterministisch nach Modell-Name gehasht, damit dasselbe Modell überall dieselbe Farbe hat

### Charts: Pflicht-Polish (Recharts-spezifisch)
Recharts wird komplett gethemed — kein einziger Default bleibt sichtbar:

- **Custom Tooltips** (eigene Komponente): glass-Card, abgerundet, mit Modell-Farb-Dot links, Wert rechts in tabular-nums, Delta-Pille farbcodiert. Niemals Recharts-Default-Tooltip.
- **Custom Legends:** unten, mit Klick-Toggle (Serie aus-/einblenden), animiertes Highlight beim Hover
- **Gradient-Fills (definiert als `<defs><linearGradient>`):** jede Area/Bar nutzt einen Gradient, keine Flat-Fills
  - Bars: vertikal von vollem Akzent oben → 40% opacity unten + abgerundete `radius={[6,6,0,0]}`
  - Areas: 80% → 0% opacity vertikal
  - Lines: 2.5px stroke, `type="monotone"`, mit Gradient-Stroke per `stroke="url(#lineGrad)"`
- **Axes:** `tickLine={false}`, `axisLine={false}`, Tick-Font `white/40 11px`, Y-Achsen-Labels mit `$` und K-Suffix (`$1.2k`)
- **CartesianGrid:** nur horizontale Linien, dashed, `white/8`
- **Animationen:** Mount-Animation 600ms ease-out, Hover-Transitions 150ms. Re-renders (Slider-Change) ohne Re-Mount, also smooth interpoliert.
- **Hover-Crosshair:** vertical dashed line, gefolgt von glow-pulse am Datapoint
- **Empty-State pro Chart:** dezenter Placeholder mit Icon + „Keine Daten" statt blank weiss

### Chart-spezifische Polish-Anforderungen

| Chart | Specifics |
|---|---|
| **PoolGauge** | Custom Half-Donut (kein Recharts-Default), Sweep-Animation beim Mount, Overshoot-Bereich rot mit Glow, zentral grosses `$`-Number mit Gradient-Text, darunter `% of pool` |
| **KpiTiles** | Sparkline mini-area (7 Tage) im Hintergrund jeder Tile, Wert vorne, Delta-Pill rechts oben |
| **UserLeaderboard** | Horizontale Bars mit Orange→Rose-Gradient, rechts der Wert in tabular-nums, links Avatar-Initialen-Bubble (gehashte Hintergrundfarbe), Fair-Share-Marker als vertikale dashed line bei `$CostPerSeat` |
| **ParetoChart** | Bar + überlagerte Linie, Cumulative-Linie hebt 80%-Schwelle visuell hervor (gepunktete Hilfslinie + Annotation „Top X User = 80%") |
| **UserModelHeatmap** | Eigene Cell-Komponente (Recharts kann das nicht out-of-box gut): Cells als `rounded-md` mit smooth Farbinterpolation Indigo→Rose nach $-Intensität, Hover hebt Zelle + Zeile/Spalte hervor |
| **ModelMixTreemap** | Recharts-Treemap mit custom Content-Renderer: abgerundete Rechtecke, Modell-Farbe, Label nur in Cells > 60px, hover hebt Cell + zeigt Tooltip |
| **CostPerRequest** | Horizontale Bar pro Modell, sortiert, mit Modell-Farbe; teure Modelle (>$0.10/req) bekommen Warn-Pill |
| **DailyBurnRate** | Stacked Area mit Gradient-Fills pro Serie, Hover-Crosshair zeigt Tages-Total + Breakdown im Tooltip, Toggle „nach User / nach Modell" als segmentierter Button |
| **PoolBurnDown** | Kumulative Line (Ist) + Forecast-Line (dashed) + horizontale Budget-Line (cyan dashed), Schnittpunkt Forecast×Budget mit Annotation („Pool reisst am 24.04."), gefüllter Overshoot-Bereich |
| **UserDetailTable** | shadcn Table + per-row Sparkline (mini SVG, 80×24px), `exceeds_quota`-Badge rot mit pulse, sortierbare Spalten mit Indikator, sticky Header |

### Definition of Done für „hammermässig"
- Kein einziger Recharts-Default sichtbar (keine Standard-Tooltips, keine bunte Default-Farbpalette, keine eckigen Bars)
- Konsistente Modell-Farben über alle Charts hinweg
- Zahlen alle tabular-nums + `$`/`k`-Formatierung
- Smooth Animations beim Mount und beim Slider-Re-render
- Lighthouse > 90 für Performance trotz Polish (Lazy-Mount der Charts mit IntersectionObserver, falls nötig)
- Visueller A/B-Vergleich vor Implementation-Abschluss: Screenshot eines aktuellen Recharts-Default vs. drainspotter-Chart — der Unterschied muss „nicht mehr dieselbe Liga" sein

## Verification (End-to-End)

1. `npm install && npm run dev` — App startet, Empty-State mit DropZone sichtbar
2. Sample-CSV (siehe User-Beispiel) per Drag-Drop hochladen — 10 Charts rendern
3. Slider auf 10 Slots, Cost auf $19 setzen → Pool $190, Forecast erscheint im Gauge
4. Slider auf $49 (Promo) → Pool $490, Charts updaten reaktiv
5. Forecast-Toggle zwischen linear/7-Tage-Avg → Forecast-Werte ändern sich
6. `npm test` — alle Vitest-Tests grün
7. `npm run build` — `dist/` enthält Static-Assets
8. `docker compose up --build` — App via Traefik unter konfigurierter Domain erreichbar
9. Manuell: `av6drone` sollte als Top-Drainer erscheinen (im Sample-CSV $29.24 AIC)

## Open Questions for Implementation Phase

- Konkrete Traefik-Domain & cert-resolver-Name
- Maximale Anzahl Rows im CSV — vermutlich unbedenklich (<10k), aber falls jemand 100k+ Rows hat: streamen statt batchen
- Slider-Range für Slots-Anzahl (vermutlich 1–500, finalisieren beim Implement)
