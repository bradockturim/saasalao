"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Scissors } from "lucide-react";

export type PieChartService = { name: string; value: number };

const COLORS = ["#c026d3", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent = 0,
  } = props;
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r =
    Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.55;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(Number(percent) * 100).toFixed(0)}%`}
    </text>
  );
};

export function ServicesPieChart({ data }: { data: PieChartService[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">
            Top 5 serviços do mês
          </h2>
        </div>
        {data.length > 0 && (
          <span className="text-sm text-gray-500">
            {data.reduce((s, d) => s + d.value, 0)} agendamentos
          </span>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
            <Scissors className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum serviço agendado este mês.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  `${value ?? 0} agendamento${(value ?? 0) !== 1 ? "s" : ""}`,
                  name,
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
