
"use client";

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/components/language-provider";

const chartConfig = {
    orders: {
        label: "Orders"
    },
    "تم التسجيل": { label: "تم التسجيل", color: "hsl(var(--chart-1))" }, // Blue
    "قيد التجهيز": { label: "قيد التجهيز", color: "hsl(var(--chart-2))" }, // Yellow
    "تم الشحن": { label: "تم الشحن", color: "hsl(var(--chart-3))" }, // Dark Orange
    "مكتمل": { label: "مكتمل", color: "hsl(var(--chart-4))" }, // Green
    "ملغي": { label: "ملغي", color: "hsl(var(--chart-5))" }, // Grey
};

interface OrdersStatusPieChartProps {
    data: { name: string; value: number }[];
}

export function OrdersStatusPieChart({ data }: OrdersStatusPieChartProps) {
    const { language } = useLanguage();
    const chartData = data.map(item => ({
        ...item, 
        fill: (chartConfig as any)[item.name]?.color || 'hsl(var(--muted))'
    }));
    const totalOrders = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

    if (!chartData || chartData.length === 0) {
        return <div className="flex items-center justify-center h-[150px] text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</div>;
    }

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[150px] w-full"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={40}
          outerRadius={55}
          paddingAngle={2}
        >
            <Label
                content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                        <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        >
                        <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-2xl font-bold"
                        >
                            {totalOrders.toLocaleString()}
                        </tspan>
                        <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 12}
                            className="fill-muted-foreground text-xs"
                        >
                            {language === 'ar' ? 'طلبات' : 'Orders'}
                        </tspan>
                        </text>
                    );
                    }
                }}
            />
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
      </PieChart>
    </ChartContainer>
  );
}
