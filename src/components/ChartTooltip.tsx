import { formatUsd, formatDate } from "@/lib/format";

type Payload = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
};

type Props = {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  labelFormatter?: (l: string | number) => string;
  valueFormatter?: (v: number) => string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = formatUsd,
}: Props) {
  if (!active || !payload || payload.length === 0) return null;
  const labelStr =
    labelFormatter && label !== undefined
      ? labelFormatter(label)
      : typeof label === "string" && /^\d{4}-\d{2}-\d{2}$/.test(label)
      ? formatDate(label)
      : String(label ?? "");
  return (
    <div className="glass-card px-3 py-2 text-xs min-w-[160px]">
      {labelStr && <div className="text-white/60 mb-1">{labelStr}</div>}
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-white/80 flex-1 truncate">{p.name}</span>
            <span className="tabular text-white font-medium">
              {typeof p.value === "number" ? valueFormatter(p.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
