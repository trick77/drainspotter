import { formatUsd } from "@/lib/format";

type Props = {
  slots: number;
  costPerSeat: number;
  overageBudget: number;
  onSlotsChange: (v: number) => void;
  onCostChange: (v: number) => void;
  onOverageChange: (v: number) => void;
};

export function PoolControls({
  slots,
  costPerSeat,
  overageBudget,
  onSlotsChange,
  onCostChange,
  onOverageChange,
}: Props) {
  const pool = slots * costPerSeat + Math.max(0, overageBudget || 0);
  return (
    <div className="glass-card p-5 flex flex-col md:flex-row gap-6 items-stretch md:items-center">
      <div className="md:flex-[2] md:min-w-0">
        <div className="flex items-baseline justify-between mb-2">
          <div className="kpi-label">Purchased Slots</div>
          <div
            className="text-2xl font-semibold tabular text-white cursor-pointer select-none"
            onClick={() => onSlotsChange(Math.min(500, slots + 1))}
            onContextMenu={(e) => {
              e.preventDefault();
              onSlotsChange(Math.max(1, slots - 1));
            }}
            title="Click to add a seat, right-click to remove one"
          >
            {slots}
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={500}
          value={slots}
          onChange={(e) => onSlotsChange(parseInt(e.target.value, 10))}
          className="w-full accent-drain-400"
          aria-label="Number of purchased slots"
        />
      </div>
      <div className="md:w-36">
        <div className="kpi-label mb-2">Cost/Seat (USD)</div>
        <input
          type="number"
          min={0}
          step={1}
          value={costPerSeat}
          onChange={(e) => onCostChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right tabular focus:outline-none focus:border-drain-400"
          aria-label="Cost per Seat"
        />
        <div className="text-xs text-white/40 mt-1">Promo Jun–Aug: $49</div>
      </div>
      <div className="md:w-36">
        <div className="kpi-label mb-2">Overage Budget</div>
        <input
          type="number"
          min={0}
          step={10}
          value={overageBudget}
          onChange={(e) => onOverageChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right tabular focus:outline-none focus:border-drain-400"
          aria-label="Monthly overage budget in USD"
        />
        <div className="text-xs text-white/40 mt-1">USD per month</div>
      </div>
      <div className="md:w-48 text-right">
        <div className="kpi-label mb-2">Pool</div>
        <div className="kpi-value">{formatUsd(pool)}</div>
      </div>
    </div>
  );
}
