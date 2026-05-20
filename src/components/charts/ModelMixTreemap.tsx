import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import type { Aggregations } from "@/lib/types";

// Top spender flagged in orange (matches "AI overage" color from neighboring card);
// remaining models in descending cyan shades.
const TOP_COLOR = "#fb923c"; // orange-400
const CYAN_SHADES = [
  "#22d3ee", // cyan-400
  "#06b6d4", // cyan-500
  "#0891b2", // cyan-600
  "#0e7490", // cyan-700
  "#155e75", // cyan-800
  "#164e63", // cyan-900
];

function modelColorAt(index: number): string {
  if (index === 0) return TOP_COLOR;
  return CYAN_SHADES[(index - 1) % CYAN_SHADES.length];
}

type Props = { aggregations: Aggregations };

type TreemapNode = {
  name: string;
  size: number;
  color: string;
};

function CustomContent(props: any) {
  const { x, y, width, height, name, color } = props;
  const showLabel = width > 60 && height > 36;
  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={color}
        rx={6}
        ry={6}
        style={{ transition: "filter 150ms" }}
      />
      {showLabel && (
        <text x={x + 10} y={y + 22} fill="white" fontSize={12} fontWeight={500} pointerEvents="none">
          {name}
        </text>
      )}
    </g>
  );
}

export function ModelMixTreemap({ aggregations }: Props) {
  const data: TreemapNode[] = aggregations.perModel.map((m, i) => ({
    name: m.model,
    size: m.totalAic,
    color: modelColorAt(i),
  }));
  return (
    <ChartFrame title="Model Mix" subtitle="$ share per model">
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={data} dataKey="size" stroke="rgba(0,0,0,0.2)" content={<CustomContent />} isAnimationActive={false}>
            <Tooltip content={<ChartTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
