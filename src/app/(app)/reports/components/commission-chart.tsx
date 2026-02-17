
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

const chartConfig = {
  totalCommission: {
    label: "Total Commission",
    color: "hsl(var(--chart-1))",
  },
};

interface CommissionChartProps {
    data: { moderator: string; totalCommission: number }[];
}

export function CommissionChart({ data: chartData }: CommissionChartProps) {
  const { language } = useLanguage();
  const chartTitle = language === 'ar' ? 'إجمالي عمولة الوسطاء' : 'Moderator Total Commissions';

  const formattedData = chartData.map(item => ({
      ...item,
      label: language === 'ar' ? `عمولة ${item.moderator}` : `${item.moderator}'s Commission`
  }));
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  return (
     <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={formattedData} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="moderator"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={80}
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <XAxis dataKey="totalCommission" type="number" hide />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label, payload) => payload?.[0]?.payload.moderator}
              />}
            />
            <Bar dataKey="totalCommission" fill="var(--color-totalCommission)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
