
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";
import type { OrderStatus } from "@/lib/types";

const statusOrder: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];
const chartConfig = {
    "تم التسجيل": { label: "تم التسجيل", color: "hsl(var(--chart-1))" }, // Blue
    "قيد التجهيز": { label: "قيد التجهيز", color: "hsl(var(--chart-2))" }, // Yellow
    "تم الشحن": { label: "تم الشحن", color: "hsl(var(--chart-3))" }, // Dark Orange
    "مكتمل": { label: "مكتمل", color: "hsl(var(--chart-4))" }, // Green
    "ملغي": { label: "ملغي", color: "hsl(var(--chart-5))" }, // Grey
};

interface StaffActivityChartProps {
    data: { name: string; actions: { [key: string]: number } }[];
}

export function StaffActivityChart({ data }: StaffActivityChartProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const chartTitle = language === 'ar' ? 'نشاط الموظفين حسب الإجراء' : 'Staff Activity by Action';

  const chartData = data.map(item => ({
      name: item.name,
      ...item.actions,
  }));

  const yAxisFormatter = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            layout="vertical"
            margin={{ top: 20, right: 20, left: isMobile ? 10 : 20, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={isMobile ? 60 : 80}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <XAxis 
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={yAxisFormatter}
                tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent 
                indicator="dot" 
              />}
            />
            <Legend contentStyle={{ fontSize: '12px' }} />
            {statusOrder.map((status, index) => (
                 <Bar 
                    key={status} 
                    dataKey={status} 
                    stackId="a" 
                    fill={`var(--color-${status.replace(/\s+/g, '-')})`} 
                    radius={[0, 4, 4, 0]}
                />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
