import React, { useMemo } from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

function resolveBarColor(color?: string): string {
  if (!color) return "hsl(var(--primary))";

  if (!color.startsWith("bg-")) return color;

  switch (color) {
    case "bg-primary":
      return "hsl(var(--primary))";
    case "bg-muted":
      return "hsl(var(--muted))";
    case "bg-blue-500":
      return "#3b82f6";
    case "bg-amber-500":
      return "#f59e0b";
    case "bg-emerald-500":
      return "#10b981";
    case "bg-red-500":
      return "#ef4444";
    case "bg-slate-500":
      return "#64748b";
    default:
      return "hsl(var(--primary))";
  }
}

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  title?: string;
  maxHeight?: number;
}

export function BarChart({ items, title, maxHeight = 160 }: BarChartProps) {
  const data = useMemo(
    () =>
      items.map((item) => ({
        label: item.label,
        value: item.value,
        color: item.color,
      })),
    [items],
  );

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
      )}
      <div style={{ height: maxHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 12 }}
          >
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              height={18}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.35 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                fontSize: 12,
              }}
              labelStyle={{
                color: "hsl(var(--muted-foreground))",
                fontSize: 12,
                marginBottom: 4,
              }}
              formatter={(value: any) => [value, "Qtd"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={resolveBarColor(entry.color)}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
