"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const chartTitle = language === 'ar' ? 'إجمالي عمولة الوسطاء' : 'Moderator Total Commissions';

  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP', notation: 'compact', compactDisplay: 'short' }).format(value);
  const fullFormatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  return (
     <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            margin={{ left: isMobile ? -20 : -5, right: isMobile ? 5: 15, top: 5, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="moderator"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
              interval={0}
              angle={isMobile && chartData.length > 3 ? -45 : 0}
              textAnchor={isMobile && chartData.length > 3 ? "end" : "middle"}
              height={isMobile && chartData.length > 3 ? 50 : 30}
            />
            <YAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickMargin={5}
                tickFormatter={formatCurrency}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                formatter={(value) => fullFormatCurrency(Number(value))}
                labelFormatter={(label) => label}
              />}
            />
            <Bar dataKey="totalCommission" fill="var(--color-totalCommission)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
