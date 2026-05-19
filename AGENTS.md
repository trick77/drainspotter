# AGENTS.md — drainspotter

## Data semantics

- `aic_gross_amount` is the canonical USD figure (post-2026-06-01 AI Credits world). Use it. **Ignore** `gross_amount` / `net_amount` (legacy PRU pricing) — they exist in the CSV but are not the source of truth.
- Pool = `purchasedSlots × costPerSeat`. Default `costPerSeat` is `$19` (Business seat). During the Jun–Aug 2026 promo it's `$49` — user toggles manually.
- Forecast uses 7-day rolling average and computes `pierceDate` (the day cumulative spend crosses the pool). Don't switch the default forecast method without asking.

## Privacy / PII

- **Never commit real usernames or org names.** `scripts/source-real.csv` is gitignored — keep it that way. Treat it as PII.
- The shipped `public/demo.csv` uses fictional aliases only. If you regenerate it, the generator (`scripts/generate-demo-csv.mjs`) maps real names to aliases — verify the output before committing.
- If you find real-looking identifiers anywhere in committed files (spec, plan, tests, code), replace with placeholders and flag it.

## Visual discipline

- Drain gradient (orange→rose `#fb923c → #f43f5e`) is **reserved** for: top-drainer bars, "over budget" warnings, pool-overshoot. Don't use it for neutral data categories.
- Cool palette (indigo/violet/cyan/teal) is for **model/user colors** in non-warning contexts. See `src/lib/model-colors.ts`.
- No Recharts defaults visible. Charts use `ChartTooltip` + `ChartLegend` + `<defs>` gradients from `ChartDefs`. Don't render `<Tooltip />` without `content={<ChartTooltip />}`.
- Locale is Swiss: `$1'234.56`, `DD.MM.YYYY`. Use `formatUsd` / `formatDate` / `formatUsdCompact` from `src/lib/format.ts` — don't roll your own.

## Architecture rules

- `src/lib/*` is DOM-free, React-free pure TS. Tests live next to it. **Don't import React or DOM types into `lib/`.**
- Charts receive aggregated data as props. They don't fetch, parse, or aggregate themselves.
- `App.tsx` is the only place where state flows from CSV → aggregator → pool-math → forecaster → charts.

## Testing

- TDD for anything in `src/lib/` (parser, aggregator, pool-math, forecaster, settings-store, format). Failing test first, then implement.
- Charts and other UI components are **visually verified**, not unit-tested. Don't add component tests unless asked.
- Run: `npm test` (Vitest). Lint: `npm run lint` (`tsc --noEmit`). Build: `npm run build`. All three must pass before any commit.

## Settings persistence

- LocalStorage key: `drainspotter:settings:v1`. **Bump the `:v1` suffix if you change the Settings shape** — old keys are read with default-fallback, but renames will silently merge wrong.
- CSV row data is **never** persisted (privacy + volume). Settings only.

## Print / PDF export

- PDF export is `window.print()` + `src/print.css`. Don't add a JS PDF library (would rasterize the SVG charts). Test PDF output if you touch any chart that uses gradient fills, backdrop-blur, or absolutely-positioned overlays — they need print-stylesheet overrides.

## Git / GitHub

- Default branch is `master`. Never push to `master` directly — feature branch → PR → merge.
- Conventional commit prefixes used here: `feat:`, `fix:`, `ui:`, `ci:`, `chore:`, `docs:`, `rename:`, `i18n:`. Match the existing style.
- Only create commits on explicit user request. CI (`test.yaml`) must be green before merge.
- Release: push to `master` → `release.yaml` bumps semver, tags, builds image to `ghcr.io`. The release workflow expects `Containerfile` (not `Dockerfile`).

## Demo CSV

- If you change `TOP_DRAINERS`, `BOTTOM_LURKERS`, or `MIDDLE_POOL` in `scripts/generate-demo-csv.mjs`, run `node scripts/generate-demo-csv.mjs` to refresh `public/demo.csv`. Don't hand-edit `public/demo.csv`.
- The generator truncates the source to mid-month (`2026-04-15`) so the forecast feature has something to project. Don't extend past mid-month unless the user asks.
