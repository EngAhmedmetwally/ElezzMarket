
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format, subDays } from "date-fns";

type PreparationTimeData = {
  date: string;
  avgTimeInMinutes: number;
  orderCount: number;
};

// Skeleton component for loading state
function PreparationReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
      <Skeleton className="h-[350px] w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format minutes into a readable string
function formatDuration(minutes: number, lang: 'ar' | 'en') {
    if (minutes < 1) return lang === 'ar' ? 'أقل من دقيقة' : '< 1 minute';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    let result = '';
    if (hours > 0) {
        result += `${hours} ${lang === 'ar' ? (hours === 1 ? 'ساعة' : 'ساعات') : `hour${hours > 1 ? 's' : ''}`}`;
    }
    if (remainingMinutes > 0) {
        if (result) result += ` ${lang === 'ar' ? 'و' : 'and'} `;
        result += `${remainingMinutes} ${lang === 'ar' ? 'دقيقة' : `minute${remainingMinutes > 1 ? 's' : ''}`}`;
    }
    return result;
}


export default function PreparationTimeReportPage() {
  const { language } = useLanguage();
  // Default to last 7 days
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    subDays(new Date(), 7)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const preparationTimeData: PreparationTimeData[] = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = toDate.getTime() + (24 * 60 * 60 * 1000); // end of day

    const dailyDurations: Map<string, number[]> = new Map();

    allOrders.forEach(order => {
        if (!order.statusHistory) return;

        const historyArray = Object.values(order.statusHistory)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        const processing = historyArray.find(h => h.status === 'قيد التجهيز');
        const shipped = historyArray.find(h => h.status === 'تم الشحن');

        if (processing && shipped) {
            const processingDate = new Date(processing.createdAt);
            const processingTime = processingDate.getTime();
            
            if (processingTime < from || processingTime > to) return;
            
            const shippedDate = new Date(shipped.createdAt);
            
            if (shippedDate >= processingDate) {
                const durationInMs = shippedDate.getTime() - processingDate.getTime();
                const durationInMinutes = durationInMs / (1000 * 60);
                const dateStr = format(processingDate, 'yyyy-MM-dd');
                
                if (!dailyDurations.has(dateStr)) {
                    dailyDurations.set(dateStr, []);
                }
                dailyDurations.get(dateStr)!.push(durationInMinutes);
            }
        }
    });

    return Array.from(dailyDurations.entries()).map(([date, durations]) => {
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = sum / durations.length;
        return {
            date,
            avgTimeInMinutes: avg,
            orderCount: durations.length,
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allOrders, fromDate, toDate]);

  const chartData = preparationTimeData.map(d => ({ 
    name: format(new Date(d.date), "MMM d"), 
    value: d.avgTimeInMinutes 
  })).reverse();

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير متوسط وقت التجهيز' : 'Average Preparation Time Report'} />
        <PreparationReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير متوسط وقت التجهيز' : 'Average Preparation Time Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'متوسط وقت التجهيز اليومي (بالدقائق)' : 'Daily Average Preparation Time (in Minutes)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffPerformanceChart 
            data={chartData} 
            barDataKey="prep_time"
            barLabel={language === 'ar' ? 'دقائق' : 'Minutes'}
            formatter={(value) => `${Math.round(value)} ${language === 'ar' ? 'دقيقة' : 'min'}`}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص وقت التجهيز' : 'Preparation Time Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'متوسط وقت التجهيز' : 'Average Prep Time'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'عدد الطلبات' : 'Orders Count'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preparationTimeData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{format(new Date(row.date), "PPP")}</TableCell>
                  <TableCell className="text-end">{formatDuration(row.avgTimeInMinutes, language)}</TableCell>
                  <TableCell className="text-end">{row.orderCount}</TableCell>
                </TableRow>
              ))}
              {preparationTimeData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
