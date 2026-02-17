
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    title: string;
    barDataKey: string;
    barLabel: string;
    formatter?: (value: number) => string;
}

export function StaffPerformanceChart({ data, title, barDataKey, barLabel, formatter }: StaffPerformanceChartProps) {
  const isMobile = useIsMobile();

  const chartConfig = {
    [barDataKey]: {
      label: barLabel,
      color: "hsl(var(--chart-1))",
    },
  };

  return (
     <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: isMobile ? -20 : -10, bottom: isMobile ? 20 : 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 12 }}
              {...(isMobile && data.length > 5 && { // Only rotate if labels might overlap
                angle: -45,
                textAnchor: 'end',
                height: 50,
                interval: 0,
              })}
            />
            <YAxis tick={{ fontSize: 12 }} />
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
