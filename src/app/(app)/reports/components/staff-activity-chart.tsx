
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";
import type { OrderStatus } from "@/lib/types";

const statusKeyMap: Record<OrderStatus, string> = {
    "تم التسجيل": "registered",
    "قيد التجهيز": "processing",
    "تم الشحن": "shipped",
    "مكتمل": "completed",
    "ملغي": "cancelled",
    "معلق": "onHold",
}

const statusOrder: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "معلق", "مكتمل", "ملغي"];
const chartConfig = {
    [statusKeyMap["تم التسجيل"]]: { label: "تم التسجيل", color: "hsl(var(--chart-1))" },
    [statusKeyMap["قيد التجهيز"]]: { label: "قيد التجهيز", color: "hsl(var(--chart-2))" },
    [statusKeyMap["تم الشحن"]]: { label: "تم الشحن", color: "hsl(var(--chart-3))" },
    [statusKeyMap["مكتمل"]]: { label: "مكتمل", color: "hsl(var(--chart-4))" },
    [statusKeyMap["ملغي"]]: { label: "ملغي", color: "hsl(var(--chart-5))" },
    [statusKeyMap["معلق"]]: { label: "معلق", color: "hsl(var(--chart-6))" },
};

interface StaffActivityChartProps {
    data: { name: string; actions: { [key: string]: number } }[];
}

export function StaffActivityChart({ data }: StaffActivityChartProps) {
  const isMobile = useIsMobile();
  const { language, isRTL } = useLanguage();
  const chartTitle = language === 'ar' ? 'نشاط الموظفين (أعمدة)' : 'Staff Activity Columns';

  const chartData = data.map(item => {
      const newItem: {name: string, [key: string]: number | string} = { name: item.name };
      statusOrder.forEach(status => {
          newItem[statusKeyMap[status]] = item.actions[status] || 0;
      });
      return newItem;
  });

  const axisFormatter = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[450px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 10, fill: 'currentColor' }}
            />
            <YAxis 
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={axisFormatter}
                orientation={isRTL ? "right" : "left"}
                tick={{ fontSize: 10, fill: 'currentColor' }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
              content={<ChartTooltipContent 
                indicator="dot" 
                labelFormatter={(label) => label}
              />}
            />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
            {statusOrder.map((status) => (
                 <Bar 
                    key={status} 
                    dataKey={statusKeyMap[status]} 
                    name={status}
                    stackId="a" 
                    fill={`var(--color-${statusKeyMap[status]})`} 
                    radius={[0, 0, 0, 0]}
                    barSize={isMobile ? 30 : 50}
                />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
