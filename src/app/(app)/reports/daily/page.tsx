
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useDatabase } from "@/firebase";
import type { Order } from "@/lib/types";
import { ref, get } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format } from "date-fns";

// Data structure for the report
type DailyReportData = {
  date: string;
  totalOrders: number;
  totalItems: number;
};

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
    </div>
  );
}

export default function DailyReportPage() {
  const { language } = useLanguage();
  const database = useDatabase();
  const [version] = React.useState(0);
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!database) return;
    setIsLoading(true);
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
        setIsLoading(false);
    }).catch(error => {
        console.error("Error fetching all orders for daily report:", error);
        setIsLoading(false);
    });
  }, [database, version]);

  const dailyReportData = React.useMemo(() => {
    if (!allOrders) return [];

    const filtered = allOrders.filter(order => {
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

    const dailyMap = new Map<string, { totalOrders: number; totalItems: number }>();

    filtered.forEach(order => {
      if (!order.createdAt) return;
      const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
      
      const dayData = dailyMap.get(dateStr) || { totalOrders: 0, totalItems: 0 };
      dayData.totalOrders += 1;
      
      const itemsArray = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
      dayData.totalItems += itemsArray.reduce((acc, item) => acc + (item.quantity || 0), 0);
      
      dailyMap.set(dateStr, dayData);
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [allOrders, fromDate, toDate]);

  const chartData = dailyReportData.map(d => ({ 
    name: format(new Date(d.date), "MMM d"), 
    value: d.totalItems 
  })).reverse();

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'التقرير اليومي' : 'Daily Report'} />
        <DailyReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'التقرير اليومي' : 'Daily Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <StaffPerformanceChart 
        data={chartData} 
        title={language === 'ar' ? 'إجمالي الأصناف المباعة يوميًا' : 'Total Items Sold Per Day'}
        barDataKey="items"
        barLabel={language === 'ar' ? 'الأصناف' : 'Items'}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص اليوميات' : 'Daily Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الأصناف' : 'Total Items'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyReportData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{format(new Date(row.date), "PPP")}</TableCell>
                  <TableCell className="text-end">{row.totalOrders}</TableCell>
                  <TableCell className="text-end">{row.totalItems}</TableCell>
                </TableRow>
              ))}
              {dailyReportData.length === 0 && (
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
