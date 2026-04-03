
"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
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
    label: "Orders",
    color: "hsl(var(--chart-1))", // Reverted to Blue
  },
};

interface PeakTimeChartProps {
    data: { hour: string; orders: number }[];
}

export function PeakTimeChart({ data: chartData }: PeakTimeChartProps) {
  const { language } = useLanguage();
  const chartTitle = language === 'ar' ? 'وقت الذروة للطلبات' : 'Order Peak Hours';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 25, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={2}
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" labelFormatter={(label) => `${language === 'ar' ? 'الساعة' : 'Hour'} ${label}`} />}
            />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={4}>
                <LabelList 
                    dataKey="orders" 
                    position="top" 
                    style={{ fontSize: '10px', fill: 'currentColor', fontWeight: 'bold' }}
                    offset={10}
                />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
