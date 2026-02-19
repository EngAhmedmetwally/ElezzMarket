
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


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
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
       <Skeleton className="h-[350px] w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
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

  const moderatorsReport = React.useMemo(() => {
    if (!usersData) return [];
    const moderators = usersData.filter(u => u.role === "Moderator");
    return moderators.map(mod => {
      const processedOrders = filteredOrders.filter(o => o.moderatorId === mod.id).length;
      return {
        ...mod,
        processedOrders,
      };
    });
  }, [usersData, filteredOrders]);

  const couriersReport = React.useMemo(() => {
    if (!usersData) return [];
    const couriers = usersData.filter(u => u.role === "Courier");
    return couriers.map(cour => {
      const assignedOrders = filteredOrders.filter(o => o.courierId === cour.id);
      const delivered = assignedOrders.filter(o => o.status === "مكتمل" && o.courierId === cour.id).length;
      const cancelled = assignedOrders.filter(o => o.status === 'ملغي' && o.courierId === cour.id).length;
      const totalAttempted = assignedOrders.filter(o => o.status === 'مكتمل' || o.status === 'ملغي').length;
      const completionRate = totalAttempted > 0 ? (delivered / totalAttempted) * 100 : 0;
      
      return {
        ...cour,
        assignedCount: assignedOrders.length,
        delivered,
        cancelled,
        completionRate,
      };
    });
  }, [usersData, filteredOrders]);
  
  const moderatorsChartData = moderatorsReport.map(m => ({ name: m.name, value: m.processedOrders }));
  const couriersChartData = couriersReport.map(c => ({ name: c.name, value: c.completionRate }));

  const isLoading = isLoadingOrders || isLoadingUsers;

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
        <StaffReportSkeleton />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
      
      <div className="flex items-center gap-4 mb-8">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="space-y-8">
        <StaffPerformanceChart 
            data={moderatorsChartData} 
            title={language === 'ar' ? 'الطلبات المعالجة لكل وسيط' : 'Orders Processed per Moderator'}
            barDataKey="orders"
            barLabel={language === 'ar' ? 'الطلبات' : 'Orders'}
        />
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أداء الوسطاء' : 'Moderators Performance'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص أداء الوسطاء' : 'Performance summary for moderators'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
                 <div className="space-y-4">
                    {moderatorsReport.map(mod => (
                        <Card key={mod.id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={mod.avatarUrl} alt={mod.name} data-ai-hint="avatar" />
                                    <AvatarFallback>{mod.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium">{mod.name}</p>
                                    <p className="text-sm text-muted-foreground">{language === 'ar' ? `الطلبات المعالجة: ${mod.processedOrders}` : `Processed Orders: ${mod.processedOrders}`}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-start">{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات المعالجة' : 'Total Orders Processed'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {moderatorsReport.map((mod) => (
                    <TableRow key={mod.id}>
                        <TableCell className="font-medium text-start">
                        <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={mod.avatarUrl} alt={mod.name} data-ai-hint="avatar" />
                                    <AvatarFallback>{mod.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{mod.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-end">{mod.processedOrders}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>

        <StaffPerformanceChart 
            data={couriersChartData} 
            title={language === 'ar' ? 'نسبة إنجاز المناديب' : 'Courier Completion Rate'}
            barDataKey="rate"
            barLabel={language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}
            formatter={(value) => `${value.toFixed(0)}%`}
        />

         <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أداء المناديب' : 'Couriers Performance'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص أداء المناديب' : 'Performance summary for couriers'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
                <div className="space-y-4">
                    {couriersReport.map(cour => (
                        <Card key={cour.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={cour.avatarUrl} alt={cour.name} data-ai-hint="avatar" />
                                        <AvatarFallback>{cour.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{cour.name}</CardTitle>
                                        <CardDescription>{(cour.completionRate).toFixed(0)}% {language === 'ar' ? 'إنجاز' : 'completion'}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                             <CardContent className="p-4 pt-0 space-y-2 text-sm">
                                <div className="flex justify-between"><span>{language === 'ar' ? 'إجمالي المسند' : 'Total Assigned'}</span> <span>{cour.assignedCount}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'تم التسليم' : 'Delivered'}</span> <span>{cour.delivered}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'ملغي' : 'Cancelled'}</span> <span>{cour.cancelled}</span></div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-start">{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'إجمالي المسند' : 'Total Assigned'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'ملغي' : 'Cancelled'}</TableHead>
                    <TableHead className="w-[120px] text-end">{language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {couriersReport.map((cour) => (
                    <TableRow key={cour.id}>
                        <TableCell className="font-medium text-start">
                        <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={cour.avatarUrl} alt={cour.name} data-ai-hint="avatar" />
                                    <AvatarFallback>{cour.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{cour.name}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-end">{cour.assignedCount}</TableCell>
                        <TableCell className="text-end">{cour.delivered}</TableCell>
                        <TableCell className="text-end">{cour.cancelled}</TableCell>
                        <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground">{cour.completionRate.toFixed(0)}%</span>
                            <Progress value={cour.completionRate} className="h-2 w-20" />
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
