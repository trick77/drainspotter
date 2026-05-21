import { Trophy, Medal, Award } from "lucide-react";
import { ChartFrame } from "@/components/ChartFrame";
import { formatUsd } from "@/lib/format";
import type { Aggregations } from "@/lib/types";

type Props = { aggregations: Aggregations };

type Place = {
  rank: 1 | 2 | 3;
  user: { username: string; totalAic: number; totalRequests: number };
};

const PODIUM_STYLE: Record<
  1 | 2 | 3,
  {
    order: string;
    height: string;
    medalBg: string;
    medalRing: string;
    medalText: string;
    icon: typeof Trophy;
    barFrom: string;
    barTo: string;
    label: string;
    glow: string;
  }
> = {
  1: {
    order: "order-2",
    height: "h-40",
    medalBg: "bg-gradient-to-br from-yellow-300 to-amber-500",
    medalRing: "ring-yellow-200/40",
    medalText: "text-amber-900",
    icon: Trophy,
    barFrom: "from-yellow-400/80",
    barTo: "to-amber-600/60",
    label: "1st",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.35)]",
  },
  2: {
    order: "order-1",
    height: "h-28",
    medalBg: "bg-gradient-to-br from-slate-200 to-slate-400",
    medalRing: "ring-slate-200/30",
    medalText: "text-slate-800",
    icon: Medal,
    barFrom: "from-slate-300/70",
    barTo: "to-slate-500/50",
    label: "2nd",
    glow: "shadow-[0_0_24px_rgba(203,213,225,0.2)]",
  },
  3: {
    order: "order-3",
    height: "h-20",
    medalBg: "bg-gradient-to-br from-orange-400 to-amber-700",
    medalRing: "ring-orange-300/30",
    medalText: "text-amber-950",
    icon: Award,
    barFrom: "from-orange-500/70",
    barTo: "to-amber-800/50",
    label: "3rd",
    glow: "shadow-[0_0_24px_rgba(251,146,60,0.2)]",
  },
};

export function TopDrainersPodium({ aggregations }: Props) {
  const top3 = aggregations.perUser.slice(0, 3);
  if (top3.length === 0) return null;

  const places: Place[] = top3.map((u, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    user: u,
  }));

  return (
    <ChartFrame
      title="Hall of Drain"
      subtitle="Top 3 drainers of the month"
    >
      <div className="h-[360px] flex flex-col">
        <div className="flex-1 flex items-end justify-center gap-3 md:gap-6 pt-4">
          {places.map(({ rank, user }) => {
            const s = PODIUM_STYLE[rank];
            const Icon = s.icon;
            return (
              <div
                key={rank}
                className={`${s.order} flex flex-col items-center w-1/3 max-w-[180px]`}
              >
                <div
                  className={`relative mb-3 w-14 h-14 rounded-full ${s.medalBg} ${s.glow} ring-4 ${s.medalRing} flex items-center justify-center`}
                >
                  <Icon className={`w-7 h-7 ${s.medalText}`} strokeWidth={2.5} />
                </div>
                <div className="uname text-sm font-medium text-fg text-center truncate w-full px-1">
                  {user.username}
                </div>
                <div className="text-xs text-fg-subtle mt-0.5 tabular-nums">
                  {formatUsd(user.totalAic)}
                </div>
                <div
                  className={`mt-2 w-full ${s.height} rounded-t-lg bg-gradient-to-t ${s.barFrom} ${s.barTo} border-t border-x border-border-strong flex items-start justify-center pt-2`}
                >
                  <span className="text-2xl md:text-3xl font-bold text-fg-strong drop-shadow">
                    {rank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartFrame>
  );
}
