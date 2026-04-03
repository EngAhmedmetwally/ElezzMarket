
"use client"

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    barDataKey?: string;
    barLabel: string;
    formatter?: (value: number) => string;
    layout?: 'vertical' | 'horizontal';
    className?: string;
}

export function StaffPerformanceChart({ 
    data, 
    barLabel, 
    formatter, 
    layout = 'vertical', 
    className 
}: StaffPerformanceChartProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const valueFormatter = (value: number) => {
    if (formatter) return formatter(value);
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { 
        notation: 'compact', 
        compactDisplay: 'short' 
    }).format(value);
  }

  if (!mounted) {
      return <div className="h-[350px] w-full bg-muted/10 animate-pulse rounded-lg" />;
  }

  if (!data || data.length === 0) {
      return (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground border rounded-lg border-dashed">
              {language === 'ar' ? 'لا توجد بيانات كافية للرسم البياني' : 'No data for chart'}
          </div>
      );
  }

  const isVerticalBars = layout === 'vertical';

  return (
    <div className={cn("w-full bg-card rounded-xl border p-4 shadow-sm", isMobile ? "h-[350px]" : "h-[450px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout={isVerticalBars ? 'horizontal' : 'vertical'}
                margin={{ 
                    top: 20, 
                    right: 30, 
                    left: !isVerticalBars ? (isMobile ? 10 : 20) : 0, 
                    bottom: isVerticalBars ? 20 : 5 
                }}
            >
                <CartesianGrid 
                    horizontal={isVerticalBars} 
                    vertical={!isVerticalBars} 
                    strokeDasharray="3 3" 
                    opacity={0.2} 
                />
                
                {isVerticalBars ? (
                    <>
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            interval={0}
                            angle={isMobile ? -45 : 0}
                            textAnchor={isMobile ? "end" : "middle"}
                            height={isMobile ? 60 : 40}
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={valueFormatter}
                        />
                    </>
                ) : (
                    <>
                        <XAxis 
                            type="number" 
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={valueFormatter}
                        />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            tickLine={false} 
                            axisLine={false} 
                            width={isMobile ? 80 : 120} 
                            tick={{ fontSize: 10, fill: 'currentColor' }} 
                            interval={0}
                        />
                    </>
                )}
                
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                                <div className="bg-card border rounded-lg p-3 shadow-xl text-xs min-w-[120px]">
                                    <p className="font-bold text-primary mb-2 border-b pb-1">{item.name}</p>
                                    <p className="text-muted-foreground flex justify-between gap-4">
                                        <span>{barLabel}:</span>
                                        <span className="font-mono text-foreground font-bold">{valueFormatter(item.value)}</span>
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Bar 
                    dataKey="value" 
                    name={barLabel} 
                    radius={isVerticalBars ? [4, 4, 0, 0] : [0, 4, 4, 0]} 
                    barSize={isMobile ? 15 : 25}
                    fill="hsl(var(--chart-1))"
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--chart-1))" />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
