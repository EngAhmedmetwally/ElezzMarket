
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, StatusHistoryItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { format } from "date-fns";

type CancelledOrderInfo = {
  orderId: string;
  orderTotal: number;
  customerName: string;
  moderatorName: string;
  cancelledAt: string;
  cancelledBy: string;
  cancellationNotes: string;
};

// Skeleton component for loading state
function CancelledReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-48" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CancelledOrdersReportPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const cancelledOrdersInfo: CancelledOrderInfo[] = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);

    const ordersInDateRange = allOrders.filter(order => {
        if (order.status !== 'ملغي') return false;
        
        const historyArray = order.statusHistory ? Object.values(order.statusHistory) : [];
        const cancelledEvents = historyArray
            .filter(h => h.status === 'ملغي')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const lastCancelledEvent = cancelledEvents[0];
        
        if (!lastCancelledEvent || !lastCancelledEvent.createdAt) return false;
        
        const cancelledDate = new Date(lastCancelledEvent.createdAt).getTime();
        return cancelledDate >= from && cancelledDate <= to;
    });

    return ordersInDateRange.map(order => {
        const historyArray = Object.values(order.statusHistory);
        const cancelledEvents = historyArray
            .filter(h => h.status === 'ملغي')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastCancelledEvent = cancelledEvents[0];
        
        return {
            orderId: order.id,
            orderTotal: order.total,
            customerName: order.customerName,
            moderatorName: order.moderatorName,
            cancelledAt: lastCancelledEvent?.createdAt ? format(new Date(lastCancelledEvent.createdAt), "PPP p") : '-',
            cancelledBy: lastCancelledEvent?.userName || 'N/A',
            cancellationNotes: lastCancelledEvent?.notes || '-',
        };
    }).sort((a, b) => new Date(b.cancelledAt).getTime() - new Date(a.cancelledAt).getTime());

  }, [allOrders, fromDate, toDate]);

  const totalCancelledValue = cancelledOrdersInfo.reduce((acc, order) => acc + order.orderTotal, 0);

  const cancellationsByModerator = React.useMemo(() => {
    const moderatorMap = new Map<string, number>();
    cancelledOrdersInfo.forEach(order => {
        if (order.moderatorName) {
            moderatorMap.set(order.moderatorName, (moderatorMap.get(order.moderatorName) || 0) + 1);
        }
    });
    return Array.from(moderatorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [cancelledOrdersInfo]);

  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير الطلبات الملغاة' : 'Cancelled Orders Report'} />
        <CancelledReportSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير الطلبات الملغاة' : 'Cancelled Orders Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الطلبات الملغاة' : 'Total Cancelled Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{cancelledOrdersInfo.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي القيمة الملغاة' : 'Total Cancelled Value'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(totalCancelledValue)}</div>
            </CardContent>
        </Card>
      </div>
      
       <StaffPerformanceChart 
        data={cancellationsByModerator} 
        title={language === 'ar' ? 'الطلبات الملغاة حسب الوسيط' : 'Cancellations by Moderator'}
        barDataKey="cancellations"
        barLabel={language === 'ar' ? 'طلبات ملغاة' : 'Cancelled Orders'}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تفاصيل الطلبات الملغاة' : 'Cancelled Order Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                <TableHead>{language === 'ar' ? 'تاريخ الإلغاء' : 'Cancelled At'}</TableHead>
                <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                <TableHead>{language === 'ar' ? 'تم الإلغاء بواسطة' : 'Cancelled By'}</TableHead>
                <TableHead>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancelledOrdersInfo.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>{order.cancelledAt}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.moderatorName}</TableCell>
                  <TableCell>{order.cancelledBy}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.cancellationNotes}</TableCell>
                  <TableCell className="text-end">{formatCurrency(order.orderTotal)}</TableCell>
                </TableRow>
              ))}
              {cancelledOrdersInfo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
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
