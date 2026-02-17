
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    title: string;
    barDataKey: string;
    barLabel: string;
    formatter?: (value: number) => string;
}

export function StaffPerformanceChart({ data, title, barDataKey, barLabel, formatter }: StaffPerformanceChartProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  const chartConfig = {
    [barDataKey]: {
      label: barLabel,
      color: "hsl(var(--chart-1))",
    },
  };
  
  const yAxisFormatter = (value: number) => {
    if (formatter && formatter(value).includes('%')) return formatter(value);
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart 
            accessibilityLayer 
            data={data} 
            margin={{ top: 20, right: isMobile ? 10 : 20, left: isMobile ? -12 : -10, bottom: isMobile ? 10 : 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              angle={isMobile && data.length > 4 ? -45 : 0}
              textAnchor={isMobile && data.length > 4 ? "end" : "middle"}
              height={isMobile && data.length > 4 ? 60 : 30}
              interval={0}
            />
            <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisFormatter}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                formatter={formatter ? (value) => formatter(Number(value)) : undefined}
                />}
            />
            <Bar dataKey="value" name={barLabel} fill={`var(--color-${barDataKey})`} radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
