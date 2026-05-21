import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations; topNUsers?: number };

function intensityColor(t: number): string {
  if (t <= 0) return "var(--color-surface-muted)";
  if (t < 0.5) {
    // indigo-600 → orange-500
    const k = t / 0.5;
    const r = Math.round(79 + (249 - 79) * k);
    const g = Math.round(70 + (115 - 70) * k);
    const b = Math.round(229 + (22 - 229) * k);
    return `rgba(${r}, ${g}, ${b}, ${0.55 + t * 0.5})`;
  }
  // orange-500 → rose-600
  const k = (t - 0.5) / 0.5;
  const r = Math.round(249 + (225 - 249) * k);
  const g = Math.round(115 + (29 - 115) * k);
  const b = Math.round(22 + (72 - 22) * k);
  return `rgba(${r}, ${g}, ${b}, ${0.8 + t * 0.2})`;
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
      title="User × Model Heatmap"
      subtitle="Who relies heavily on which model"
      className="col-span-full"
    >
      <div className="overflow-x-auto">
        <table className="text-xs border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th className="text-left text-fg-faint font-normal px-2 py-1 sticky left-0 bg-transparent" />
              {models.map((m) => (
                <th
                  key={m}
                  className="text-fg-faint font-normal px-1.5 py-1 align-bottom"
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
                <td className="text-fg-muted px-2 py-1 sticky left-0 bg-transparent whitespace-nowrap">
                  <span className="uname">{u}</span>
                </td>
                {models.map((m) => {
                  const v = cellMap.get(`${u}|${m}`) ?? 0;
                  const t = max > 0 ? v / max : 0;
                  return (
                    <td
                      key={m}
                      title={`${m}: ${formatUsd(v)}`}
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
