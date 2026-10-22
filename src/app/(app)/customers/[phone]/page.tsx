
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Star, Truck } from "lucide-react";
import { useDatabase } from "@/firebase";
import { ref, get, child } from "firebase/database";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const database = useDatabase();
  const { toast } = useToast();
  const { language } = useLanguage();

  const [customerDetails, setCustomerDetails] = React.useState<any>(null);
  const [customerOrders, setCustomerOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Sanitize the phone number
  const phone = React.useMemo(() => {
    const raw = typeof params.phone === 'string' ? decodeURIComponent(params.phone) : '';
    return raw.replace(/\D/g, '');
  }, [params.phone]);

  const fetchData = React.useCallback(async () => {
      if (!database || !phone) return;
      setIsLoading(true);
      try {
          // 1. Fetch Customer Profile
          const custSnap = await get(ref(database, `customers/${phone}`));
          if (!custSnap.exists()) {
              setCustomerDetails(null);
              setIsLoading(false);
              return;
          }
          setCustomerDetails(custSnap.val());

          // 2. Optimized Order Fetching: Use the index to fetch only IDs
          const indexSnap = await get(ref(database, `customer-orders/${phone}`));
          if (indexSnap.exists()) {
              const orderIds = Object.keys(indexSnap.val());
              
              // 3. Fetch each order directly using the path lookup (if available) or individual scan
              const orders: Order[] = [];
              for (const id of orderIds) {
                  const lookupSnap = await get(ref(database, `order-lookup/${id}`));
                  const path = lookupSnap.exists() ? lookupSnap.val() : null;
                  
                  if (path && typeof path === 'string') {
                      const orderSnap = await get(ref(database, path));
                      if (orderSnap.exists()) orders.push({ ...orderSnap.val(), id, path });
                  } else {
                      // Fallback for older orders: we can't easily find nested path without full scan.
                      // For now we prioritize bandwidth and skip old deep-nested orders if path lookup is missing.
                      // In a real prod env, we'd have a flat 'orders' collection or always populate 'order-lookup'.
                  }
              }
              setCustomerOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
      } catch (e: any) {
          toast({ variant: 'destructive', title: "Fetch Error", description: e.message });
      } finally {
          setIsLoading(false);
      }
  }, [database, phone, toast]);

  React.useEffect(() => {
      fetchData();
  }, [fetchData]);

  const favoriteItems = React.useMemo(() => {
    const itemMap = new Map<string, { name: string; count: number }>();
    customerOrders.forEach(order => {
      if (order.status === 'ملغي') return;
      const items: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
      items.forEach((item) => {
        if (!item.productName) return;
        const existing = itemMap.get(item.productName) || { name: item.productName, count: 0 };
        existing.count += item.quantity;
        itemMap.set(item.productName, existing);
      });
    });
    return Array.from(itemMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [customerOrders]);

  const uniqueCouriers = React.useMemo(() => {
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
                <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  if (!customerDetails) {
    return (
      <div className="p-8 text-center space-y-4">
        <PageHeader title={language === 'ar' ? 'العميل غير موجود' : 'Customer Not Found'} />
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg border border-destructive/20 inline-block max-w-2xl mx-auto">
            <p className="text-lg font-bold mb-2">{language === 'ar' ? 'لم نتمكن من العثور على العميل المطلوب.' : 'The requested customer could not be found.'}</p>
            <p className="text-sm opacity-80">Phone: <span className="font-mono bg-background px-2 py-1 rounded">{phone}</span></p>
        </div>
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
  
  return (
    <div className="space-y-8">
        <PageHeader title={customerDetails.customerName} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
                <CardHeader><CardTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-start">
                    {customerDetails.facebookName && <p><span className="font-medium">FB:</span> {customerDetails.facebookName}</p>}
                    <p><span className="font-medium">Phone 1:</span> {customerDetails.customerPhone1}</p>
                    {customerDetails.customerPhone2 && <p><span className="font-medium">Phone 2:</span> {customerDetails.customerPhone2}</p>}
                    <p><span className="font-medium">Address:</span> {customerDetails.customerAddress}</p>
                    <p><span className="font-medium">Zone:</span> {customerDetails.zoning}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0"><Star className="w-5 h-5 text-yellow-500" /><CardTitle>{language === 'ar' ? 'الأصناف المفضلة' : 'Favorite Items'}</CardTitle></CardHeader>
                <CardContent>
                    {favoriteItems.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                            {favoriteItems.map(item => (
                                <li key={item.name} className="flex justify-between"><span className="font-medium">{item.name}</span><Badge variant="secondary">{item.count} pcs</Badge></li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">Not enough data.</p>}
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex-row items-center gap-2 space-y-0"><Truck className="w-5 h-5 text-primary" /><CardTitle>{language === 'ar' ? 'المناديب' : 'Couriers'}</CardTitle></CardHeader>
                <CardContent>
                    {uniqueCouriers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{uniqueCouriers.map(courier => <Badge key={courier.id} variant="outline">{courier.name}</Badge>)}</div>
                    ) : <p className="text-sm text-muted-foreground">No couriers recorded.</p>}
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader><CardTitle>{language === 'ar' ? 'سجل الطلبات' : 'Order History'}</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead><TableHead>Status</TableHead><TableHead>Delivery Date/Time</TableHead><TableHead>Moderator</TableHead><TableHead>Courier</TableHead><TableHead className="text-end">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerOrders.map(order => (
                            <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell><StatusBadge status={order.status} /></TableCell>
                                <TableCell>{getDeliveryTime(order)}</TableCell>
                                <TableCell>{order.moderatorName}</TableCell>
                                <TableCell>{order.courierName || '-'}</TableCell>
                                <TableCell className="text-end">{formatCurrency(order.total, language)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
