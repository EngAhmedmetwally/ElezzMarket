
"use client"

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

interface StaffPerformanceChartProps {
    data: { name: string; value: number }[];
    barDataKey?: string;
    barLabel: string;
    formatter?: (value: number) => string;
    layout?: 'vertical' | 'horizontal'; // 'vertical' for columns (dates), 'horizontal' for bars (names)
    className?: string;
}

export function StaffPerformanceChart({ 
    data, 
    barLabel, 
    formatter, 
    layout = 'horizontal', 
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

  // If layout is 'vertical', we want columns (standard for dates)
  // If layout is 'horizontal', we want bars (standard for long names)
  const isBars = layout === 'horizontal';

  return (
    <div className={cn("w-full bg-card rounded-xl border p-4 shadow-sm", isMobile ? "h-[350px]" : "h-[450px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout={isBars ? 'vertical' : 'horizontal'}
                margin={{ 
                    top: 30, 
                    right: 40, 
                    left: isBars ? (isMobile ? 10 : 20) : 0, 
                    bottom: isBars ? 5 : 20 
                }}
            >
                <CartesianGrid 
                    horizontal={!isBars} 
                    vertical={isBars} 
                    strokeDasharray="3 3" 
                    opacity={0.2} 
                />
                
                {isBars ? (
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
                ) : (
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
                )}
                
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    contentStyle={{ 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        textAlign: language === 'ar' ? 'right' : 'left'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'hsl(var(--primary))', marginBottom: '4px' }}
                    formatter={(value) => [valueFormatter(Number(value)), barLabel]}
                />
                <Bar 
                    dataKey="value" 
                    name={barLabel} 
                    radius={isBars ? [0, 4, 4, 0] : [4, 4, 0, 0]} 
                    barSize={isMobile ? 20 : 35}
                    fill="hsl(var(--chart-1))"
                >
                    <LabelList 
                        dataKey="value" 
                        position={isBars ? "right" : "top"} 
                        formatter={valueFormatter}
                        style={{ fontSize: '10px', fill: 'currentColor', fontWeight: 'bold' }}
                        offset={10}
                    />
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(var(--chart-1))" />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}
