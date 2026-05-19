import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { formatUsd, formatPercent } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

export function ParetoChart({ aggregations }: Props) {
  const total = aggregations.totalAic || 1;
  let cum = 0;
  const data = aggregations.perUser.map((u, i) => {
    cum += u.totalAic;
    return {
      rank: i + 1,
      user: u.username,
      spent: u.totalAic,
      cumPct: cum / total,
    };
  });
  const eightyIdx = data.findIndex((d) => d.cumPct >= 0.8);
  return (
    <ChartFrame
      title="Pareto"
      subtitle={
        eightyIdx >= 0
          ? `Top ${eightyIdx + 1} users ≙ 80% of pool spend`
          : "Concentration distribution"
      }
    >
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="rank"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatUsd(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              tickFormatter={(v) => formatPercent(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(v) => (v <= 1 ? formatPercent(v) : formatUsd(v))}
                  labelFormatter={(l) => `Rank ${l}`}
                />
              }
            />
            <Bar yAxisId="left" dataKey="spent" fill="url(#drainBar)" name="Spent" radius={[3, 3, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumPct"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              name="Cumulative %"
              isAnimationActive
            />
            <ReferenceLine yAxisId="right" y={0.8} stroke="#22d3ee" strokeDasharray="2 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
