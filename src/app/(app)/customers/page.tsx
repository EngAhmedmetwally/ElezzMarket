
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useDatabase } from "@/firebase";
import { ref, onValue } from "firebase/database";
import type { Order, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomersClient } from "./components/client";
import { getCustomerColumns } from "./components/columns";

// Let's define a Customer with an ID and orders count
export type CustomerWithOrderCount = Customer & {
  id: string; // using phone as id
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const database = useDatabase();

  const [ordersData, setOrdersData] = React.useState<Order[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!database) return;
    const ordersRootRef = ref(database, 'orders');
    setIsLoading(true);

    const unsubscribe = onValue(ordersRootRef, (snapshot) => {
      const years = snapshot.val();
      const loadedOrders: Order[] = [];
      if (years) {
        Object.keys(years).forEach((year) => {
          const months = years[year];
          Object.keys(months).forEach((month) => {
            const days = months[month];
            Object.keys(days).forEach((day) => {
              const ordersByDay = days[day];
              Object.keys(ordersByDay).forEach((orderId) => {
                const orderData = ordersByDay[orderId];
                loadedOrders.push({
                  ...orderData,
                  id: orderId,
                });
              });
            });
          });
        });
      }
      setOrdersData(loadedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to load orders:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [database]);


  const customers: CustomerWithOrderCount[] = React.useMemo(() => {
    if (!ordersData) return [];
    
    const sortedOrders = [...ordersData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const customerMap = new Map<string, CustomerWithOrderCount>();
    
    sortedOrders.forEach((order: any) => {
      const phone = order.customerPhone;
      if (!phone) return;

      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

      if (customerMap.has(phone)) {
        const existing = customerMap.get(phone)!;
        existing.orderCount += 1;
        if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
           existing.lastOrderDate = orderDate;
        }
      } else {
        customerMap.set(phone, {
          id: phone,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          zoning: order.zoning,
          orderCount: 1,
          lastOrderDate: orderDate,
        });
      }
    });
    return Array.from(customerMap.values());
  }, [ordersData]);

  const columns = getCustomerColumns(language);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'العملاء' : 'Customers'} />
      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>
            <div className="rounded-md border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <CustomersClient data={customers} columns={columns} />
      )}
    </div>
  );
}
