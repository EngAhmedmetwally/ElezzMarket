
"use client";

import * as React from "react"
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/components/language-provider";

const statusColors: Record<string, string> = {
    "تم الحجز": "hsl(var(--chart-1))",
    "تم الارسال": "hsl(var(--chart-3))",
    "تم التسليم": "hsl(var(--chart-2))",
    "ملغي": "hsl(var(--chart-5))",
};


const chartConfig = {
    orders: {
        label: "Orders"
    },
    "تم الحجز": { label: "تم الحجز", color: "hsl(var(--chart-1))" },
    "تم الارسال": { label: "تم الارسال", color: "hsl(var(--chart-3))" },
    "تم التسليم": { label: "تم التسليم", color: "hsl(var(--chart-2))" },
    "ملغي": { label: "ملغي", color: "hsl(var(--chart-5))" },
};

interface OrdersStatusPieChartProps {
    data: { name: string; value: number }[];
}

export function OrdersStatusPieChart({ data }: OrdersStatusPieChartProps) {
    const { language } = useLanguage();
    const chartData = data.map(item => ({...item, fill: statusColors[item.name] || 'hsl(var(--muted))' }))
    const totalOrders = React.useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

    if (!chartData || chartData.length === 0) {
        return <div className="flex items-center justify-center h-[120px] text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</div>;
    }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[120px]">
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
          startAngle={90}
          endAngle={450}
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
      </PieChart>
    </ChartContainer>
  );
}
