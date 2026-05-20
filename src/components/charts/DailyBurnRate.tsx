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
import type { Aggregations } from "@/lib/types";
import { clsx } from "clsx";

type Props = {
  aggregations: Aggregations;
  groupBy: "user" | "model";
  onGroupByChange: (g: "user" | "model") => void;
  topN?: number;
};

export function DailyBurnRate({
  aggregations,
  groupBy,
  onGroupByChange,
  topN = 6,
}: Props) {
  const filtered = aggregations.perDay;
  const topKeys =
    groupBy === "user"
      ? aggregations.perUser.slice(0, topN).map((u) => u.username)
      : aggregations.perModel.slice(0, topN).map((m) => m.model);
  const data = filtered.map((d) => {
    const src = groupBy === "user" ? (d as any).byUser : (d as any).byModel;
    const row: Record<string, string | number> = { date: (d as any).date };
    let other = 0;
    for (const [k, v] of Object.entries(src)) {
      if (topKeys.includes(k)) row[k] = v as number;
      else other += v as number;
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
      subtitle={`Stacked, grouped by ${groupBy === "user" ? "user" : "model"}`}
      className="col-span-1"
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
              {g === "user" ? "User" : "Model"}
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
              content={
                <ChartTooltip
                  valueFormatter={formatUsd}
                  nameClassName={groupBy === "user" ? "uname" : undefined}
                />
              }
            />
            <Legend
              content={
                <ChartLegend
                  valueClassName={groupBy === "user" ? "uname" : undefined}
                />
              }
            />
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
