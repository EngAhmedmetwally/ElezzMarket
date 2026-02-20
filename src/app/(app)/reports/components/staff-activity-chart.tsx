
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

const statusKeyMap: Record<OrderStatus, string> = {
    "تم التسجيل": "registered",
    "قيد التجهيز": "processing",
    "تم الشحن": "shipped",
    "مكتمل": "completed",
    "ملغي": "cancelled",
}

const statusOrder: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];
const chartConfig = {
    [statusKeyMap["تم التسجيل"]]: { label: "تم التسجيل", color: "hsl(var(--chart-1))" },
    [statusKeyMap["قيد التجهيز"]]: { label: "قيد التجهيز", color: "hsl(var(--chart-2))" },
    [statusKeyMap["تم الشحن"]]: { label: "تم الشحن", color: "hsl(var(--chart-3))" },
    [statusKeyMap["مكتمل"]]: { label: "مكتمل", color: "hsl(var(--chart-4))" },
    [statusKeyMap["ملغي"]]: { label: "ملغي", color: "hsl(var(--chart-5))" },
};

interface StaffActivityChartProps {
    data: { name: string; actions: { [key: string]: number } }[];
}

export function StaffActivityChart({ data }: StaffActivityChartProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const chartTitle = language === 'ar' ? 'نشاط الموظفين حسب الإجراء' : 'Staff Activity by Action';

  const chartData = data.map(item => {
      const newItem: {name: string, [key: string]: number | string} = { name: item.name };
      statusOrder.forEach(status => {
          newItem[statusKeyMap[status]] = item.actions[status] || 0;
      });
      return newItem;
  });


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
            {statusOrder.map((status) => (
                 <Bar 
                    key={status} 
                    dataKey={statusKeyMap[status]} 
                    stackId="a" 
                    fill={`var(--color-${statusKeyMap[status]})`} 
                    radius={[0, 4, 4, 0]}
                />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
