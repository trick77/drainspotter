import { formatUsd } from "@/lib/format";

type Props = {
  slots: number;
  costPerSeat: number;
  onSlotsChange: (v: number) => void;
  onCostChange: (v: number) => void;
};

export function PoolControls({ slots, costPerSeat, onSlotsChange, onCostChange }: Props) {
  const pool = slots * costPerSeat;
  return (
    <div className="glass-card p-5 flex flex-col md:flex-row gap-6 items-stretch md:items-center">
      <div className="flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <div className="kpi-label">Gekaufte Slots</div>
          <div className="text-2xl font-semibold tabular text-white">{slots}</div>
        </div>
        <input
          type="range"
          min={1}
          max={500}
          value={slots}
          onChange={(e) => onSlotsChange(parseInt(e.target.value, 10))}
          className="w-full accent-drain-400"
          aria-label="Anzahl gekaufter Slots"
        />
      </div>
      <div className="md:w-48">
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
      <div className="md:w-48 text-right">
        <div className="kpi-label mb-2">Pool</div>
        <div className="kpi-value">{formatUsd(pool)}</div>
      </div>
    </div>
  );
}
