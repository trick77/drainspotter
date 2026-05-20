import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ZAxis,
} from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { modelColor } from "@/lib/model-colors";
import { formatDate } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = {
  aggregations: Aggregations;
};

type Event = { date: string; username: string; y: number };

function BreachTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: Event }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const ev = payload[0].payload;
  if (!ev) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs min-w-[160px]">
      <div className="text-white/60 mb-1">{formatDate(ev.date)}</div>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: modelColor(`user:${ev.username}`) }}
        />
        <span className="text-white font-medium">{ev.username}</span>
        <span className="text-white/60 ml-auto">exceeded quota</span>
      </div>
    </div>
  );
}

export function QuotaBreachTimeline({ aggregations }: Props) {
  const userSet = new Set<string>();
  aggregations.perDay.forEach((d) => d.breachedUsers.forEach((u) => userSet.add(u)));
  const users = [...userSet].sort();
  const userIndex = new Map(users.map((u, i) => [u, i]));

  const events: Event[] = [];
  aggregations.perDay.forEach((d) => {
    d.breachedUsers.forEach((u) => {
      events.push({ date: d.date, username: u, y: userIndex.get(u)! });
    });
  });

  const allDates = aggregations.perDay.map((d) => d.date);

  if (events.length === 0) {
    return (
      <ChartFrame
        title="Quota Breaches"
        subtitle="Days when users exceeded their personal monthly quota"
        className="col-span-full"
      >
        <div className="flex items-center justify-center h-[160px] text-sm text-white/50">
          No quota breaches in this period.
        </div>
      </ChartFrame>
    );
  }

  const rowHeight = 22;
  const height = Math.max(160, users.length * rowHeight + 80);

  return (
    <ChartFrame
      title="Quota Breaches"
      subtitle="Days when users exceeded their personal monthly quota"
      className="col-span-full"
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 80, bottom: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <XAxis
              type="category"
              dataKey="date"
              allowDuplicatedCategory={false}
              ticks={allDates}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              tickFormatter={(v) => formatDate(String(v)).slice(0, 5)}
              interval="preserveStartEnd"
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, users.length - 0.5]}
              ticks={users.map((_, i) => i)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
              tickFormatter={(v) => users[v as number] ?? ""}
              width={80}
            />
            <ZAxis range={[80, 80]} />
            <Tooltip cursor={{ stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4" }} content={<BreachTooltip />} />
            {users.map((u) => (
              <Scatter
                key={u}
                name={u}
                data={events.filter((e) => e.username === u)}
                fill={modelColor(`user:${u}`)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
