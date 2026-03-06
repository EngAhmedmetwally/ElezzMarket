
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from "next/navigation";

type OnHoldOrderInfo = {
  order: Order;
  duration: string;
  onHoldSince: Date;
};

function OnHoldSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
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

export default function OnHoldOrdersPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const onHoldOrdersInfo: OnHoldOrderInfo[] = React.useMemo(() => {
    if (!allOrders) return [];
    
    return allOrders
      .filter(order => order.status === 'معلق')
      .map(order => {
        const historyArray = order.statusHistory ? Object.values(order.statusHistory) : [];
        const onHoldEvents = historyArray
            .filter(h => h.status === 'معلق')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const lastOnHoldEvent = onHoldEvents[0];
        const onHoldSince = lastOnHoldEvent ? new Date(lastOnHoldEvent.createdAt) : new Date(order.updatedAt);
        
        const duration = formatDistanceToNow(onHoldSince, { addSuffix: true, locale: language === 'ar' ? ar : undefined });
        
        return {
            order: order,
            duration: duration,
            onHoldSince: onHoldSince,
        };
    }).sort((a,b) => a.onHoldSince.getTime() - b.onHoldSince.getTime()); // Oldest first
  }, [allOrders, language]);

  const { courierStats, moderatorStats } = React.useMemo(() => {
      const couriers = new Map<string, { name: string; count: number }>();
      const moderators = new Map<string, { name: string; count: number }>();

      onHoldOrdersInfo.forEach(({ order }) => {
          if (order.courierId && order.courierName) {
              const courier = couriers.get(order.courierId) || { name: order.courierName, count: 0 };
              courier.count += 1;
              couriers.set(order.courierId, courier);
          }
          if (order.moderatorId && order.moderatorName) {
              const moderator = moderators.get(order.moderatorId) || { name: order.moderatorName, count: 0 };
              moderator.count += 1;
              moderators.set(order.moderatorId, moderator);
          }
      });

      return {
          courierStats: Array.from(couriers.values()).sort((a,b) => b.count - a.count),
          moderatorStats: Array.from(moderators.values()).sort((a,b) => b.count - a.count)
      };

  }, [onHoldOrdersInfo]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'الطلبات المعلقة' : 'On-Hold Orders'} />
        <OnHoldSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الطلبات المعلقة' : 'On-Hold Orders'} />
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المناديب الذين لديهم طلبات معلقة' : 'Couriers with On-Hold Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
                {courierStats.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courierStats.map(c => (
                                <TableRow key={c.name}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-end">{c.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات.' : 'No data.'}</p>}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'الوسطاء الذين لديهم طلبات معلقة' : 'Moderators with On-Hold Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
                 {moderatorStats.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {moderatorStats.map(m => (
                                <TableRow key={m.name}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell className="text-end">{m.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات.' : 'No data.'}</p>}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تفاصيل الطلبات المعلقة' : 'On-Hold Order Details'}</CardTitle>
          <CardDescription>{language === 'ar' ? `إجمالي: ${onHoldOrdersInfo.length} طلبات معلقة` : `Total: ${onHoldOrdersInfo.length} on-hold orders`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                <TableHead>{language === 'ar' ? 'مدة التعليق' : 'On Hold For'}</TableHead>
                <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                <TableHead>{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {onHoldOrdersInfo.map(({ order, duration }) => (
                <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{duration}</TableCell>
                  <TableCell>{order.moderatorName}</TableCell>
                  <TableCell>{order.courierName || '-'}</TableCell>
                </TableRow>
              ))}
              {onHoldOrdersInfo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {language === 'ar' ? 'لا توجد طلبات معلقة حالياً.' : 'No on-hold orders currently.'}
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
