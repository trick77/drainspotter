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
import { ChartDefs } from "@/components/ChartDefs";

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
      <ChartDefs />
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
            data-fc-mode={fc.mode}
            data-pool-percent={pool.percentUsed.toFixed(2)}
            data-agg-rows={aggregations.rowCount}
          >
            {/* Charts wired in subsequent tasks */}
          </div>
        </>
      )}
    </div>
  );
}
