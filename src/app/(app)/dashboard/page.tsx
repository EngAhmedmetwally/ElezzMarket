
"use client";

import * as React from "react";
import { DollarSign, Package, Users, BarChart, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { OrdersByStatusChart } from "./orders-by-status-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import type { Order, User, OrderItem, OrderStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { PeakTimeChart } from "./peak-time-chart";
import { TopProductsCard } from "./top-products-card";
import { formatCurrency } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDatabase, useMemoFirebase } from "@/firebase";
import { ref, query, orderByChild, startAt, endAt } from "firebase/database";

const allPossibleStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي", "معلق"];

export default function DashboardPage() {
  const { language } = useLanguage();
  const database = useDatabase();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  
  const [selectedStatuses, setSelectedStatuses] = React.useState<Set<OrderStatus>>(
      new Set(allPossibleStatuses.filter(s => s !== 'ملغي'))
  );

  // OPTIMIZATION: Filter orders by date range at SERVER level.
  // This avoids downloading thousands of historical orders.
  const dashboardQuery = useMemoFirebase(() => {
    if (!database || !fromDate || !toDate) return null;
    const start = fromDate.toISOString();
    const end = new Date(toDate).setHours(23, 59, 59, 999);
    return query(
        ref(database, 'orders'), 
        orderByChild('createdAt'), 
        startAt(start), 
        endAt(new Date(end).toISOString())
    );
  }, [database, fromDate, toDate]);

  const { data: filteredOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders', dashboardQuery);
  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const toggleStatus = (status: OrderStatus) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) newSet.delete(status); else newSet.add(status);
    setSelectedStatuses(newSet);
  };

  const revenueOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders.filter(order => selectedStatuses.has(order.status));
  }, [filteredOrders, selectedStatuses]);

  const totalSales = revenueOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = revenueOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const activeUsersCount = users ? users.filter(u => u.status === 'نشط').length : 0;

  const ordersByStatus = React.useMemo(() => {
    const counts = (filteredOrders || []).reduce((acc, order) => {
        if(order.status) acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const salesByMonth = React.useMemo(() => {
      const map = revenueOrders.reduce((acc, order) => {
          if (!order.createdAt) return acc;
          const m = new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
          acc.set(m, (acc.get(m) || 0) + (order.total || 0));
          return acc;
      }, new Map<string, number>());
      return Array.from(map, ([month, sales]) => ({ month, sales }));
  }, [revenueOrders, language]);

  const topModerators = React.useMemo(() => {
    if (!users || !filteredOrders) return [];
    const counts = filteredOrders.reduce((acc, order) => {
        if(order.moderatorId) acc[order.moderatorId] = (acc[order.moderatorId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return users.filter(u => u.role === 'Moderator')
      .map(m => ({ ...m, orderCount: counts[m.id] || 0 }))
      .filter(m => m.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  }, [users, filteredOrders]);
  
  const peakTimeData = React.useMemo(() => {
    const hours = Array(24).fill(0);
    (filteredOrders || []).forEach(order => {
        if (order.createdAt) hours[new Date(order.createdAt).getHours()]++;
    });
    return hours.map((count, index) => ({ hour: `${index}:00`, orders: count }));
  }, [filteredOrders]);

  const topProducts = React.useMemo(() => {
    const counts = revenueOrders.reduce((acc, order) => {
        const items: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
        items.forEach(i => { if (i.productName) acc[i.productName] = (acc[i.productName] || 0) + i.quantity; });
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [revenueOrders]);


  if (isLoadingOrders || isLoadingUsers) {
    return (
        <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'متابعه الاعمال' : 'Business Overview'} showBackButton={false} />
            <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-28"/><Skeleton className="h-28"/><Skeleton className="h-28"/><Skeleton className="h-28"/></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><Skeleton className="h-[350px]"/><Skeleton className="h-[350px]"/></div>
        </div>
    );
  }

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'متابعه الاعمال' : 'Business Overview'} showBackButton={false} />

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 border-dashed"><Filter className="me-2 h-4 w-4" />{language === 'ar' ? 'فلتر الحالات' : 'Status Filter'}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
                <div className="space-y-4 text-start">
                    <h4 className="font-medium text-sm">{language === 'ar' ? 'اختر الحالات' : 'Select statuses'}</h4>
                    <div className="space-y-2">
                        {allPossibleStatuses.map((s) => (
                            <div key={s} className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Checkbox id={`s-${s}`} checked={selectedStatuses.has(s)} onCheckedChange={() => toggleStatus(s)}/>
                                <Label htmlFor={`s-${s}`} className="text-sm cursor-pointer">{s}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard title={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'} value={formatCurrency(totalSales, language)} icon={<DollarSign className="h-4 w-4" />}/>
        <KpiCard title={language === 'ar' ? 'الطلبات' : 'Orders'} value={`${totalOrders}`} icon={<Package className="h-4 w-4" />}/>
        <KpiCard title={language === 'ar' ? 'متوسط الطلب' : 'Avg. Order'} value={formatCurrency(avgOrderValue, language)} icon={<BarChart className="h-4 w-4" />}/>
        <KpiCard title={language === 'ar' ? 'المستخدمون' : 'Active Users'} value={`+${activeUsersCount}`} icon={<Users className="h-4 w-4" />}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesChart data={salesByMonth} />
        <OrdersByStatusChart data={ordersByStatus} />
        <PeakTimeChart data={peakTimeData} />
        <Card>
            <CardHeader><CardTitle>{language === 'ar' ? 'أفضل الوسطاء' : 'Top Moderators'}</CardTitle></CardHeader>
            <CardContent><div className="space-y-8">{topModerators.map((u) => (
                <div key={u.id} className="flex items-center">
                    <Avatar className="h-9 w-9"><AvatarImage src={u.avatarUrl}/><AvatarFallback>{u.name.charAt(0)}</AvatarFallback></Avatar>
                    <div className="ms-4 text-start"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    <div className="ms-auto font-medium">+{u.orderCount}</div>
                </div>
            ))}</div></CardContent>
          </Card>
        <div className="lg:col-span-2"><TopProductsCard data={topProducts} /></div>
      </div>
    </div>
  );
}
