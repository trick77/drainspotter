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
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { WarningBanner } from "@/components/WarningBanner";
import { InfoBanner } from "@/components/InfoBanner";
import { ChartDefs } from "@/components/ChartDefs";
import { KpiTiles } from "@/components/charts/KpiTiles";
import { PoolGauge } from "@/components/charts/PoolGauge";
import { UserLeaderboard } from "@/components/charts/UserLeaderboard";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { UserModelHeatmap } from "@/components/charts/UserModelHeatmap";
import { ModelMixTreemap } from "@/components/charts/ModelMixTreemap";
import { CostPerRequest } from "@/components/charts/CostPerRequest";
import { DailyBurnRate } from "@/components/charts/DailyBurnRate";
import { ModelMixTrend } from "@/components/charts/ModelMixTrend";
import { PoolBurnDown } from "@/components/charts/PoolBurnDown";
import { UserDetailTable } from "@/components/charts/UserDetailTable";
import { TopDrainersPodium } from "@/components/charts/TopDrainersPodium";
import { SpendForecast6Mo } from "@/components/charts/SpendForecast6Mo";

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
            overageBudget: settings.overageBudget,
            spent: aggregations.totalAic,
            activeUsernames: aggregations.activeUsernames,
          })
        : null,
    [aggregations, settings.purchasedSlots, settings.costPerSeat, settings.overageBudget]
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
      <ChartDefs />
      <header className="flex items-center justify-between mb-8 print:mb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setRows(null);
              setError(null);
            }}
            className="print:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
            aria-label="Reset to upload"
          >
            <img
              src="/drainspotter.png"
              alt="drainspotter"
              className="h-10 md:h-14 w-auto"
            />
          </button>
          <p className="hidden sm:block text-sm text-white/50 mt-3 md:mt-5">
            GitHub Copilot Usage Dashboard
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
          <details className="glass-card p-4 text-sm text-white/70 max-w-2xl mx-auto w-full">
            <summary className="cursor-pointer font-medium text-white/80 select-none">
              How to get the usage report
            </summary>
            <ol className="list-decimal list-inside mt-3 space-y-1.5 text-white/60">
              <li>
                Sign in to GitHub and open your organization's page (
                <span className="text-white/70">github.com/organizations/&lt;your-org&gt;</span>
                ).
              </li>
              <li>
                Click <span className="text-white/80">Settings</span> in the top
                navigation.
              </li>
              <li>
                In the left sidebar, open{" "}
                <span className="text-white/80">Billing and licensing</span> →{" "}
                <span className="text-white/80">Usage</span>.
              </li>
              <li>
                Click <span className="text-white/80">Get usage report</span>.
              </li>
              <li>
                Choose <span className="text-white/80">Detailed report</span>{" "}
                and set the date range to the current month (or any month you
                want to analyze).
              </li>
              <li>
                Submit the request. GitHub will email you a link to the CSV
                once it's ready (usually within a few minutes).
              </li>
              <li>
                Download the CSV and drop it above. Only the{" "}
                <span className="font-mono text-white/70">
                  premiumRequestUsageReport
                </span>{" "}
                file is needed.
              </li>
            </ol>
          </details>
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-white/40 text-center max-w-md">
              Your CSV is parsed in your browser. Nothing is uploaded, logged,
              or retained — close the tab and it's gone. Source on{" "}
              <a
                href="https://github.com/trick77/drainspotter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 underline decoration-white/20 hover:text-white/80"
              >
                GitHub
              </a>
              .
            </p>
            <DemoDataButton onLoad={handleFile} />
          </div>
        </div>
      )}

      {rows && aggregations && pool && fc && (
        <>
          <div className="mb-6">
            <InfoBanner>
              Analyzing {aggregations.monthStart.slice(0, 7)} ·{" "}
              {aggregations.daysElapsed} of {aggregations.daysInMonth} days
              (through{" "}
              {new Date(aggregations.lastDayInData + "T00:00:00Z").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", timeZone: "UTC" }
              )}
              )
            </InfoBanner>
          </div>
          {aggregations.spannedMonths.length > 1 && (
            <div className="mb-6">
              <WarningBanner>
                CSV contains data from multiple months (
                {aggregations.spannedMonths.join(", ")}). Only the latest month ({aggregations.monthStart.slice(0, 7)})
                is analyzed.
              </WarningBanner>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mb-6">
            <PoolControls
              slots={settings.purchasedSlots}
              costPerSeat={settings.costPerSeat}
              overageBudget={settings.overageBudget}
              onSlotsChange={(v) =>
                setSettings({ ...settings, purchasedSlots: v })
              }
              onCostChange={(v) =>
                setSettings({ ...settings, costPerSeat: v })
              }
              onOverageChange={(v) =>
                setSettings({ ...settings, overageBudget: v })
              }
            />
          </div>

          <div
            id="charts-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            data-fc-mode={fc.mode}
            data-pool-percent={pool.percentUsed.toFixed(2)}
            data-agg-rows={aggregations.rowCount}
          >
            <KpiTiles aggregations={aggregations} pool={pool} forecast={fc} />
            <ParetoChart aggregations={aggregations} />
            <TopDrainersPodium aggregations={aggregations} />
            <PoolGauge pool={pool} forecast={fc} />
            <div className="col-span-full grid grid-cols-1 xl:grid-cols-3 gap-4">
              <PoolBurnDown aggregations={aggregations} pool={pool} forecast={fc} />
              <SpendForecast6Mo
                aggregations={aggregations}
                forecast={fc}
                pool={pool}
                growth={settings.forecastGrowth}
                onGrowthChange={(g) => setSettings({ ...settings, forecastGrowth: g })}
              />
            </div>
            <UserLeaderboard aggregations={aggregations} pool={pool} />
            <ModelMixTreemap aggregations={aggregations} />
            <div className="col-span-full grid grid-cols-1 xl:grid-cols-2 gap-4">
              <DailyBurnRate
                aggregations={aggregations}
                groupBy={settings.burnRateGroupBy}
                onGroupByChange={(g) => setSettings({ ...settings, burnRateGroupBy: g })}
              />
              <ModelMixTrend aggregations={aggregations} />
            </div>
            <UserModelHeatmap aggregations={aggregations} />
            <CostPerRequest aggregations={aggregations} />
            <UserDetailTable aggregations={aggregations} pool={pool} />
          </div>
        </>
      )}
    </div>
  );
}
