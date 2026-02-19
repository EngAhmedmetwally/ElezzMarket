
"use client";

import * as React from "react";
import { DollarSign, Package, Users, BarChart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { OrdersByStatusChart } from "./orders-by-status-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import type { Order, User, UserRole } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

function DashboardSkeleton() {
  const { language } = useLanguage();
  return (
    <div>
      <PageHeader title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'} />
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
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Skeleton className="h-[350px]" />
        </div>
        <div>
            <Skeleton className="h-[350px]" />
        </div>
         <div className="lg:col-span-3">
            <Skeleton className="h-[400px]" />
        </div>
       </div>
    </div>
  )
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

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

  const totalSales = filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;
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
      const salesMap = filteredOrders.reduce((acc, order) => {
          if (!order.createdAt) return acc;
          const month = new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
          acc.set(month, (acc.get(month) || 0) + (order.total || 0));
          return acc;
      }, new Map<string, number>());

      return Array.from(salesMap, ([month, sales]) => ({ month, sales }));
  }, [filteredOrders, language]);

  const topModerators = React.useMemo(() => {
    if (!users || !filteredOrders) return [];
    
    const moderators = users.filter(u => u.role === 'Moderator');
    
    return moderators.map(moderator => {
      const moderatorSales = filteredOrders
        .filter(o => o.moderatorId === moderator.id)
        .reduce((acc, order) => acc + (order.total || 0), 0);
      
      return {
        ...moderator,
        sales: moderatorSales
      };
    })
    .filter(m => m.sales > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  }, [users, filteredOrders]);

  if (isLoadingOrders || isLoadingUsers) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'} />

      <div className="flex items-center gap-4 mb-8">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          title={language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
          value={`EGP ${totalSales.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'الطلبات' : 'Orders'}
          value={`+${totalOrders}`}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg. Order Value'}
          value={`EGP ${avgOrderValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<BarChart className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
          value={`+${activeUsersCount}`}
          icon={<Users className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart data={salesByMonth} />
        </div>
        <div>
          <OrdersByStatusChart data={ordersByStatus} />
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'أفضل الوسطاء' : 'Top Moderators'}</CardTitle>
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
                    <div className="ms-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="ms-auto font-medium">
                      +EGP {user.sales.toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات مبيعات لعرضها.' : 'No sales data to display.'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
