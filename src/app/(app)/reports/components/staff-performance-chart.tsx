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
    layout?: 'columns' | 'bars'; // 'columns' = Vertical Bars, 'bars' = Horizontal Bars
    className?: string;
}

export function StaffPerformanceChart({ 
    data, 
    barLabel, 
    formatter, 
    layout = 'columns', 
    className 
}: StaffPerformanceChartProps) {
  const isMobile = useIsMobile();
  const { language, isRTL } = useLanguage();
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

  const truncateName = (name: string, limit: number = 15) => {
    if (!name) return "";
    return name.length > limit ? name.substring(0, limit) + "..." : name;
  };

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

  const isColumns = layout === 'columns';

  return (
    <div className={cn("w-full bg-card rounded-xl border p-4 shadow-sm", isMobile ? "h-[350px]" : "h-[450px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout={isColumns ? 'horizontal' : 'vertical'}
                margin={{ 
                    top: 20, 
                    right: isColumns ? 20 : 40, 
                    left: isColumns ? 0 : (isMobile ? 10 : 20), 
                    bottom: isColumns ? 60 : 20 
                }}
            >
                <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={!isColumns} 
                    horizontal={isColumns} 
                    opacity={0.2} 
                />
                
                {isColumns ? (
                    <>
                        <XAxis 
                            dataKey="name" 
                            interval={0}
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tickFormatter={(val) => truncateName(val, isMobile ? 10 : 20)}
                        />
                        <YAxis 
                            orientation={isRTL ? "right" : "left"}
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
                            orientation={isRTL ? "right" : "left"}
                            width={isMobile ? 80 : 150}
                            tick={{ fontSize: 10, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tickFormatter={(val) => truncateName(val, isMobile ? 12 : 25)}
                        />
                    </>
                )}
                
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                                <div className="bg-card border rounded-lg p-3 shadow-xl text-xs min-w-[150px]">
                                    <p className="font-bold text-primary mb-1 break-words">{item.name}</p>
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
                    fill="hsl(var(--primary))" 
                    radius={isColumns ? [4, 4, 0, 0] : [0, 4, 4, 0]}
                    barSize={isMobile ? 25 : 40}
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 6) + 1}))`} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
