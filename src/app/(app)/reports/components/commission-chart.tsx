
"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";

const chartConfig = {
  totalCommission: {
    label: "Total Commission",
    color: "hsl(var(--chart-1))", // Reverted to Blue
  },
};

interface CommissionChartProps {
    data: { moderator: string; totalCommission: number }[];
}

export function CommissionChart({ data: chartData }: CommissionChartProps) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const chartTitle = language === 'ar' ? 'إجمالي عمولة الوسطاء' : 'Moderator Total Commissions';

  const shortFormatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
  
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
            margin={{ left: isMobile ? -12 : -5, right: isMobile ? 12 : 15, top: 25, bottom: 5 }}
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
                tickFormatter={shortFormatCurrency}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 12 }}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                formatter={(value) => formatCurrency(Number(value), language)}
                labelFormatter={(label) => label}
              />}
            />
            <Bar dataKey="totalCommission" fill="var(--color-totalCommission)" radius={4}>
                <LabelList 
                    dataKey="totalCommission" 
                    position="top" 
                    formatter={(val: number) => shortFormatCurrency(val)}
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
