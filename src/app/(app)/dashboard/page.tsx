
"use client";

import * as React from "react";
import { DollarSign, Package, Users, BarChart, Filter, Check } from "lucide-react";
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

const allPossibleStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي", "معلق"];

function DashboardSkeleton() {
  const { language } = useLanguage();
  return (
    <div>
      <PageHeader title={language === 'ar' ? 'متابعه الاعمال' : 'Business Overview'} showBackButton={false} />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <Skeleton className="h-28" />
         <Skeleton className="h-28" />
         <Skeleton className="h-28" />
         <Skeleton className="h-28" />
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
        <div className="lg:col-span-2">
           <Skeleton className="h-[400px]" />
        </div>
       </div>
    </div>
  )
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  
  // New Status Filter State
  const [selectedStatuses, setSelectedStatuses] = React.useState<Set<OrderStatus>>(
      new Set(allPossibleStatuses.filter(s => s !== 'ملغي')) // Exclude cancelled by default
  );

  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const toggleStatus = (status: OrderStatus) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
        newSet.delete(status);
    } else {
        newSet.add(status);
    }
    setSelectedStatuses(newSet);
  };

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

  // Apply Status Filter for Revenue KPIs
  const revenueOrders = React.useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders.filter(order => selectedStatuses.has(order.status));
  }, [filteredOrders, selectedStatuses]);

  const totalSales = revenueOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = revenueOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const activeUsersCount = users ? users.filter(u => u.status === 'نشط').length : 0;

  const ordersByStatus = React.useMemo(() => {
    const statusCounts = filteredOrders.reduce((acc, order) => {
        if(order.status) {
          acc[order.status] = (acc[order.status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const salesByMonth = React.useMemo(() => {
      const salesMap = revenueOrders.reduce((acc, order) => {
          if (!order.createdAt) return acc;
          const month = new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
          acc.set(month, (acc.get(month) || 0) + (order.total || 0));
          return acc;
      }, new Map<string, number>());

      return Array.from(salesMap, ([month, sales]) => ({ month, sales }));
  }, [revenueOrders, language]);

  const topModerators = React.useMemo(() => {
    if (!users || !filteredOrders) return [];
    
    const moderators = users.filter(u => u.role === 'Moderator');
    
    const moderatorOrderCounts = filteredOrders.reduce((acc, order) => {
        if(order.moderatorId) {
            acc[order.moderatorId] = (acc[order.moderatorId] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return moderators.map(moderator => ({
      ...moderator,
      orderCount: moderatorOrderCounts[moderator.id] || 0
    }))
    .filter(m => m.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);

  }, [users, filteredOrders]);
  
  const peakTimeData = React.useMemo(() => {
    const hours = Array(24).fill(0);
    filteredOrders.forEach(order => {
        if (order.createdAt) {
            const hour = new Date(order.createdAt).getHours();
            hours[hour]++;
        }
    });

    return hours.map((count, index) => ({
        hour: `${index}:00`,
        orders: count
    }));
  }, [filteredOrders]);

  const topProducts = React.useMemo(() => {
    if (!revenueOrders) return [];
    
    const productCounts = revenueOrders.reduce((acc, order) => {
        if (order.items) {
            const items: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items);
            items.forEach((item: OrderItem) => {
                if (item.productName) {
                    acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
                }
            });
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(productCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

  }, [revenueOrders]);


  if (isLoadingOrders || isLoadingUsers) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'متابعه الاعمال' : 'Business Overview'} showBackButton={false} />

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 border-dashed">
                    <Filter className="me-2 h-4 w-4" />
                    {language === 'ar' ? 'فلتر الحالات' : 'Status Filter'}
                    {selectedStatuses.size < allPossibleStatuses.length && (
                        <span className="ms-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                            {selectedStatuses.size}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-start">{language === 'ar' ? 'اختر الحالات للمتابعة' : 'Select statuses to monitor'}</h4>
                    <div className="space-y-2">
                        {allPossibleStatuses.map((status) => (
                            <div key={status} className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Checkbox 
                                    id={`status-${status}`} 
                                    checked={selectedStatuses.has(status)}
                                    onCheckedChange={() => toggleStatus(status)}
                                />
                                <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">{status}</Label>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => setSelectedStatuses(new Set(allPossibleStatuses))}>
                            {language === 'ar' ? 'الكل' : 'All'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => setSelectedStatuses(new Set())}>
                            {language === 'ar' ? 'لا شيء' : 'None'}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          title={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={formatCurrency(totalSales, language)}
          icon={<DollarSign className="h-4 w-4" />}
          description={language === 'ar' ? `لعدد ${selectedStatuses.size} حالة مختارة` : `For ${selectedStatuses.size} selected statuses`}
        />
        <KpiCard
          title={language === 'ar' ? 'الطلبات' : 'Orders'}
          value={`${totalOrders}`}
          icon={<Package className="h-4 w-4" />}
          description={language === 'ar' ? 'بناءً على الفلتر الحالي' : 'Based on current filter'}
        />
        <KpiCard
          title={language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg. Order Value'}
          value={formatCurrency(avgOrderValue, language)}
          icon={<BarChart className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
          value={`+${activeUsersCount}`}
          icon={<Users className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesChart data={salesByMonth} />
        <OrdersByStatusChart data={ordersByStatus} />
        <PeakTimeChart data={peakTimeData} />
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'أفضل الوسطاء' : 'Top Moderators'}</CardTitle>
                <CardDescription>{language === 'ar' ? 'بناءً على عدد الطلبات المسجلة' : 'Based on number of orders created'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topModerators.length > 0 ? topModerators.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl} alt="Avatar" data-ai-hint="avatar" />
                      <AvatarFallback>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ms-4 space-y-1 text-start">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="ms-auto font-medium">
                      +{user.orderCount} {language === 'ar' ? 'طلبات' : 'orders'}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات لعرضها.' : 'No data to display.'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        <div className="lg:col-span-2">
            <TopProductsCard data={topProducts} />
        </div>
      </div>
    </div>
  );
}
