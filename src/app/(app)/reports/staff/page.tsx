
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User, OrderStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffActivityChart } from "../components/staff-activity-chart";


function StaffReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-[350px] w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
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
  )
}

export default function StaffReportPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const staffActivityReport = React.useMemo(() => {
    if (!usersData || !allOrders) return [];
    
    const staffActivity = new Map<string, {
        id: string;
        name: string;
        avatarUrl: string;
        role: string;
        actions: { [key in OrderStatus | string]: number };
        total: number;
    }>();

    // Initialize map with all users
    usersData.forEach(user => {
        staffActivity.set(user.id, {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            actions: {
                "تم التسجيل": 0,
                "قيد التجهيز": 0,
                "تم الشحن": 0,
                "مكتمل": 0,
                "ملغي": 0,
            },
            total: 0
        });
    });

    const from = fromDate ? fromDate.getTime() : 0;
    const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

    // Process status history from all orders
    allOrders.forEach(order => {
        if (order.statusHistory) {
            const historyItems = Object.values(order.statusHistory);
            historyItems.forEach(item => {
                // Ensure the history item is within the date range
                const itemDate = new Date(item.createdAt).getTime();

                if (item.userId && staffActivity.has(item.userId) && itemDate >= from && itemDate <= to) {
                    const userActivity = staffActivity.get(item.userId)!;
                    if (item.status in userActivity.actions) {
                        userActivity.actions[item.status]++;
                        userActivity.total++;
                    }
                }
            });
        }
    });

    return Array.from(staffActivity.values())
        .filter(user => user.total > 0)
        .sort((a, b) => b.total - a.total);
  }, [usersData, allOrders, fromDate, toDate]);
  
  const chartData = staffActivityReport.map(m => ({ name: m.name, actions: m.actions }));

  const isLoading = isLoadingOrders || isLoadingUsers;

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
        <StaffReportSkeleton />
      </div>
    )
  }

  const orderStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
      
      <div className="flex items-center gap-4 mb-8">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="space-y-8">
        <StaffActivityChart data={chartData} />
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقرير نشاط الموظفين' : 'Staff Activity Report'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص الإجراءات التي قام بها كل موظف على الطلبات' : 'Summary of actions performed by each staff member on orders'}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {staffActivityReport.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-start">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                        {orderStatuses.map(status => (
                            <TableHead key={status} className="text-center">{status}</TableHead>
                        ))}
                        <TableHead className="text-center">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {staffActivityReport.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium text-start">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                            </div>
                        </TableCell>
                        {orderStatuses.map(status => (
                            <TableCell key={status} className="text-center">{user.actions[status] || 0}</TableCell>
                        ))}
                        <TableCell className="text-center font-bold">{user.total}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                    {language === 'ar' ? 'لا توجد بيانات للعرض في الفترة المحددة.' : 'No data to display for the selected period.'}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
