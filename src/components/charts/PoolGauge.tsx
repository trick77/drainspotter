import { ChartFrame } from "@/components/ChartFrame";
import { chartColors } from "@/lib/chart-theme";
import { formatUsd, formatPercent } from "@/lib/format";
import type { PoolState, Forecast } from "@/lib/types";

type Props = { pool: PoolState; forecast: Forecast };

export function PoolGauge({ pool, forecast }: Props) {
  const size = 240;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius;
  const spentFraction = Math.min(1, pool.percentUsed);
  const forecastFraction = pool.totalPool > 0 ? Math.min(2, forecast.forecastEoM / pool.totalPool) : 0;
  const spentLen = circumference * spentFraction;
  const overshoot = forecastFraction > 1;
  const forecastLen = circumference * Math.min(1, forecastFraction);

  return (
    <ChartFrame title="Pool Gauge" subtitle={`${formatPercent(pool.percentUsed)} used`}>
      <div className="relative h-[260px] flex items-end justify-center">
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          <path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke={chartColors.grid}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
            fill="none"
            stroke="url(#drainBarH)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${spentLen} ${circumference}`}
            style={{ transition: "stroke-dasharray 600ms ease-out" }}
          />
          {forecast.forecastEoM > pool.spent && pool.totalPool > 0 && (
            <path
              d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
              fill="none"
              stroke={overshoot ? chartColors.overshoot : chartColors.cool500}
              strokeWidth={stroke * 0.4}
              strokeLinecap="round"
              strokeDasharray={`${forecastLen} ${circumference}`}
              opacity={0.6}
            />
          )}
        </svg>
        {overshoot && (
          <div className="absolute top-0 right-0 px-2 py-1 rounded-full bg-overshoot/10 border border-overshoot/30 text-overshoot text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-overshoot animate-pulse" />
            over budget
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
          <div className="text-4xl font-semibold tabular text-fg">
            {formatUsd(pool.spent)}
          </div>
          <div className="text-xs text-fg-subtle mt-1">
            of {formatUsd(pool.totalPool)}
          </div>
          <div className="text-xs text-fg-faint mt-1">
            Forecast: {formatUsd(forecast.forecastEoM)}
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}
