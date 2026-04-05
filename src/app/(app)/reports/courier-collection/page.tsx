
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
import { formatCurrency } from "@/lib/utils";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { subDays } from "date-fns";

const paymentMethods: PaymentMethod[] = ["نقدي عند الاستلام", "انستا باى", "فودافون كاش", "اورانج كاش"];

function CourierCollectionSkeleton() {
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CourierCollectionReportPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(subDays(new Date(), 7));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = toDate.getTime() + (24 * 60 * 60 * 1000);

    return allOrders.filter(order => {
        if (!order.createdAt) return false;
        if (order.status === 'ملغي') return false;
        
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });
  }, [allOrders, fromDate, toDate]);

  const courierCollectionData = React.useMemo(() => {
    const courierMap = new Map<string, { 
        id: string; 
        name: string; 
        payments: Record<PaymentMethod, number>;
        total: number;
        orderCount: number;
    }>();

    const couriersList = users?.filter(u => u.role === 'Courier') || [];
    couriersList.forEach(courier => {
        courierMap.set(courier.id, {
            id: courier.id,
            name: courier.name,
            payments: {
                "نقدي عند الاستلام": 0,
                "انستا باى": 0,
                "فودافون كاش": 0,
                "اورانج كاش": 0
            },
            total: 0,
            orderCount: 0
        });
    });

    filteredOrders.forEach(order => {
        if (order.courierId && courierMap.has(order.courierId)) {
            const data = courierMap.get(order.courierId)!;
            const amount = Number(order.total) || 0;
            const method = order.paymentMethod as PaymentMethod;
            
            if (method && data.payments.hasOwnProperty(method)) {
                data.payments[method] += amount;
            } else {
                data.payments["نقدي عند الاستلام"] += amount;
            }
            
            data.total += amount;
            data.orderCount += 1;
        }
    });

    return Array.from(courierMap.values())
        .filter(c => c.orderCount > 0)
        .sort((a, b) => b.total - a.total);
  }, [filteredOrders, users]);

  const totalToCollect = courierCollectionData.reduce((acc, c) => acc + c.total, 0);
  const totalOrdersCount = courierCollectionData.reduce((acc, c) => acc + c.orderCount, 0);

  const chartData = courierCollectionData.map(c => ({
      name: c.name,
      value: c.total
  }));

  const isLoading = isLoadingOrders || isLoadingUsers;

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'تقرير تحصيل المناديب' : 'Courier Collection Report'} />
        <CourierCollectionSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير تحصيل المناديب' : 'Courier Collection Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-start">{language === 'ar' ? 'إجمالي المطلوب تحصيله' : 'Total to Collect'}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
                <div className="text-3xl font-bold text-primary">{formatCurrency(totalToCollect, language)}</div>
                <p className="text-xs text-muted-foreground mt-1">{totalOrdersCount} {language === 'ar' ? 'أوردر في هذه الفترة' : 'Orders in this period'}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-start">{language === 'ar' ? 'عدد المناديب العاملين' : 'Active Couriers'}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
                <div className="text-3xl font-bold">{courierCollectionData.length}</div>
                <p className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'مناديب لديهم مبيعات حالياً' : 'Couriers with sales currently'}</p>
            </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'توزيع التحصيل حسب المندوب' : 'Collection Distribution by Courier'}</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffPerformanceChart 
                data={chartData} 
                barLabel={language === 'ar' ? 'المبلغ' : 'Amount'}
                formatter={(value) => formatCurrency(value, language)}
                layout="columns"
            />
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تفاصيل تحصيل المناديب وطرق الدفع' : 'Courier Collection & Payment Methods'}</CardTitle>
          <CardDescription className="text-start">
              {language === 'ar' ? 'ملخص المبالغ المالية لكل مندوب مقسمة حسب طريقة الدفع المختارة في الأوردر.' : 'Summary of financial amounts for each courier broken down by payment method.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="text-start">{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                    {paymentMethods.map(method => (
                        <TableHead key={method} className="text-end">{method}</TableHead>
                    ))}
                    <TableHead className="text-end font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                    <TableHead className="text-center">{language === 'ar' ? 'الطلبات' : 'Orders'}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {courierCollectionData.map((row) => (
                    <TableRow key={row.id}>
                    <TableCell className="font-medium text-start">{row.name}</TableCell>
                    {paymentMethods.map(method => (
                        <TableCell key={method} className="text-end">
                            {formatCurrency(row.payments[method], language)}
                        </TableCell>
                    ))}
                    <TableCell className="text-end font-bold text-primary">
                        {formatCurrency(row.total, language)}
                    </TableCell>
                    <TableCell className="text-center">{row.orderCount}</TableCell>
                    </TableRow>
                ))}
                {courierCollectionData.length === 0 && (
                    <TableRow>
                    <TableCell colSpan={paymentMethods.length + 3} className="h-32 text-center text-muted-foreground">
                        {language === 'ar' ? 'لا توجد بيانات لهذه الفترة.' : 'No data for this period.'}
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
