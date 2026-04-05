"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User, Commission, OrderStatus, Adjustment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { formatCurrency } from "@/lib/utils";
import { StaffActivityChart } from "../components/staff-activity-chart";
import { subDays } from "date-fns";

const statusOrder: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "معلق", "مكتمل", "ملغي"];

function StaffReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Skeleton className="h-[450px] w-full" />
        <Skeleton className="h-[450px] w-full" />
      </div>
    </div>
  )
}

export default function StaffReportPage() {
  const { language } = useLanguage();
  
  // Default to last 7 days
  const [fromDate, setFromDate] = React.useState<Date | undefined>(subDays(new Date(), 7));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
  const { data: commissionsData, isLoading: isLoadingCommissions } = useRealtimeCachedCollection<Commission>('commissions');
  const { data: adjustmentsData, isLoading: isLoadingAdjustments } = useRealtimeCachedCollection<Adjustment>('adjustments');
  
  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    return allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });
  }, [allOrders, fromDate, toDate]);

  const topModeratorsByOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    const moderatorStats = new Map<string, { name: string; count: number }>();
    filteredOrders.forEach(order => {
      if (order.moderatorId && order.moderatorName) {
        const stats = moderatorStats.get(order.moderatorId) || { name: order.moderatorName, count: 0 };
        stats.count++;
        moderatorStats.set(order.moderatorId, stats);
      }
    });
    return Array.from(moderatorStats.values())
        .map(mod => ({ name: mod.name, value: mod.count }))
        .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  const topEarners = React.useMemo(() => {
     if (!usersData || !fromDate || !toDate) return [];
     const from = fromDate.getTime();
     const to = new Date(toDate).setHours(23, 59, 59, 999);
     
     const commissionSums = (commissionsData || []).filter(c => {
         if (!c.calculationDate) return false;
         const cDate = new Date(c.calculationDate).getTime();
         return cDate >= from && cDate <= to;
     }).reduce((acc, c) => {
         acc[c.userId] = (acc[c.userId] || 0) + c.amount;
         return acc;
     }, {} as Record<string, number>);

     const adjustmentSums = (adjustmentsData || []).filter(a => {
         const aDate = new Date(a.date).getTime();
         return aDate >= from && aDate <= to;
     }).reduce((acc, a) => {
         const value = a.type === 'bonus' ? a.amount : -a.amount;
         acc[a.userId] = (acc[a.userId] || 0) + value;
         return acc;
     }, {} as Record<string, number>);

     const allUserIds = new Set([
         ...Object.keys(commissionSums),
         ...Object.keys(adjustmentSums),
         ...usersData.map(u => u.id)
     ]);

     const userMap = new Map(usersData.map(u => [u.id, u]));

     return Array.from(allUserIds)
        .map(userId => {
            const user = userMap.get(userId);
            const name = user?.name || (userId === 'emergency-admin' ? 'Emergency Admin' : 'Unknown User');
            const comm = commissionSums[userId] || 0;
            const adj = adjustmentSums[userId] || 0;
            return { 
                name, 
                value: comm + adj,
                commissions: comm,
                adjustments: adj
            };
        })
        .filter(u => u.value !== 0 || u.commissions !== 0 || u.adjustments !== 0)
        .sort((a, b) => b.value - a.value);
  }, [usersData, commissionsData, adjustmentsData, fromDate, toDate]);
  
   const staffActivity = React.useMemo(() => {
    if (!filteredOrders || !usersData) return [];

    const activityMap = new Map<string, { name: string, actions: Record<OrderStatus, number> }>();

    usersData.forEach(user => {
      activityMap.set(user.id, {
        name: user.name,
        actions: statusOrder.reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<OrderStatus, number>)
      });
    });

    filteredOrders.forEach(order => {
      if (order.statusHistory) {
        Object.values(order.statusHistory).forEach(historyItem => {
          if (activityMap.has(historyItem.userId)) {
            const userActivity = activityMap.get(historyItem.userId)!;
            userActivity.actions[historyItem.status]++;
          }
        });
      }
    });

    return Array.from(activityMap.values())
        .filter(user => Object.values(user.actions).some(count => count > 0));

  }, [filteredOrders, usersData]);


  const isLoading = isLoadingOrders || isLoadingUsers || isLoadingCommissions || isLoadingAdjustments;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title={language === 'ar' ? 'تقرير أداء الموظفين' : 'Staff Performance Report'} />
        <StaffReportSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      <PageHeader title={language === 'ar' ? 'تقرير أداء الموظفين' : 'Staff Performance Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        </div>
        <div className="flex-1 w-full">
          <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        </div>
      </div>

       <div className="overflow-hidden">
          <StaffActivityChart data={staffActivity} />
       </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="min-w-0">
              <CardHeader>
                  <CardTitle>{language === 'ar' ? 'أفضل الوسطاء' : 'Top Moderators'}</CardTitle>
                  <CardDescription>{language === 'ar' ? '(حسب عدد الطلبات)' : '(by Orders)'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <StaffPerformanceChart 
                      data={topModeratorsByOrders} 
                      barLabel={language === 'ar' ? 'طلبات' : 'Orders'}
                      layout="columns"
                  />
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-start">{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'عدد الطلبات' : 'Count'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topModeratorsByOrders.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="text-start font-medium">{item.name}</TableCell>
                                    <TableCell className="text-end">{item.value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                  <CardTitle>{language === 'ar' ? 'صافي الأرباح' : 'Net Earnings'}</CardTitle>
                  <CardDescription>{language === 'ar' ? '(عمولات + مكافآت - خصومات)' : '(Net Pay)'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <StaffPerformanceChart 
                      data={topEarners} 
                      barLabel={language === 'ar' ? 'صافي الربح' : 'Net Profit'}
                      formatter={(val) => formatCurrency(val, language)}
                      layout="columns"
                  />
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-start">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'العمولات' : 'Comm.'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'التسويات' : 'Adj.'}</TableHead>
                                <TableHead className="text-end font-bold">{language === 'ar' ? 'إجمالي الدخل' : 'Net Income'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topEarners.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="text-start font-medium">{item.name}</TableCell>
                                    <TableCell className="text-end">{formatCurrency(item.commissions, language)}</TableCell>
                                    <TableCell className="text-end">{formatCurrency(item.adjustments, language)}</TableCell>
                                    <TableCell className="text-end font-bold text-primary">{formatCurrency(item.value, language)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
