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
import { chartColors } from "@/lib/chart-theme";
import { modelColor } from "@/lib/model-colors";
import { formatPercent, formatDate } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = {
  aggregations: Aggregations;
  topN?: number;
};

export function ModelMixTrend({ aggregations, topN = 6 }: Props) {
  const topKeys = aggregations.perModel.slice(0, topN).map((m) => m.model);
  const data = aggregations.perDay.map((d) => {
    const total = d.totalAic > 0 ? d.totalAic : 1;
    const row: Record<string, string | number> = { date: d.date };
    let other = 0;
    for (const [k, v] of Object.entries(d.byModel)) {
      if (topKeys.includes(k)) row[k] = (v as number) / total;
      else other += v as number;
    }
    topKeys.forEach((k) => {
      if (!(k in row)) row[k] = 0;
    });
    row["other"] = other / total;
    return row;
  });
  const colorFor = (k: string) =>
    k === "other" ? chartColors.fgFaint : modelColor(k);

  return (
    <ChartFrame
      title="Model Adoption"
      subtitle="Share of daily spend per model"
      className="col-span-1"
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.axis, fontSize: 11 }}
              tickFormatter={(v) => formatDate(v).slice(0, 5)}
            />
            <YAxis
              domain={[0, 1]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: chartColors.axis, fontSize: 11 }}
              tickFormatter={(v) => formatPercent(v as number)}
            />
            <Tooltip
              cursor={{ stroke: chartColors.cursorStroke, strokeDasharray: "4 4" }}
              content={<ChartTooltip valueFormatter={(v) => formatPercent(v)} />}
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
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
