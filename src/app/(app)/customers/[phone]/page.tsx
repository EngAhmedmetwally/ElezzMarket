"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Star, Truck } from "lucide-react";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const { language } = useLanguage();

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');
  
  const { customerOrders, customerDetails } = React.useMemo(() => {
    if (!allOrders || !phone) {
        return { customerOrders: [], customerDetails: null };
    }
    
    const ordersForCustomer = allOrders
      .filter(order => order.customerPhone1 === phone)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    if (ordersForCustomer.length === 0) {
      return { customerOrders: [], customerDetails: null };
    }
    
    const firstOrder = ordersForCustomer[0];
    const details = {
      name: firstOrder.customerName,
      facebookName: firstOrder.facebookName,
      phone1: firstOrder.customerPhone1,
      phone2: firstOrder.customerPhone2,
      address: firstOrder.customerAddress,
      zoning: firstOrder.zoning,
    };

    return { customerOrders: ordersForCustomer, customerDetails: details };
  }, [allOrders, phone]);

  const favoriteItems = React.useMemo(() => {
    if (!customerOrders || customerOrders.length === 0) return [];
    
    const itemMap = new Map<string, { name: string; count: number }>();
    
    customerOrders.forEach(order => {
      if (order.status === 'ملغي') return; // Don't count items from cancelled orders
      const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
      items.forEach(item => {
        if (!item.productName) return;
        const existing = itemMap.get(item.productName) || { name: item.productName, count: 0 };
        existing.count += item.quantity;
        itemMap.set(item.productName, existing);
      });
    });
    
    return Array.from(itemMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [customerOrders]);

  const uniqueCouriers = React.useMemo(() => {
    if (!customerOrders || customerOrders.length === 0) return [];
    
    const courierMap = new Map<string, { name: string; id: string }>();
    
    customerOrders.forEach(order => {
      if (order.courierId && order.courierName) {
        courierMap.set(order.courierId, { id: order.courierId, name: order.courierName });
      }
    });
    
    return Array.from(courierMap.values());
  }, [customerOrders]);

  if (isLoading) {
      return (
          <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'تحميل...' : 'Loading...'} />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  if (!customerDetails) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'العميل غير موجود' : 'Customer Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على العميل المطلوب أو ليس لديه طلبات.' : 'The requested customer could not be found or has no orders.'}</p>
      </div>
    );
  }
  
  const getDeliveryTime = (order: Order) => {
    if (order.status === 'مكتمل' && order.statusHistory) {
      const historyArray = Object.values(order.statusHistory);
      const deliveredHistory = historyArray.find(h => h.status === 'مكتمل');
      if (deliveredHistory && deliveredHistory.createdAt) {
        return format(new Date(deliveredHistory.createdAt), "PPP p");
      }
    }
    return language === 'ar' ? 'لم يتم التسليم بعد' : 'Not Delivered Yet';
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  return (
    <div className="space-y-8">
        <PageHeader title={customerDetails.name} />
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {customerDetails.facebookName && <p><span className="font-medium">{language === 'ar' ? 'اسم فيسبوك:' : 'Facebook Name:'}</span> {customerDetails.facebookName}</p>}
                    <p><span className="font-medium">{language === 'ar' ? 'رقم الموبايل 1:' : 'Phone 1:'}</span> {customerDetails.phone1}</p>
                    {customerDetails.phone2 && <p><span className="font-medium">{language === 'ar' ? 'رقم الموبايل 2:' : 'Phone 2:'}</span> {customerDetails.phone2}</p>}
                    <p><span className="font-medium">{language === 'ar' ? 'العنوان:' : 'Address:'}</span> {customerDetails.address}</p>
                    <p><span className="font-medium">{language === 'ar' ? 'المنطقة:' : 'Zoning:'}</span> {customerDetails.zoning}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <CardTitle>{language === 'ar' ? 'الأصناف المفضلة' : 'Favorite Items'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {favoriteItems.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {favoriteItems.map(item => (
                                <li key={item.name} className="flex justify-between">
                                    <span className="font-medium">{item.name}</span>
                                    <Badge variant="secondary">{item.count} {language === 'ar' ? 'قطعة' : 'pcs'}</Badge>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات كافية.' : 'Not enough data.'}</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader className="flex-row items-center gap-2 space-y-0">
                    <Truck className="w-5 h-5 text-primary" />
                    <CardTitle>{language === 'ar' ? 'المناديب' : 'Couriers'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {uniqueCouriers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {uniqueCouriers.map(courier => (
                                <Badge key={courier.id} variant="outline">{courier.name}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا يوجد مناديب مسجلون لهذا العميل.' : 'No couriers recorded for this customer.'}</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'سجل الطلبات' : 'Order History'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{language === 'ar' ? 'تاريخ و وقت التسليم' : 'Delivery Date/Time'}</TableHead>
                            <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                            <TableHead>{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                            <TableHead className="text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerOrders.map(order => (
                            <TableRow 
                              key={order.id} 
                              className="cursor-pointer" 
                              onClick={() => router.push(`/orders/${order.id}`)}
                            >
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell><StatusBadge status={order.status} /></TableCell>
                                <TableCell>{getDeliveryTime(order)}</TableCell>
                                <TableCell>{order.moderatorName}</TableCell>
                                <TableCell>{order.courierName || '-'}</TableCell>
                                <TableCell className="text-end">{formatCurrency(order.total)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
