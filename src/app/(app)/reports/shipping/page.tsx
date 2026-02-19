
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useDatabase, useCollection, useMemoFirebase } from "@/firebase";
import type { Order, User } from "@/lib/types";
import { ref, get } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Separator } from "@/components/ui/separator";

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
      <Separator />
      <Skeleton className="h-[350px] w-full" />
    </div>
  );
}

export default function ShippingReportPage() {
  const { language } = useLanguage();
  const database = useDatabase();
  const [version, setVersion] = React.useState(0);
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true);

  React.useEffect(() => {
    if (!database) return;
    setIsLoadingOrders(true);
    const ordersRef = ref(database, 'orders');
    get(ordersRef).then(snapshot => {
        const fetchedOrders: Order[] = [];
        if (snapshot.exists()) {
            const ordersByMonthYear = snapshot.val();
            Object.keys(ordersByMonthYear).forEach(monthYear => {
                const ordersByDay = ordersByMonthYear[monthYear];
                Object.keys(ordersByDay).forEach(day => {
                    const orders = ordersByDay[day];
                    Object.keys(orders).forEach(orderId => {
                        fetchedOrders.push({ ...orders[orderId], id: orderId });
                    });
                });
            });
        }
        setAllOrders(fetchedOrders);
        setIsLoadingOrders(false);
    }).catch(error => {
        console.error("Error fetching all orders for shipping report:", error);
        setIsLoadingOrders(false);
    });
  }, [database, version]);

  const usersQuery = useMemoFirebase(() => database ? ref(database, "users") : null, [database]);
  const { data: usersData, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const revenueOrders = React.useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(order => {
        if (order.status === 'ملغي') return false; // Exclude cancelled orders
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (fromDate) {
            const fromDateStart = new Date(fromDate);
            fromDateStart.setHours(0, 0, 0, 0);
            if (orderDate < fromDateStart) return false;
        }
        if (toDate) {
            const toDateEnd = new Date(toDate);
            toDateEnd.setHours(23, 59, 59, 999);
            if (orderDate > toDateEnd) return false;
        }
        return true;
    });
  }, [allOrders, fromDate, toDate]);

  const performanceOrders = React.useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter(order => {
        if (order.status !== "مكتمل") return false; 
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        if (fromDate) {
            const fromDateStart = new Date(fromDate);
            fromDateStart.setHours(0, 0, 0, 0);
            if (orderDate < fromDateStart) return false;
        }
        if (toDate) {
            const toDateEnd = new Date(toDate);
            toDateEnd.setHours(23, 59, 59, 999);
            if (orderDate > toDateEnd) return false;
        }
        return true;
    });
  }, [allOrders, fromDate, toDate]);

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

  const { courierZonePerformance, allZones } = React.useMemo(() => {
    if (!usersData) return { courierZonePerformance: [], allZones: [] };
    const couriers = usersData.filter(u => u.role === "Courier");
    const uniqueZones = [...new Set(performanceOrders.map(o => o.zoning).filter(Boolean))].sort();
    
    const perfMap = new Map<string, { name: string, zones: Map<string, number> }>();
    couriers.forEach(c => perfMap.set(c.id, { name: c.name, zones: new Map() }));

    performanceOrders.forEach(order => {
      if (order.courierId && order.zoning && perfMap.has(order.courierId)) {
        const courierPerf = perfMap.get(order.courierId)!;
        courierPerf.zones.set(order.zoning, (courierPerf.zones.get(order.zoning) || 0) + 1);
      }
    });

    const perfArray = Array.from(perfMap.values())
        .map(p => ({...p, total: Array.from(p.zones.values()).reduce((a,b) => a + b, 0)}))
        .filter(p => p.total > 0)
        .sort((a,b) => b.total - a.total);

    return { courierZonePerformance: perfArray, allZones: uniqueZones };
  }, [performanceOrders, usersData]);


  const topZonesChartData = zonePerformance.slice(0, 10).map(z => ({ name: z.name, value: z.value }));
  const isLoading = isLoadingOrders || isLoadingUsers;
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

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
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي إيرادات الشحن' : 'Total Shipping Revenue'}</CardTitle>
                 <CardDescription>{language === 'ar' ? 'من جميع الطلبات غير الملغاة في الفترة المحددة' : 'From all non-cancelled orders in the selected period'}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(totalShippingRevenue)}</div>
            </CardContent>
        </Card>

        <StaffPerformanceChart 
            data={topZonesByRevenueChartData} 
            title={language === 'ar' ? 'أعلى المناطق من حيث إيراد الشحن' : 'Top Zones by Shipping Revenue'}
            barDataKey="revenue"
            barLabel={language === 'ar' ? 'الإيراد' : 'Revenue'}
            formatter={formatCurrency}
        />

        <Card>
            <CardHeader>
            <CardTitle>{language === 'ar' ? 'ملخص إيرادات الشحن لكل منطقة' : 'Shipping Revenue per Zone Summary'}</CardTitle>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {zoneShippingRevenue.map((row) => (
                    <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-end">{formatCurrency(row.value)}</TableCell>
                    </TableRow>
                ))}
                {zoneShippingRevenue.length === 0 && (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        {language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      
      <Separator className="my-12" />

        <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{language === 'ar' ? 'تقرير أداء التسليم' : 'Delivery Performance Report'}</h2>
            <p className="text-muted-foreground">{language === 'ar' ? 'تحليلات للطلبات التي تم تسليمها (مكتملة) فقط.' : 'Analytics for delivered (completed) orders only.'}</p>
        </div>

      <StaffPerformanceChart 
        data={topZonesChartData} 
        title={language === 'ar' ? 'أفضل المناطق أداءً' : 'Top Performing Zones'}
        barDataKey="orders"
        barLabel={language === 'ar' ? 'الطلبات' : 'Orders'}
      />

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الطلبات لكل منطقة' : 'Orders per Zone Summary'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'إجمالي الطلبات التي تم تسليمها في كل منطقة خلال الفترة المحددة' : 'Total delivered orders in each zone for the selected period'}</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zonePerformance.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-end">{row.value}</TableCell>
                </TableRow>
              ))}
              {zonePerformance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
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
          <CardTitle>{language === 'ar' ? 'زيارات المناديب للمناطق' : 'Courier Visits per Zone'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'توزيع زيارات كل مندوب على المناطق المختلفة.' : 'Distribution of each courier\'s visits across different zones.'}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {courierZonePerformance.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                    {allZones.map(zone => <TableHead key={zone} className="text-center">{zone}</TableHead>)}
                     <TableHead className="text-center font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courierZonePerformance.map(courier => (
                    <TableRow key={courier.name}>
                      <TableCell className="font-medium">{courier.name}</TableCell>
                      {allZones.map(zone => (
                        <TableCell key={zone} className="text-center">
                          {courier.zones.get(zone) || 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold">{courier.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          ) : (
             <div className="h-24 text-center flex items-center justify-center">
              {language === 'ar' ? 'لا توجد بيانات للعرض.' : 'No data to display.'}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
