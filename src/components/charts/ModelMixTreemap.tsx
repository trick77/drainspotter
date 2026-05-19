import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame } from "@/components/ChartFrame";
import { ChartTooltip } from "@/components/ChartTooltip";
import { modelColor } from "@/lib/model-colors";
import type { Aggregations } from "@/lib/types";

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
  const data: TreemapNode[] = aggregations.perModel.map((m) => ({
    name: m.model,
    size: m.totalAic,
    color: modelColor(m.model),
  }));
  return (
    <ChartFrame title="Modell-Mix" subtitle="$-Anteil pro Modell">
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={data} dataKey="size" stroke="rgba(0,0,0,0.2)" content={<CustomContent />} isAnimationActive>
            <Tooltip content={<ChartTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
