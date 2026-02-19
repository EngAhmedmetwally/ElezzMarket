
'use client';

import * as React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/components/language-provider';
import { useRealtimeCachedCollection } from '@/hooks/use-realtime-cached-collection';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

type ProductOrder = {
  orderId: string;
  customerName: string;
  customerPhone1: string;
  createdAt: string;
  quantity: number;
  weight?: number;
};

function ProductOrdersSkeleton() {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
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

export default function ProductOrdersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();

  const productName = React.useMemo(() => {
    const name = params.productName;
    return typeof name === 'string' ? decodeURIComponent(name) : '';
  }, [params.productName]);

  const fromDate = React.useMemo(() => {
    const from = searchParams.get('from');
    return from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }, [searchParams]);

  const toDate = React.useMemo(() => {
    const to = searchParams.get('to');
    return to ? new Date(to) : new Date();
  }, [searchParams]);

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const productOrders = React.useMemo(() => {
    if (!allOrders || !productName || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);

    const allOrdersInRange = allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });

    const filtered = allOrdersInRange.filter(order => {
      const itemsArray = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
      return itemsArray.some(item => item.productName === productName);
    });

    const result: ProductOrder[] = filtered.map(order => {
      const itemsArray = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
      const relevantItem = itemsArray.find(item => item.productName === productName)!;
      return {
        orderId: order.id,
        customerName: order.customerName,
        customerPhone1: order.customerPhone1,
        createdAt: order.createdAt,
        quantity: relevantItem.quantity,
        weight: relevantItem.weight,
      };
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;

  }, [allOrders, productName, fromDate, toDate]);

  const totalQuantity = productOrders.reduce((sum, order) => sum + order.quantity, 0);
  const totalWeight = productOrders.reduce((sum, order) => sum + ((order.weight || 0) * order.quantity), 0);

  if (isLoading) {
    return (
        <div>
          <PageHeader title={`${language === 'ar' ? 'تحميل طلبات المنتج...' : 'Loading Product Orders...'}`} />
          <ProductOrdersSkeleton />
        </div>
      );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={`${language === 'ar' ? 'طلبات المنتج:' : 'Orders for:'} ${productName}`} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{productOrders.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الكمية المباعة' : 'Total Quantity Sold'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalQuantity}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الوزن المباع (كجم)' : 'Total Weight Sold (kg)'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalWeight.toFixed(2)}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة الطلبات' : 'Orders List'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                <TableHead>{language === 'ar' ? 'العميل' : 'Customer'}</TableHead>
                <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                <TableHead className="text-center">{language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productOrders.map((order) => (
                <TableRow key={order.orderId} className="cursor-pointer" onClick={() => router.push(`/orders/${order.orderId}`)}>
                  <TableCell className="font-medium">{order.orderId}</TableCell>
                  <TableCell>
                      <div>{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">{order.customerPhone1}</div>
                  </TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'PPP')}</TableCell>
                  <TableCell className="text-center">{order.quantity}</TableCell>
                  <TableCell className="text-center">{order.weight ? `${(order.weight * order.quantity).toFixed(2)}` : '-'}</TableCell>
                </TableRow>
              ))}
              {productOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {language === 'ar' ? 'لا توجد طلبات لهذا المنتج في الفترة المحددة.' : 'No orders for this product in the selected period.'}
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
