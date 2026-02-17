
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    title: string;
    barDataKey: string;
    barLabel: string;
    formatter?: (value: number) => string;
}

export function StaffPerformanceChart({ data, title, barDataKey, barLabel, formatter }: StaffPerformanceChartProps) {

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
          <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            <YAxis />
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
