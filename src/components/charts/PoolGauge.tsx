import { ChartFrame } from "@/components/ChartFrame";
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
            stroke="rgba(255,255,255,0.08)"
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
              stroke={overshoot ? "#ef4444" : "#818cf8"}
              strokeWidth={stroke * 0.4}
              strokeLinecap="round"
              strokeDasharray={`${forecastLen} ${circumference}`}
              opacity={0.6}
            />
          )}
          {overshoot && (
            <text
              x={size - 12}
              y={size / 2 - 4}
              textAnchor="end"
              fill="#ef4444"
              fontSize={11}
              fontWeight={600}
            >
              ! over budget
            </text>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 pointer-events-none">
          <div className="text-4xl font-semibold tabular bg-gradient-to-r from-white to-cool-400 bg-clip-text text-transparent">
            {formatUsd(pool.spent)}
          </div>
          <div className="text-xs text-white/50 mt-1">
            of {formatUsd(pool.totalPool)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            Forecast: {formatUsd(forecast.forecastEoM)}
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}
