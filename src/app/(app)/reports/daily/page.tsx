
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useDatabase } from "@/firebase";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format } from "date-fns";
import Link from "next/link";
import { fetchOrdersByDateRange } from "@/lib/data-fetching";

// Data structure for the report
type DailyReportData = {
  date: string;
  totalOrders: number;
  totalItems: number;
  totalWeight: number;
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
  
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!database || !fromDate || !toDate) return;
    setIsLoading(true);
    fetchOrdersByDateRange(database, fromDate, toDate).then(fetchedOrders => {
        setFilteredOrders(fetchedOrders);
        setIsLoading(false);
    }).catch(error => {
        console.error("Error fetching orders for daily report:", error);
        setIsLoading(false);
    });
  }, [database, version, fromDate, toDate]);

  const dailyReportData = React.useMemo(() => {
    if (!filteredOrders) return [];

    const dailyMap = new Map<string, { totalOrders: number; totalItems: number; totalWeight: number }>();

    filteredOrders.forEach(order => {
      if (!order.createdAt) return;
      const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
      
      const dayData = dailyMap.get(dateStr) || { totalOrders: 0, totalItems: 0, totalWeight: 0 };
      dayData.totalOrders += 1;
      
      const itemsArray = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
      dayData.totalItems += itemsArray.reduce((acc, item) => acc + (item.quantity || 0), 0);
      dayData.totalWeight += itemsArray.reduce((acc, item) => acc + ((item.weight || 0) * (item.quantity || 1)), 0);
      
      dailyMap.set(dateStr, dayData);
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [filteredOrders]);

  const productsSummary = React.useMemo(() => {
    if (!filteredOrders) return [];

    const productMap = new Map<string, { totalQuantity: number; totalWeight: number }>();

    filteredOrders.forEach(order => {
        const itemsArray = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
        itemsArray.forEach(item => {
            const productName = item.productName;
            if (!productName) return;
            
            const productData = productMap.get(productName) || { totalQuantity: 0, totalWeight: 0 };
            
            productData.totalQuantity += item.quantity || 0;
            productData.totalWeight += (item.weight || 0) * (item.quantity || 1);

            productMap.set(productName, productData);
        });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

  }, [filteredOrders]);

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
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الأوزان (كجم)' : 'Total Weight (kg)'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyReportData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{format(new Date(row.date), "PPP")}</TableCell>
                  <TableCell className="text-end">{row.totalOrders}</TableCell>
                  <TableCell className="text-end">{row.totalItems}</TableCell>
                  <TableCell className="text-end">{row.totalWeight.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {dailyReportData.length === 0 && (
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
          <CardTitle>{language === 'ar' ? 'ملخص الأصناف' : 'Items Summary'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'إجمالي الكميات والأوزان لكل صنف في الفترة المحددة' : 'Total quantities and weights for each item in the selected period'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الكمية' : 'Total Quantity'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجمالي الوزن (كجم)' : 'Total Weight (kg)'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsSummary.map((row) => {
                 const fromDateString = fromDate ? fromDate.toISOString() : '';
                 const toDateString = toDate ? toDate.toISOString() : '';
                 const href = `/reports/products/${encodeURIComponent(row.name)}?from=${fromDateString}&to=${toDateString}`;

                return (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">
                      <Link href={href} className="hover:underline text-primary">
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-end">{row.totalQuantity}</TableCell>
                    <TableCell className="text-end">{row.totalWeight.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
              {productsSummary.length === 0 && (
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
