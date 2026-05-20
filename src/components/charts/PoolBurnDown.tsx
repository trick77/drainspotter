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
import type { Aggregations, PoolState, Forecast } from "@/lib/types";

type Props = {
  aggregations: Aggregations;
  pool: PoolState;
  forecast: Forecast;
};

export function PoolBurnDown({ aggregations, pool, forecast }: Props) {
  const data = forecast.dailyProjection.map((d) => ({
    date: d.date,
    actual: d.date <= aggregations.lastDayInData ? d.projected : null,
    projected: d.date > aggregations.lastDayInData ? d.projected : null,
    pool: pool.totalPool,
  }));
  return (
    <ChartFrame
      title="Pool Burn-Down + Forecast"
      subtitle={
        forecast.pierceDate
          ? `Pool runs dry on ${formatDate(forecast.pierceDate)}`
          : "Pool lasts until end of month"
      }
      className="col-span-1 xl:col-span-2"
    >
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 24, right: 64, left: 0, bottom: 4 }}>
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
                label={{ value: "Pool runs dry", fill: "#ef4444", fontSize: 10, position: "insideTopLeft", offset: 6 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
