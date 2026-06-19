import { formatUsd } from "@/lib/format";
import { TIER_LABELS, includedCreditsForMonth } from "@/lib/pricing";
import type { SubscriptionTier } from "@/lib/types";

type Props = {
  slots: number;
  tier: SubscriptionTier;
  seatPrice: number;
  promoBonus: number;
  monthStart: string;
  overageBudget: number;
  onSlotsChange: (v: number) => void;
  onTierChange: (v: SubscriptionTier) => void;
  onSeatPriceChange: (v: number) => void;
  onPromoBonusChange: (v: number) => void;
  onOverageChange: (v: number) => void;
};

export function PoolControls({
  slots,
  tier,
  seatPrice,
  promoBonus,
  monthStart,
  overageBudget,
  onSlotsChange,
  onTierChange,
  onSeatPriceChange,
  onPromoBonusChange,
  onOverageChange,
}: Props) {
  const credits = includedCreditsForMonth(
    seatPrice,
    promoBonus,
    new Date(monthStart + "T00:00:00Z")
  );
  const promoActive = credits !== seatPrice;
  const pool = slots * credits + Math.max(0, overageBudget || 0);
  return (
    <div className="glass-card p-5 flex flex-col md:flex-row md:flex-wrap gap-6 items-stretch md:items-center">
      <div className="md:flex-[2] md:min-w-[12rem]">
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
      <div className="md:w-40">
        <div className="kpi-label mb-2">Subscription</div>
        <select
          value={tier}
          onChange={(e) => onTierChange(e.target.value as SubscriptionTier)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-drain-400"
          aria-label="Subscription tier"
        >
          {(Object.keys(TIER_LABELS) as SubscriptionTier[]).map((t) => (
            <option key={t} value={t} className="bg-slate-900">
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
        <div className="text-xs text-white/40 mt-1">sets defaults</div>
      </div>
      <div className="md:w-28">
        <div className="kpi-label mb-2">Seat Price</div>
        <input
          type="number"
          min={0}
          step={1}
          value={seatPrice}
          onChange={(e) => onSeatPriceChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right tabular focus:outline-none focus:border-drain-400"
          aria-label="Seat price in USD"
        />
        <div className="text-xs text-white/40 mt-1">USD/seat</div>
      </div>
      <div className="md:w-32">
        <div className="kpi-label mb-2">Promo Bonus</div>
        <input
          type="number"
          min={0}
          step={1}
          value={promoBonus}
          onChange={(e) =>
            onPromoBonusChange(Math.max(0, parseFloat(e.target.value) || 0))
          }
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right tabular focus:outline-none focus:border-drain-400"
          aria-label="Promo bonus credits per seat"
        />
        <div className="text-xs text-white/40 mt-1">+credits Jun–Aug</div>
      </div>
      <div className="md:w-32">
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
      <div className="md:w-44 text-right md:ml-auto">
        <div className="kpi-label mb-2">Pool</div>
        <div className="kpi-value">{formatUsd(pool)}</div>
        {promoActive && (
          <div className="text-xs text-amber-400 mt-1">
            Promo: {formatUsd(credits)}/seat credits
          </div>
        )}
      </div>
    </div>
  );
}
