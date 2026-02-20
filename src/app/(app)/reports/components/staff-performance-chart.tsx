"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    barDataKey: string;
    barLabel: string;
    formatter?: (value: number) => string;
    layout?: 'vertical' | 'horizontal'; // vertical = vertical bars, horizontal = horizontal bars
    className?: string;
}

export function StaffPerformanceChart({ data, barDataKey, barLabel, formatter, layout = 'vertical', className }: StaffPerformanceChartProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const isHorizontalLayout = layout === 'horizontal';

  const chartConfig = {
    [barDataKey]: {
      label: barLabel,
      color: "hsl(var(--chart-1))",
    },
  };
  
  const valueFormatter = (value: number) => {
    if (formatter) {
      if (formatter(value).includes('%')) return formatter(value);
    }
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value);
  }

  const tooltipValueFormatter = (value: number) => {
    if (formatter) {
      return formatter(value);
    }
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(value);
  }

  return (
    <ChartContainer config={chartConfig} className={cn("h-[300px] w-full", className)}>
        <BarChart 
        accessibilityLayer 
        data={data} 
        layout={isHorizontalLayout ? 'vertical' : 'horizontal'}
        margin={ isHorizontalLayout 
            ? { top: 5, right: 20, left: isMobile ? 5 : 20, bottom: 0 }
            : { top: 20, right: isMobile ? 10 : 20, left: isMobile ? -12 : -10, bottom: isMobile ? 10 : 0 }
        }
        >
        <CartesianGrid horizontal={isHorizontalLayout} vertical={!isHorizontalLayout} />
        
        {isHorizontalLayout ? (
            <>
                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={valueFormatter} tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={5} axisLine={false} width={isMobile ? 80 : 120} tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--foreground))' }} interval={0} />
            </>
        ) : (
            <>
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--foreground))' }}
                    angle={isMobile && data.length > 4 ? -45 : 0}
                    textAnchor={isMobile && data.length > 4 ? "end" : "middle"}
                    height={isMobile && data.length > 4 ? 60 : 30}
                    interval={0}
                />
                <YAxis 
                    tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={valueFormatter}
                />
            </>
        )}
        
        <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            content={<ChartTooltipContent 
            indicator="dot" 
            formatter={(value) => tooltipValueFormatter(Number(value))}
            />}
        />
        <Bar dataKey="value" name={barLabel} fill={`var(--color-${barDataKey})`} radius={isHorizontalLayout ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
        </BarChart>
    </ChartContainer>
  );
}
