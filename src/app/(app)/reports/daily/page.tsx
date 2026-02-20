
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format } from "date-fns";

// Skeleton component for loading state
function DailyReportSkeleton() {
  const { language } = useLanguage();
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

export default function DailyRevenueReportPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    return allOrders.filter(order => {
        if (!order.createdAt) return false;
        // Filter by completed orders for revenue reports
        if (order.status === 'ملغي') return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });
  }, [allOrders, fromDate, toDate]);

  const dailyData = React.useMemo(() => {
    if (!filteredOrders) return [];

    const dailyMap = new Map<string, { totalRevenue: number; totalOrders: number; totalRevenueWithoutShipping: number }>();

    filteredOrders.forEach(order => {
      if (!order.createdAt) return;
      const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
      
      const dayData = dailyMap.get(dateStr) || { totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0 };
      dayData.totalOrders += 1;
      dayData.totalRevenue += order.total;
      dayData.totalRevenueWithoutShipping += order.total - (order.shippingCost || 0);

      dailyMap.set(dateStr, dayData);
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [filteredOrders]);

  const moderatorRevenue = React.useMemo(() => {
     if (!filteredOrders) return [];
     
     const moderatorMap = new Map<string, { name: string, totalRevenue: number, totalOrders: number, totalRevenueWithoutShipping: number }>();

     filteredOrders.forEach(order => {
        if (order.moderatorId && order.moderatorName) {
            const moderator = moderatorMap.get(order.moderatorId) || { name: order.moderatorName, totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0 };
            moderator.totalOrders += 1;
            moderator.totalRevenue += order.total;
            moderator.totalRevenueWithoutShipping += order.total - (order.shippingCost || 0);
            moderatorMap.set(order.moderatorId, moderator);
        }
     });

     return Array.from(moderatorMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders]);

  const chartData = dailyData.map(d => ({ 
    name: format(new Date(d.date), "MMM d"), 
    value: d.totalRevenue 
  })).reverse();
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير الإيراد اليومي' : 'Daily Revenue Report'} />
        <DailyReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير الإيراد اليومي' : 'Daily Revenue Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'إجمالي الإيرادات اليومية' : 'Total Daily Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart 
                data={chartData} 
                barDataKey="revenue"
                barLabel={language === 'ar' ? 'الإيراد' : 'Revenue'}
                formatter={formatCurrency}
            />
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الإيرادات المجمعة' : 'Aggregated Revenue Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'الإيراد (بدون شحن)' : 'Revenue (w/o Ship.)'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{format(new Date(row.date), "PPP")}</TableCell>
                  <TableCell className="text-end">{row.totalOrders}</TableCell>
                  <TableCell className="text-end">{formatCurrency(row.totalRevenue)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(row.totalRevenueWithoutShipping)}</TableCell>
                </TableRow>
              ))}
              {dailyData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص إيرادات الوسطاء' : 'Moderator Revenue Summary'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'تفصيل الإيرادات حسب كل وسيط قام بتسجيل الطلبات في الفترة المحددة' : 'Revenue breakdown by each moderator who created orders in the selected period'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'الإيراد (بدون شحن)' : 'Revenue (w/o Ship.)'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moderatorRevenue.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-end">{row.totalOrders}</TableCell>
                    <TableCell className="text-end">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell className="text-end">{formatCurrency(row.totalRevenueWithoutShipping)}</TableCell>
                  </TableRow>
              ))}
              {moderatorRevenue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
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
