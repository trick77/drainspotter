import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { modelColor } from "@/lib/model-colors";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

export function CostPerRequest({ aggregations }: Props) {
  const data = [...aggregations.perModel]
    .filter((m) => m.totalRequests > 0)
    .sort((a, b) => b.costPerRequest - a.costPerRequest)
    .map((m) => ({
      model: m.model,
      cpr: m.costPerRequest,
    }));
  return (
    <ChartFrame
      title="Cost per Request"
      subtitle="$ pro Inferenz, je Modell — niedriger = effizienter"
    >
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <YAxis
              type="category"
              dataKey="model"
              tickLine={false}
              axisLine={false}
              width={140}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => formatUsd(v)}
                  labelFormatter={(l) => `Modell: ${l}`}
                />
              }
            />
            <Bar dataKey="cpr" radius={[0, 6, 6, 0]} name="$/Request">
              {data.map((d, i) => (
                <Cell key={i} fill={modelColor(d.model)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
