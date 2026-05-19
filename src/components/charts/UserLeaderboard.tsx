import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import type { Aggregations, PoolState } from "@/lib/types";

type Props = { aggregations: Aggregations; pool: PoolState; topN?: number };

export function UserLeaderboard({ aggregations, pool, topN = 12 }: Props) {
  const data = aggregations.perUser.slice(0, topN).map((u) => ({
    user: u.username,
    spent: u.totalAic,
  }));
  return (
    <ChartFrame
      title="Top Drainers"
      subtitle={`Top ${data.length} users · Fair-Share = ${formatUsd(pool.fairSharePerSeat)}`}
      className="col-span-1 md:col-span-2"
    >
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 72, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={formatUsdCompact}
            />
            <YAxis
              type="category"
              dataKey="user"
              tickLine={false}
              axisLine={false}
              width={150}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={
                <ChartTooltip
                  valueFormatter={(v) => formatUsd(v)}
                  labelFormatter={(l) => `User: ${l}`}
                />
              }
            />
            <ReferenceLine
              x={pool.fairSharePerSeat}
              stroke="#22d3ee"
              strokeDasharray="4 4"
              label={{ value: "Fair-Share", fill: "#22d3ee", fontSize: 10, position: "top" }}
            />
            <Bar dataKey="spent" radius={[0, 6, 6, 0]} fill="url(#drainBarH)" name="Spent">
              {data.map((_, i) => (
                <Cell key={i} fill="url(#drainBarH)" />
              ))}
              <LabelList
                dataKey="spent"
                position="right"
                formatter={(v: number) => formatUsd(v)}
                style={{ fill: "rgba(255,255,255,0.85)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
