
"use client"

import * as React from "react";
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
import { format } from "date-fns";
import type { ProductOrder } from "../[productName]/page";

const chartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--chart-1))", // Reverted to Blue
  },
};

interface DailyProductChartProps {
    data: ProductOrder[];
    productName: string;
}

export function DailyProductChart({ data: productOrders, productName }: DailyProductChartProps) {
  const { language } = useLanguage();
  const chartTitle = `${language === 'ar' ? 'المبيعات اليومية لـ' : 'Daily Sales for'} ${productName}`;

  const dailyData = React.useMemo(() => {
    const salesMap = new Map<string, number>();

    productOrders.forEach(order => {
        const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
        const currentQuantity = salesMap.get(dateStr) || 0;
        salesMap.set(dateStr, currentQuantity + order.quantity);
    });

    return Array.from(salesMap.entries())
        .map(([date, quantity]) => ({
            name: format(new Date(date), "MMM d"),
            value: quantity
        }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  }, [productOrders]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={dailyData} margin={{ top: 40, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                labelFormatter={(label) => label}
                formatter={(value) => `${value} ${language === 'ar' ? 'وحدة' : 'units'}`}
                />}
            />
            <Bar dataKey="value" fill="var(--color-quantity)" radius={4} name={language === 'ar' ? 'الكمية' : 'Quantity'}>
                <LabelList 
                    dataKey="name" 
                    position="top" 
                    offset={25}
                    style={{ fontSize: '9px', fill: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <LabelList 
                    dataKey="value" 
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
