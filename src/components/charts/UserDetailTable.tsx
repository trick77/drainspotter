import { useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations, PoolState } from "@/lib/types";
import { clsx } from "clsx";

type Props = { aggregations: Aggregations; pool: PoolState };

type SortKey = "username" | "totalAic" | "totalRequests" | "share";

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return <span className="text-white/30">—</span>;
  const max = Math.max(...data);
  const w = 80;
  const h = 24;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = h - (max > 0 ? (v / max) * (h - 4) : 0) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function UserDetailTable({ aggregations, pool }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "totalAic",
    dir: "desc",
  });
  const rows = [...aggregations.perUser].map((u) => ({
    ...u,
    share: pool.totalPool > 0 ? u.totalAic / pool.totalPool : 0,
  }));
  rows.sort((a, b) => {
    const av = a[sort.key as keyof typeof a];
    const bv = b[sort.key as keyof typeof b];
    if (typeof av === "string" && typeof bv === "string") {
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sort.dir === "asc"
      ? Number(av) - Number(bv)
      : Number(bv) - Number(av);
  });

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th
      className="text-left px-3 py-2 text-xs uppercase tracking-wider text-white/50 cursor-pointer select-none"
      onClick={() => toggleSort(k)}
    >
      {children}
      {sort.key === k && <span className="ml-1">{sort.dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );

  return (
    <ChartFrame title="User Details" subtitle={`${rows.length} active users`} className="col-span-full">
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-900/80 backdrop-blur-sm">
            <tr>
              <Th k="username">User</Th>
              <Th k="totalAic">Spent</Th>
              <Th k="totalRequests">Requests</Th>
              <Th k="share">% Pool</Th>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-white/50">
                7-Day Trend
              </th>
              <th className="px-3 py-2 text-xs uppercase tracking-wider text-white/50">Quota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const sparkData = u.perDay.slice(-7).map((d) => d.aic);
              const over = u.totalAic > pool.fairSharePerSeat;
              return (
                <tr key={u.username} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 tabular">{u.username}</td>
                  <td
                    className={clsx(
                      "px-3 py-2 tabular",
                      over ? "text-drain-400" : "text-white"
                    )}
                  >
                    {formatUsd(u.totalAic)}
                  </td>
                  <td className="px-3 py-2 tabular text-white/70">
                    {u.totalRequests.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 tabular text-white/70">
                    {(u.share * 100).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2">
                    <MiniSpark data={sparkData} color={over ? "#fb923c" : "#818cf8"} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {u.exceedsQuota && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-rose-500/20 text-rose-300 animate-pulse">
                        exceeded
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
