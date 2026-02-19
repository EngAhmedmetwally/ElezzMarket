
"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLanguage } from "@/components/language-provider";

const chartConfig = {
    orders: {
        label: "Orders"
    },
    "تم التسجيل": { label: "تم التسجيل", color: "hsl(var(--chart-1))" },
    "قيد التجهيز": { label: "قيد التجهيز", color: "hsl(var(--chart-3))" },
    "تم الشحن": { label: "تم الشحن", color: "hsl(var(--chart-4))" },
    "مكتمل": { label: "مكتمل", color: "hsl(var(--chart-2))" },
    "ملغي": { label: "ملغي", color: "hsl(var(--chart-5))" },
}

interface OrdersByStatusChartProps {
    data: { name: string; value: number }[];
}

export function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
    const { language } = useLanguage();
    const chartTitle = language === 'ar' ? 'الطلبات حسب الحالة' : 'Orders by Status';

    const chartData = data.map(item => ({
        ...item, 
        fill: (chartConfig as any)[item.name]?.color || 'hsl(var(--muted))'
    }));

    if (!chartData || chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{chartTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[348px]">
                    <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display'}</p>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={5}
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
