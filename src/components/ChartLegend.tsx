type Payload = { value: string; color: string; type?: string };

type Props = { payload?: Payload[] };

export function ChartLegend({ payload = [] }: Props) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center pt-2 text-xs text-white/70">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: p.color }}
          />
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}
