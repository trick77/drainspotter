import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import { clsx } from "clsx";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { chartColors } from "@/lib/chart-theme";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import type {
  Aggregations,
  Forecast,
  ForecastGrowth,
  PoolState,
} from "@/lib/types";

type Props = {
  aggregations: Aggregations;
  forecast: Forecast;
  pool: PoolState;
  growth: ForecastGrowth;
  onGrowthChange: (g: ForecastGrowth) => void;
};

const GROWTH: Record<
  ForecastGrowth,
  { label: string; rate: number; description: string }
> = {
  conservative: { label: "Conservative", rate: 0.03, description: "+3 %/mo compounded" },
  moderate: { label: "Moderate", rate: 0.1, description: "+10 %/mo compounded" },
  aggressive: { label: "Aggressive", rate: 0.2, description: "+20 %/mo compounded" },
};

const PROMO_COST_PER_SEAT = 49;
const REGULAR_COST_PER_SEAT = 19;

// GitHub Copilot Business promo: Jun–Aug 2026, seats include $49 of credits instead of $19.
function isPromoMonth(d: Date): boolean {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return y === 2026 && m >= 5 && m <= 7;
}

function shortMonthLabel(d: Date): string {
  const m = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const y = String(d.getUTCFullYear()).slice(2);
  return `${m} '${y}`;
}

export function SpendForecast6Mo({
  aggregations,
  forecast,
  pool,
  growth,
  onGrowthChange,
}: Props) {
  const anchor = forecast.forecastEoM;
  const { rate } = GROWTH[growth];
  const validAnchor = Number.isFinite(anchor) && anchor > 0;

  const start = new Date(aggregations.monthStart + "T00:00:00Z");
  const userCost = pool.costPerSeat;

  const data = Array.from({ length: 7 }, (_, n) => {
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + n);
    const promo = isPromoMonth(d);
    // If the user has set a non-promo cost, auto-bump promo months to $49.
    // If they've set the promo cost ($49), auto-revert non-promo months to $19.
    const seatCost = promo
      ? Math.max(userCost, PROMO_COST_PER_SEAT)
      : userCost === PROMO_COST_PER_SEAT
      ? REGULAR_COST_PER_SEAT
      : userCost;
    const seatFees = pool.purchasedSlots * seatCost;
    const budget = pool.overageBudget;
    const spend = validAnchor ? anchor * Math.pow(1 + rate, n) : 0;
    const overage = Math.max(0, spend - seatFees - budget);
    return {
      month: shortMonthLabel(d),
      seatFees,
      budget,
      overage,
      total: seatFees + budget + overage,
      spend,
      isAnchor: n === 0,
      isPromo: promo,
    };
  });


  return (
    <ChartFrame
      title="6-Month Projection"
      subtitle={validAnchor ? undefined : "Not enough data yet to forecast"}
      className="col-span-1"
      actions={
        <div className="inline-flex rounded-lg bg-surface-muted border border-border p-1 print:hidden">
          {(Object.keys(GROWTH) as ForecastGrowth[]).map((g) => (
            <button
              key={g}
              onClick={() => onGrowthChange(g)}
              className={clsx(
                "px-3 py-1 text-xs rounded-md transition-colors",
                growth === g
                  ? "bg-surface-hover text-fg"
                  : "text-fg-subtle hover:text-fg"
              )}
            >
              {GROWTH[g].label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[340px] flex flex-col">
        {validAnchor ? (
          <>
          <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid
                stroke={chartColors.grid}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickFormatter={formatUsdCompact}
              />
              <Tooltip
                cursor={{ fill: chartColors.cursorFill }}
                content={
                  <ChartTooltip
                    valueFormatter={formatUsd}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                }
              />
              <Bar
                dataKey="seatFees"
                name="Seat Fees"
                stackId="cost"
                fill={chartColors.pool}
                fillOpacity={0.55}
                barSize={42}
                isAnimationActive={false}
                shape={(props: any) => {
                  const { x, y, width, height, payload, fill, fillOpacity } = props;
                  const r = payload.overage > 0 || payload.budget > 0 ? 0 : 6;
                  const path =
                    r > 0
                      ? `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
                      : `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
                  return <path d={path} fill={fill} fillOpacity={fillOpacity} />;
                }}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, index } = props;
                    if (data[index]?.overage > 0 || data[index]?.budget > 0) return null;
                    const v = data[index]?.total;
                    if (typeof v !== "number") return null;
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fill={chartColors.fgMuted}
                        fontSize={10}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatUsdCompact(v)}
                      </text>
                    );
                  }}
                />
              </Bar>
              <Bar
                dataKey="budget"
                name="Overage Budget"
                stackId="cost"
                fill={chartColors.budget}
                fillOpacity={0.55}
                barSize={42}
                isAnimationActive={false}
                shape={(props: any) => {
                  const { x, y, width, height, payload, fill, fillOpacity } = props;
                  if (height <= 0) return <g />;
                  const r = payload.overage > 0 ? 0 : 6;
                  const path =
                    r > 0
                      ? `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
                      : `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
                  return <path d={path} fill={fill} fillOpacity={fillOpacity} />;
                }}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, index } = props;
                    if (data[index]?.overage > 0) return null;
                    if (!(data[index]?.budget > 0)) return null;
                    const v = data[index]?.total;
                    if (typeof v !== "number") return null;
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fill={chartColors.fgMuted}
                        fontSize={10}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatUsdCompact(v)}
                      </text>
                    );
                  }}
                />
              </Bar>
              <Bar
                dataKey="overage"
                name="AI Overage"
                stackId="cost"
                fill="url(#drainBar)"
                radius={[6, 6, 0, 0]}
                barSize={42}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="total"
                  position="top"
                  formatter={(v: unknown) =>
                    typeof v === "number" ? formatUsdCompact(v) : ""
                  }
                  style={{
                    fill: chartColors.fgMuted,
                    fontSize: 10,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center pt-2 text-xs text-fg-muted">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: chartColors.pool, opacity: 0.55 }}
              />
              <span>Seat fees (included credits)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: chartColors.budget, opacity: 0.55 }}
              />
              <span>Overage budget (planned)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm bg-drain-gradient"
              />
              <span>AI overage (spend above seat + budget)</span>
            </div>
          </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-fg-faint text-sm">
            Not enough data to forecast.
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
