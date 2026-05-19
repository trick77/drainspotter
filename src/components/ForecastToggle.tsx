import type { ForecastMode } from "@/lib/types";
import { clsx } from "clsx";

type Props = { value: ForecastMode; onChange: (v: ForecastMode) => void };

const OPTIONS: { value: ForecastMode; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "rolling7", label: "7-Day Avg" },
];

export function ForecastToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-3 py-1 text-xs rounded-md transition-colors",
            value === o.value
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
