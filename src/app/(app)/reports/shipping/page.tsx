
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { subDays } from "date-fns";

function ShippingReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
      <Skeleton className="h-24 w-1/3" />
      <Skeleton className="h-[350px] w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShippingReportPage() {
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

  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const from = fromDate.getTime();
    const to = toDate.getTime();
    return allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });
  }, [allOrders, fromDate, toDate]);

  const revenueOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders.filter(order => order.status !== 'ملغي');
  }, [filteredOrders]);

  const performanceOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders.filter(order => order.status === "مكتمل"); 
  }, [filteredOrders]);

  const zoneShippingRevenue = React.useMemo(() => {
    const zoneMap = new Map<string, number>();
    revenueOrders.forEach(order => {
      if (order.zoning && order.shippingCost) {
        zoneMap.set(order.zoning, (zoneMap.get(order.zoning) || 0) + order.shippingCost);
      }
    });
    return Array.from(zoneMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [revenueOrders]);

  const totalShippingRevenue = zoneShippingRevenue.reduce((acc, zone) => acc + zone.value, 0);
  const topZonesByRevenueChartData = zoneShippingRevenue.slice(0, 10).map(z => ({ name: z.name, value: z.value }));

  const zonePerformance = React.useMemo(() => {
    const zoneMap = new Map<string, number>();
    performanceOrders.forEach(order => {
      if (order.zoning) {
        zoneMap.set(order.zoning, (zoneMap.get(order.zoning) || 0) + 1);
      }
    });
    return Array.from(zoneMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [performanceOrders]);

  const topZonesChartData = zonePerformance.slice(0, 10).map(z => ({ name: z.name, value: z.value }));
  const isLoading = isLoadingOrders || isLoadingUsers;

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير الشحن' : 'Shipping Report'} />
        <ShippingReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير الشحن' : 'Shipping Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-start">{language === 'ar' ? 'إجمالي إيرادات الشحن' : 'Total Shipping Revenue'}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
                <div className="text-3xl font-bold">{formatCurrency(totalShippingRevenue, language)}</div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أعلى المناطق من حيث إيراد الشحن' : 'Top Zones by Shipping Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart 
                data={topZonesByRevenueChartData} 
                barDataKey="value"
                barLabel={language === 'ar' ? 'الإيراد' : 'Revenue'}
                formatter={(value) => formatCurrency(value, language)}
                layout="vertical"
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>{language === 'ar' ? 'ملخص إيرادات الشحن لكل منطقة' : 'Shipping Revenue per Zone Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="text-start">{language === 'ar' ? 'المنطقة' : 'Zone'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {zoneShippingRevenue.map((row) => (
                        <TableRow key={row.name}>
                        <TableCell className="font-medium text-start">{row.name}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.value, language)}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            </CardContent>
        </Card>
      
      <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أفضل المناطق أداءً (طلبات مكتملة)' : 'Top Performing Zones (Completed)'}</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart 
              data={topZonesChartData} 
              barDataKey="value"
              barLabel={language === 'ar' ? 'الطلبات' : 'Orders'}
              layout="vertical"
            />
          </CardContent>
        </Card>
    </div>
  );
}
