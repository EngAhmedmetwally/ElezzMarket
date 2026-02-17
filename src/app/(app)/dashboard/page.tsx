"use client";

import * as React from "react";
import { DollarSign, Package, Users, BarChart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { OrdersByStatusChart } from "@/components/dashboard/orders-by-status-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mockOrders, mockUsers } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";

export default function DashboardPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(undefined);
  const [toDate, setToDate] = React.useState<Date | undefined>(undefined);

  const filteredOrders = React.useMemo(() => {
    return mockOrders.filter(order => {
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
  }, [fromDate, toDate]);

  const totalSales = filteredOrders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const ordersByStatus = React.useMemo(() => {
    const statusCounts = filteredOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const salesByMonth = React.useMemo(() => {
      const salesMap = filteredOrders.reduce((acc, order) => {
          const month = new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
          acc.set(month, (acc.get(month) || 0) + order.total);
          return acc;
      }, new Map<string, number>());

      return Array.from(salesMap, ([month, sales]) => ({ month, sales }));
  }, [filteredOrders, language]);

  const topModerators = mockUsers
    .filter((u) => u.role === "Moderator")
    .slice(0, 5);

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
          description={language === 'ar' ? '+20.1% عن الشهر الماضي' : '+20.1% from last month'}
        />
        <KpiCard
          title={language === 'ar' ? 'الطلبات' : 'Orders'}
          value={`+${totalOrders}`}
          icon={<Package className="h-4 w-4" />}
          description={language === 'ar' ? '+180.1% عن الشهر الماضي' : '+180.1% from last month'}
        />
        <KpiCard
          title={language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg. Order Value'}
          value={`EGP ${avgOrderValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<BarChart className="h-4 w-4" />}
          description={language === 'ar' ? '+19% عن الشهر الماضي' : '+19% from last month'}
        />
        <KpiCard
          title={language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}
          value={`+${mockUsers.filter((u) => u.status === "نشط").length}`}
          icon={<Users className="h-4 w-4" />}
          description={language === 'ar' ? '+5 عن الشهر الماضي' : '+5 from last month'}
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
                {topModerators.map((user) => (
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
                      +EGP {Math.floor(Math.random() * 5000 + 1000).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
