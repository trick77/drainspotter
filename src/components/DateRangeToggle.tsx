import type { DateRange } from "@/lib/types";
import { clsx } from "clsx";

type Props = { value: DateRange; onChange: (v: DateRange) => void };

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "14d", label: "14d" },
  { value: "all", label: "Monat" },
];

export function DateRangeToggle({ value, onChange }: Props) {
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
