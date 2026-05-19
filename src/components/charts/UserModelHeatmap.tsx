import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations; topNUsers?: number };

function intensityColor(t: number): string {
  if (t <= 0) return "rgba(255,255,255,0.04)";
  if (t < 0.5) {
    const k = t / 0.5;
    const r = Math.round(129 + (251 - 129) * k);
    const g = Math.round(140 + (146 - 140) * k);
    const b = Math.round(248 + (60 - 248) * k);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + t * 0.6})`;
  }
  const k = (t - 0.5) / 0.5;
  const r = Math.round(251 + (244 - 251) * k);
  const g = Math.round(146 + (63 - 146) * k);
  const b = Math.round(60 + (94 - 60) * k);
  return `rgba(${r}, ${g}, ${b}, ${0.6 + t * 0.4})`;
}

export function UserModelHeatmap({ aggregations, topNUsers = 15 }: Props) {
  const users = aggregations.perUser.slice(0, topNUsers).map((u) => u.username);
  const models = aggregations.perModel.map((m) => m.model);
  const cellMap = new Map(
    aggregations.userModel.map((c) => [`${c.username}|${c.model}`, c.aic])
  );
  let max = 0;
  for (const u of users) for (const m of models) max = Math.max(max, cellMap.get(`${u}|${m}`) ?? 0);

  return (
    <ChartFrame
      title="User × Modell Heatmap"
      subtitle="Wer setzt schwergewichtig auf welches Modell"
      className="col-span-full"
    >
      <div className="overflow-x-auto">
        <table className="text-xs border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th className="text-left text-white/40 font-normal px-2 py-1 sticky left-0 bg-transparent" />
              {models.map((m) => (
                <th
                  key={m}
                  className="text-white/40 font-normal px-1.5 py-1 align-bottom"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", minWidth: 28 }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u}>
                <td className="text-white/80 px-2 py-1 sticky left-0 bg-transparent whitespace-nowrap">
                  {u}
                </td>
                {models.map((m) => {
                  const v = cellMap.get(`${u}|${m}`) ?? 0;
                  const t = max > 0 ? v / max : 0;
                  return (
                    <td
                      key={m}
                      title={`${u} · ${m}: ${formatUsd(v)}`}
                      className="rounded-md transition-transform hover:scale-110"
                      style={{
                        background: intensityColor(t),
                        width: 28,
                        height: 28,
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
