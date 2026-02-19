
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
        const customerOrdersIndexRef = ref(database, `customer-orders/${phone}`);
        const indexSnapshot = await get(customerOrdersIndexRef);

        if (!indexSnapshot.exists()) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        const orderIds = Object.keys(indexSnapshot.val());
        const orderPromises = orderIds.map(async (orderId) => {
          const orderRef = ref(database, `orders/${orderId}`);
          const orderSnapshot = await get(orderRef);
          if (orderSnapshot.exists()) {
            return { ...orderSnapshot.val(), id: orderId };
          }
          return null;
        });

        const fetchedOrders = (await Promise.all(orderPromises)).filter(
          (o): o is Order => o !== null
        );

        setOrders(
          fetchedOrders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
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
      facebookName: firstOrder.facebookName,
      phone1: firstOrder.customerPhone1,
      phone2: firstOrder.customerPhone2,
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
        <PageHeader title={customer.name} />

        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {customer.facebookName && <p><span className="font-medium">{language === 'ar' ? 'اسم فيسبوك:' : 'Facebook Name:'}</span> {customer.facebookName}</p>}
                <p><span className="font-medium">{language === 'ar' ? 'رقم الموبايل 1:' : 'Phone 1:'}</span> {customer.phone1}</p>
                {customer.phone2 && <p><span className="font-medium">{language === 'ar' ? 'رقم الموبايل 2:' : 'Phone 2:'}</span> {customer.phone2}</p>}
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
