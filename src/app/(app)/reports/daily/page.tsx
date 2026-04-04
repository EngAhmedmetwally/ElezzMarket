
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User, PaymentMethod } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format, subDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const paymentMethods: PaymentMethod[] = ["نقدي عند الاستلام", "انستا باى", "فودافون كاش", "اورانج كاش"];

function DailyReportSkeleton() {
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

export default function DailyRevenueReportPage() {
  const { language } = useLanguage();
  
  // Default to last 7 days
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    subDays(new Date(), 7)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(
    new Date()
  );
  
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
  const isLoading = isLoadingOrders || isLoadingUsers;

  const { revenueOrders, onHoldOrdersInRange } = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return { revenueOrders: [], onHoldOrdersInRange: [] };
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);

    const revenue: Order[] = [];
    const onHold: Order[] = [];

    for (const order of allOrders) {
      if (!order.createdAt) continue;
      const orderDate = new Date(order.createdAt).getTime();
      if (orderDate >= from && orderDate <= to) {
        if (order.status === 'معلق') {
          onHold.push(order);
        } else if (order.status !== 'ملغي') {
          revenue.push(order);
        }
      }
    }
    return { revenueOrders: revenue, onHoldOrdersInRange: onHold };
  }, [allOrders, fromDate, toDate]);

  const dailyData = React.useMemo(() => {
    const dailyMap = new Map<string, { totalRevenue: number; totalOrders: number; totalRevenueWithoutShipping: number; totalOnHoldValue: number; onHoldOrdersCount: number }>();

    revenueOrders.forEach(order => {
      if (!order.createdAt) return;
      const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
      
      const dayData = dailyMap.get(dateStr) || { totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0, totalOnHoldValue: 0, onHoldOrdersCount: 0 };
      dayData.totalOrders += 1;
      dayData.totalRevenue += Number(order.total) || 0;
      dayData.totalRevenueWithoutShipping += (Number(order.total) || 0) - (Number(order.shippingCost) || 0);
      dailyMap.set(dateStr, dayData);
    });
    
    onHoldOrdersInRange.forEach(order => {
        if (!order.createdAt) return;
        const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
        
        const dayData = dailyMap.get(dateStr) || { totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0, totalOnHoldValue: 0, onHoldOrdersCount: 0 };
        dayData.onHoldOrdersCount += 1;
        dayData.totalOnHoldValue += Number(order.total) || 0;
        dailyMap.set(dateStr, dayData);
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  }, [revenueOrders, onHoldOrdersInRange]);
  
  const dailyDataByPayment = React.useMemo(() => {
    const dailyMap = new Map<string, { [key in PaymentMethod]?: number } & { totalRevenue: number }>();
    
    revenueOrders.forEach(order => {
        if (!order.createdAt || !order.paymentMethod) return;
        const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
        
        const dayData = dailyMap.get(dateStr) || { totalRevenue: 0 };
        
        const amount = Number(order.total) || 0;
        dayData.totalRevenue += amount;
        
        const method = order.paymentMethod as PaymentMethod;
        const currentPaymentTotal = dayData[method] || 0;
        dayData[method] = currentPaymentTotal + amount;
        
        dailyMap.set(dateStr, dayData);
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [revenueOrders]);


  const moderatorRevenue = React.useMemo(() => {
     if (!usersData) return [];
     
     const moderatorMap = new Map<string, { name: string, totalRevenue: number, totalOrders: number, totalRevenueWithoutShipping: number, totalOnHoldValue: number, onHoldOrdersCount: number }>();
     
     usersData.forEach(user => {
         if (user.role === 'Moderator' || user.role === 'Admin') {
            moderatorMap.set(user.id, { name: user.name, totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0, totalOnHoldValue: 0, onHoldOrdersCount: 0 });
         }
     });

     revenueOrders.forEach(order => {
        if (order.moderatorId) {
            if (!moderatorMap.has(order.moderatorId)) {
                moderatorMap.set(order.moderatorId, { name: order.moderatorName || 'Unknown', totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0, totalOnHoldValue: 0, onHoldOrdersCount: 0 });
            }
            const moderator = moderatorMap.get(order.moderatorId)!;
            moderator.totalOrders += 1;
            moderator.totalRevenue += Number(order.total) || 0;
            moderator.totalRevenueWithoutShipping += (Number(order.total) || 0) - (Number(order.shippingCost) || 0);
        }
     });
     
    onHoldOrdersInRange.forEach(order => {
        if (order.moderatorId) {
            if (!moderatorMap.has(order.moderatorId)) {
                moderatorMap.set(order.moderatorId, { name: order.moderatorName || 'Unknown', totalRevenue: 0, totalOrders: 0, totalRevenueWithoutShipping: 0, totalOnHoldValue: 0, onHoldOrdersCount: 0 });
            }
            const moderator = moderatorMap.get(order.moderatorId)!;
            moderator.onHoldOrdersCount += 1;
            moderator.totalOnHoldValue += Number(order.total) || 0;
        }
    });

     return Array.from(moderatorMap.values())
        .filter(data => data.totalOrders > 0 || data.onHoldOrdersCount > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [revenueOrders, onHoldOrdersInRange, usersData]);

  const chartData = React.useMemo(() => {
    return dailyData.map(d => ({ 
        name: format(new Date(d.date), "MMM d"), 
        value: d.totalRevenue 
    }));
  }, [dailyData]);
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title={language === 'ar' ? 'تقرير الإيراد اليومي' : 'Daily Revenue Report'} />
        <DailyReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      <PageHeader title={language === 'ar' ? 'تقرير الإيراد اليومي' : 'Daily Revenue Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        </div>
        <div className="flex-1 w-full">
          <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        </div>
      </div>
      
      <Card className="min-w-0">
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'إجمالي الإيرادات اليومية' : 'Total Daily Revenue'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'يوضح الرسم البياني مجموع مبيعات كل يوم بالجنيه' : 'Chart showing sum of sales per day in EGP'}</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart 
                data={chartData} 
                barLabel={language === 'ar' ? 'الإيراد' : 'Revenue'}
                formatter={(value) => formatCurrency(value, language)}
                layout="vertical"
            />
          </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الإيرادات والطلبات المعلقة' : 'Revenue & On-Hold Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="text-start whitespace-nowrap">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead className="text-end whitespace-nowrap">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</TableHead>
                    <TableHead className="text-end whitespace-nowrap">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableHead>
                    <TableHead className="text-end whitespace-nowrap">{language === 'ar' ? 'الإيراد (بدون شحن)' : 'Revenue (w/o Ship.)'}</TableHead>
                    <TableHead className="text-end text-purple-600 whitespace-nowrap">{language === 'ar' ? 'عدد المعلق' : 'On-Hold Count'}</TableHead>
                    <TableHead className="text-end text-purple-600 whitespace-nowrap">{language === 'ar' ? 'قيمة المعلق' : 'On-Hold Value'}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {dailyData.map((row) => (
                    <TableRow key={row.date}>
                    <TableCell className="font-medium text-start whitespace-nowrap">{format(new Date(row.date), "PPP")}</TableCell>
                    <TableCell className="text-end">{row.totalOrders}</TableCell>
                    <TableCell className="text-end font-bold">{formatCurrency(row.totalRevenue, language)}</TableCell>
                    <TableCell className="text-end">{formatCurrency(row.totalRevenueWithoutShipping, language)}</TableCell>
                    <TableCell className="text-end text-purple-600 font-medium">{row.onHoldOrdersCount}</TableCell>
                    <TableCell className="text-end text-purple-600">{formatCurrency(row.totalOnHoldValue, language)}</TableCell>
                    </TableRow>
                ))}
                {dailyData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            {language === 'ar' ? 'لا توجد بيانات للفترة المختارة' : 'No data for selected period'}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إيرادات الوسطاء والمسؤولين' : 'Moderator Revenue Breakdown'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="text-start whitespace-nowrap">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                    <TableHead className="text-end whitespace-nowrap">{language === 'ar' ? 'الطلبات' : 'Orders'}</TableHead>
                    <TableHead className="text-end whitespace-nowrap">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</TableHead>
                    <TableHead className="text-end text-purple-600 whitespace-nowrap">{language === 'ar' ? 'المعلق' : 'On-Hold'}</TableHead>
                    <TableHead className="text-end text-purple-600 whitespace-nowrap">{language === 'ar' ? 'قيمة المعلق' : 'On-Hold Value'}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {moderatorRevenue.map((row) => (
                    <TableRow key={row.name}>
                        <TableCell className="font-medium text-start whitespace-nowrap">{row.name}</TableCell>
                        <TableCell className="text-end">{row.totalOrders}</TableCell>
                        <TableCell className="text-end font-bold text-primary">{formatCurrency(row.totalRevenue, language)}</TableCell>
                        <TableCell className="text-end text-purple-600">{row.onHoldOrdersCount}</TableCell>
                        <TableCell className="text-end text-purple-600">{formatCurrency(row.totalOnHoldValue, language)}</TableCell>
                    </TableRow>
                ))}
                {moderatorRevenue.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            {language === 'ar' ? 'لا توجد بيانات للفترة المختارة' : 'No data for selected period'}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
