"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User, OrderStatus, Commission } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffActivityChart } from "../components/staff-activity-chart";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
        <Skeleton className="h-[450px] w-full" />
        <Skeleton className="h-[450px] w-full" />
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
  const isMobile = useIsMobile();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
  const { data: commissionsData, isLoading: isLoadingCommissions } = useRealtimeCachedCollection<Commission>('commissions');
  
  const staffActivityReport = React.useMemo(() => {
    if (!usersData || !allOrders || !fromDate || !toDate) return [];
    
    const usersMap = new Map(usersData.map(u => [u.id, u]));
    const staffActivity = new Map<string, {
        id: string;
        name: string;
        avatarUrl: string;
        role: string;
        actions: { [key in OrderStatus]: number };
        total: number;
    }>();

    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);

    for (const order of allOrders) {
        if (!order.statusHistory) continue;

        for (const historyKey in order.statusHistory) {
            const historyItem = order.statusHistory[historyKey];
            if (!historyItem.userId || !historyItem.createdAt) continue;

            const historyDate = new Date(historyItem.createdAt).getTime();
            if (historyDate < from || historyDate > to) continue;
            
            const user = usersMap.get(historyItem.userId);

            if (user) {
                let userActivity = staffActivity.get(historyItem.userId);
                if (!userActivity) {
                    userActivity = {
                        id: user.id,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        role: user.role,
                        actions: { "تم التسجيل": 0, "قيد التجهيز": 0, "تم الشحن": 0, "مكتمل": 0, "ملغي": 0 },
                        total: 0
                    };
                    staffActivity.set(user.id, userActivity);
                }

                if (historyItem.status in userActivity.actions) {
                    userActivity.actions[historyItem.status]++;
                    userActivity.total++;
                }
            }
        }
    }

    return Array.from(staffActivity.values())
        .filter(user => user.total > 0)
        .sort((a, b) => b.total - a.total);
  }, [usersData, allOrders, fromDate, toDate]);
  
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

  const topCouriersByDeliveries = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const courierStats = new Map<string, { name: string; count: number }>();
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    allOrders.forEach(order => {
      if (order.status !== 'مكتمل' || !order.courierId || !order.courierName) return;
      const history = Object.values(order.statusHistory || {});
      const completedEvent = history.find(h => h.status === 'مكتمل');
      if (completedEvent && completedEvent.createdAt) {
          const completedDate = new Date(completedEvent.createdAt).getTime();
          if(completedDate >= from && completedDate <= to) {
            const stats = courierStats.get(order.courierId) || { name: order.courierName, count: 0 };
            stats.count++;
            courierStats.set(order.courierId, stats);
          }
      }
    });
    return Array.from(courierStats.values())
        .map(courier => ({ name: courier.name, value: courier.count }))
        .sort((a, b) => b.value - a.value);
  }, [allOrders, fromDate, toDate]);

  const fastestCouriers = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    const deliveryTimes = new Map<string, { name: string; times: number[] }>();
    allOrders.forEach(order => {
        if (order.status !== 'مكتمل' || !order.courierId || !order.courierName || !order.statusHistory) return;
        const history = Object.values(order.statusHistory);
        const shippedEvent = history.find(h => h.status === 'تم الشحن');
        const completedEvent = history.find(h => h.status === 'مكتمل');
        if (shippedEvent && completedEvent && shippedEvent.createdAt && completedEvent.createdAt) {
            const completedTime = new Date(completedEvent.createdAt).getTime();
            if (completedTime < from || completedTime > to) return;
            const shippedTime = new Date(shippedEvent.createdAt).getTime();
            const durationMinutes = (completedTime - shippedTime) / (1000 * 60);
            if (durationMinutes >= 0) {
                const courierData = deliveryTimes.get(order.courierId) || { name: order.courierName, times: [] };
                courierData.times.push(durationMinutes);
                deliveryTimes.set(order.courierId, courierData);
            }
        }
    });
    const avgDeliveryTimes: { name: string; value: number }[] = [];
    deliveryTimes.forEach((data) => {
        if (data.times.length > 0) {
            const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
            avgDeliveryTimes.push({ name: data.name, value: avg });
        }
    });
    return avgDeliveryTimes.sort((a, b) => a.value - b.value);
  }, [allOrders, fromDate, toDate]);

  const topEarners = React.useMemo(() => {
     if (!usersData || !commissionsData || !fromDate || !toDate) return [];
     const from = fromDate.getTime();
     const to = new Date(toDate).setHours(23, 59, 59, 999);
     const filteredCommissions = commissionsData.filter(c => {
         if (!c.calculationDate) return false;
         const commissionDate = new Date(c.calculationDate).getTime();
         return commissionDate >= from && commissionDate <= to;
     });
     const commissionSums = filteredCommissions.reduce((acc, commission) => {
         acc[commission.userId] = (acc[commission.userId] || 0) + commission.amount;
         return acc;
     }, {} as Record<string, number>);
     return usersData
        .map(user => ({ name: user.name, value: commissionSums[user.id] || 0}))
        .filter(u => u.value > 0)
        .sort((a, b) => b.value - a.value);
  }, [usersData, commissionsData, fromDate, toDate]);
  
  const activityChartData = staffActivityReport.map(m => ({ name: m.name, actions: m.actions }));
  const isLoading = isLoadingOrders || isLoadingUsers || isLoadingCommissions;

  const orderStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} ${language === 'ar' ? 'دقيقة' : 'min'}`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} ${language === 'ar' ? 'س' : 'h'} ${mins} ${language === 'ar' ? 'د' : 'm'}`;
  }

  const performanceCards = [
    {
      id: "moderators",
      title: language === 'ar' ? 'أفضل الوسطاء' : 'Top Moderators',
      description: language === 'ar' ? '(حسب عدد الطلبات)' : '(by Orders)',
      chartData: topModeratorsByOrders,
      barDataKey: "orders",
      barLabel: language === 'ar' ? 'طلبات' : 'Orders',
      tableHeaders: [language === 'ar' ? 'الوسيط' : 'Moderator', language === 'ar' ? 'عدد الطلبات' : 'Orders Count'],
      tableData: topModeratorsByOrders,
      formatter: (value: number) => value.toString(),
    },
    {
      id: "couriers",
      title: language === 'ar' ? 'أفضل المناديب' : 'Top Couriers',
      description: language === 'ar' ? '(حسب عدد التسليمات)' : '(by Deliveries)',
      chartData: topCouriersByDeliveries,
      barDataKey: "deliveries",
      barLabel: language === 'ar' ? 'تسليمات' : 'Deliveries',
      tableHeaders: [language === 'ar' ? 'المندوب' : 'Courier', language === 'ar' ? 'عدد التسليمات' : 'Deliveries'],
      tableData: topCouriersByDeliveries,
      formatter: (value: number) => value.toString(),
    },
    {
      id: "fastest_couriers",
      title: language === 'ar' ? 'أسرع المناديب' : 'Fastest Couriers',
      description: language === 'ar' ? '(متوسط وقت التسليم)' : '(Avg. Delivery Time)',
      chartData: fastestCouriers,
      barDataKey: "avg_time",
      barLabel: language === 'ar' ? 'متوسط الوقت' : 'Avg. Time',
      tableHeaders: [language === 'ar' ? 'المندوب' : 'Courier', language === 'ar' ? 'متوسط الوقت' : 'Average Time'],
      tableData: fastestCouriers,
      formatter: formatMinutes,
    },
    {
      id: "top_earners",
      title: language === 'ar' ? 'الأكثر ربحًا' : 'Top Earners',
      description: language === 'ar' ? '(حسب العمولة)' : '(by Commission)',
      chartData: topEarners,
      barDataKey: "commission",
      barLabel: language === 'ar' ? 'العمولة' : 'Commission',
      tableHeaders: [language === 'ar' ? 'الموظف' : 'Staff', language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'],
      tableData: topEarners,
      formatter: formatCurrency,
    }
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير أداء الموظفين' : 'Staff Performance Report'} />
        <StaffReportSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير أداء الموظفين' : 'Staff Performance Report'} />
      
      <div className="flex items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      {isMobile ? (
        <Tabs defaultValue="moderators" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            {performanceCards.map(card => (
              <TabsTrigger key={card.id} value={card.id} className="whitespace-normal h-full flex flex-col p-2">
                <span>{card.title}</span>
                <span className="text-xs text-muted-foreground">{card.description}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {performanceCards.map(card => (
            <TabsContent key={card.id} value={card.id} className="mt-4">
              <Card>
                <CardHeader>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <StaffPerformanceChart 
                        data={card.chartData} 
                        barDataKey={card.barDataKey}
                        barLabel={card.barLabel}
                        formatter={card.formatter}
                    />
                    <div className="max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{card.tableHeaders[0]}</TableHead>
                                    <TableHead className="text-end">{card.tableHeaders[1]}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {card.tableData.map((item) => (
                                    <TableRow key={item.name}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-end font-medium">{card.formatter(item.value)}</TableCell>
                                    </TableRow>
                                ))}
                                {card.tableData.length === 0 && (
                                    <TableRow><TableCell colSpan={2} className="h-24 text-center">{language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {performanceCards.map(card => (
            <Card key={card.id}>
              <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <StaffPerformanceChart 
                      data={card.chartData} 
                      barDataKey={card.barDataKey}
                      barLabel={card.barLabel}
                      formatter={card.formatter}
                  />
                  <div className="max-h-60 overflow-y-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>{card.tableHeaders[0]}</TableHead>
                                  <TableHead className="text-end">{card.tableHeaders[1]}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {card.tableData.map((item) => (
                                  <TableRow key={item.name}>
                                      <TableCell>{item.name}</TableCell>
                                      <TableCell className="text-end font-medium">{card.formatter(item.value)}</TableCell>
                                  </TableRow>
                              ))}
                              {card.tableData.length === 0 && (
                                  <TableRow><TableCell colSpan={2} className="h-24 text-center">{language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="space-y-8">
        <StaffActivityChart data={activityChartData} />
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقرير نشاط الموظفين التفصيلي' : 'Detailed Staff Activity Report'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص الإجراءات التي قام بها كل موظف على الطلبات' : 'Summary of actions performed by each staff member on orders'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {staffActivityReport.length > 0 ? staffActivityReport.map((user) => (
                  <Card key={user.id}>
                      <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-bold">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}: {user.total}</p>
                          </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {orderStatuses.map(status => {
                                  const count = user.actions[status] || 0;
                                  return count > 0 && (
                                      <div key={status} className="flex justify-between">
                                          <span className="text-muted-foreground">{status}</span>
                                          <span className="font-medium">{count}</span>
                                      </div>
                                  )
                              })}
                          </div>
                      </CardContent>
                  </Card>
                )) : (
                  <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                    {language === 'ar' ? 'لا توجد بيانات للعرض في الفترة المحددة.' : 'No data to display for the selected period.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
