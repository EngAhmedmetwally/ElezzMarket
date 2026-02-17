"use client";

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

export default function DashboardPage() {
  const { language } = useLanguage();
  const totalSales = mockOrders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = mockOrders.length;
  const avgOrderValue = totalSales / totalOrders;

  const topModerators = mockUsers
    .filter((u) => u.role === "Moderator")
    .slice(0, 5);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'لوحة التحكم' : 'Dashboard'} />
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
          <SalesChart />
        </div>
        <div>
          <OrdersByStatusChart />
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
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
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
