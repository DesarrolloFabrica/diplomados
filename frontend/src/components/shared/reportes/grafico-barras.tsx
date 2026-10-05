"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GraficoBarrasProps {
  datos: { etiqueta: string; valor: number }[];
  etiquetaValor: string;
  sufijo?: string;
}

export function GraficoBarras({ datos, etiquetaValor, sufijo = "" }: GraficoBarrasProps) {
  const chartBorder = "var(--chart-border, hsl(var(--border)))";
  const chartMuted = "var(--chart-muted, hsl(var(--muted-foreground)))";
  const chartTooltipBg = "var(--chart-tooltip-bg, hsl(var(--card)))";
  const chartTooltipText = "var(--chart-tooltip-text, hsl(var(--foreground)))";
  const chartCursor = "var(--chart-cursor, hsl(var(--accent)))";
  const chartBar = "var(--chart-bar, hsl(var(--primary)))";

  if (datos.length === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Todavía no hay datos suficientes.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartBorder} vertical={false} />
        <XAxis
          dataKey="etiqueta"
          tick={{ fontSize: 12, fill: chartMuted }}
          axisLine={{ stroke: chartBorder }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: chartMuted }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ fill: chartCursor }}
          contentStyle={{
            backgroundColor: chartTooltipBg,
            border: `1px solid ${chartBorder}`,
            borderRadius: "8px",
            color: chartTooltipText,
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}${sufijo}`, etiquetaValor]}
        />
        <Bar dataKey="valor" fill={chartBar} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
