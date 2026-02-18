
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useDatabase } from "@/firebase";
import { ref, get } from "firebase/database";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const { language } = useLanguage();
  const database = useDatabase();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!database || !phone) return;
    setIsLoading(true);

    const fetchOrders = async () => {
      try {
        const customerOrdersRef = ref(database, `customer-orders/${phone}`);
        const orderIdsSnapshot = await get(customerOrdersRef);
        if (!orderIdsSnapshot.exists()) {
          setOrders([]);
          setIsLoading(false);
          return;
        }
        const orderIds = Object.keys(orderIdsSnapshot.val());

        const pathPromises = orderIds.map(orderId => get(ref(database, `order-lookup/${orderId}`)));
        const pathSnapshots = await Promise.all(pathPromises);
        const orderPaths = pathSnapshots.map((snap, i) => {
            if(snap.exists()) {
                const { path } = snap.val();
                return `orders/${path}/${orderIds[i]}`;
            }
            return null;
        }).filter((p): p is string => p !== null);

        const orderPromises = orderPaths.map(path => get(ref(database, path)));
        const orderSnapshots = await Promise.all(orderPromises);
        const fetchedOrders = orderSnapshots.map(snap => snap.val() as Order).filter(Boolean);

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [database, phone]);

  const customer = React.useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const firstOrder = orders[0];
    return {
      name: firstOrder.customerName,
      phone: firstOrder.customerPhone,
      address: firstOrder.customerAddress,
      zoning: firstOrder.zoning,
    }
  }, [orders]);

  if (isLoading) {
      return (
          <div>
            <PageHeader title={language === 'ar' ? 'تحميل...' : 'Loading...'} />
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
          </div>
      )
  }

  if (!customer) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'العميل غير موجود' : 'Customer Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على العميل المطلوب أو ليس لديه طلبات.' : 'The requested customer could not be found or has no orders.'}</p>
      </div>
    );
  }
  
  const getDeliveryTime = (order: Order) => {
    if (order.status === 'تم التسليم' && order.statusHistory) {
      const deliveredHistory = Object.values(order.statusHistory).find(h => h.status === 'تم التسليم');
      if (deliveredHistory) {
        return format(new Date(deliveredHistory.createdAt), "PPP p");
      }
    }
    return language === 'ar' ? 'لم يتم التسليم بعد' : 'Not Delivered Yet';
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);


  return (
    <div className="space-y-8">
        <PageHeader title={customer.name} />

        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><span className="font-medium">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {customer.phone}</p>
                <p><span className="font-medium">{language === 'ar' ? 'العنوان:' : 'Address:'}</span> {customer.address}</p>
                <p><span className="font-medium">{language === 'ar' ? 'المنطقة:' : 'Zoning:'}</span> {customer.zoning}</p>
            </CardContent>
        </Card>

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
                        {orders.map(order => (
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
