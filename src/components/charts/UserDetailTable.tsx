import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [query]);
  const allRows = [...aggregations.perUser].map((u) => ({
    ...u,
    share: pool.totalPool > 0 ? u.totalAic / pool.totalPool : 0,
  }));
  const trimmedQuery = query.trim().toLowerCase();
  const rows = trimmedQuery
    ? allRows.filter((u) => u.username.toLowerCase().includes(trimmedQuery))
    : allRows;
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
    <ChartFrame
      title="User Details"
      subtitle={
        trimmedQuery
          ? `${rows.length} of ${allRows.length} active users`
          : `${allRows.length} active users`
      }
      className="col-span-full"
    >
      <div className="mb-3 relative max-w-xs">
        <Search className="w-4 h-4 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username…"
          className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
        />
      </div>
      <div ref={scrollerRef} className="overflow-auto h-[480px] [overflow-anchor:none]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-900/80 backdrop-blur-sm">
            <tr>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-white/50">
                #
              </th>
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-white/40">
                  No users match "{query}"
                </td>
              </tr>
            )}
            {rows.map((u, i) => {
              const sparkData = u.perDay.slice(-7).map((d) => d.aic);
              const over = u.totalAic > pool.fairSharePerSeat;
              return (
                <tr key={u.username} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 tabular text-white/50">{i + 1}</td>
                  <td className="px-3 py-2 tabular">
                    <span className="uname">{u.username}</span>
                  </td>
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
