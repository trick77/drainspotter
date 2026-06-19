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
                isAnimationActive={false}
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
  const showIdle = pool.purchasedSlots > pool.activeSeats;
  const wasted = pool.idleSeats * pool.seatPrice;
  const colClass = showIdle
    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 col-span-full"
    : "grid grid-cols-2 md:grid-cols-5 gap-3 col-span-full";
  return (
    <div className={colClass}>
      <Tile
        label="Spent"
        value={formatUsd(pool.spent)}
        delta={`${formatPercent(pool.percentUsed)} of pool`}
        spark={spark}
      />
      <Tile
        label="Pool total"
        value={formatUsd(pool.totalPool)}
        delta={
          pool.overageBudget > 0
            ? `${pool.purchasedSlots} × $${pool.includedCreditsPerSeat} + $${pool.overageBudget} budget`
            : `${pool.purchasedSlots} slots × $${pool.includedCreditsPerSeat}`
        }
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
        delta={`${pool.activeSeats} of ${pool.purchasedSlots} purchased`}
      />
      {showIdle && (
        <Tile
          label="Idle seats"
          value={String(pool.idleSeats)}
          delta={`${formatUsd(wasted)} /month wasted`}
          intent={pool.idleSeats > pool.purchasedSlots / 2 ? "warn" : "neutral"}
        />
      )}
      <Tile
        label="Pierce date"
        value={
          forecast.pierceDate
            ? `${Number(forecast.pierceDate.slice(8, 10))}.${Number(forecast.pierceDate.slice(5, 7))}.`
            : "—"
        }
        delta={
          forecast.pierceDate
            ? `Pool runs dry on ${forecast.pierceDate.slice(8, 10)}.${forecast.pierceDate.slice(5, 7)}.`
            : "Pool lasts until end of month"
        }
        intent={forecast.pierceDate ? "danger" : "neutral"}
      />
    </div>
  );
}
