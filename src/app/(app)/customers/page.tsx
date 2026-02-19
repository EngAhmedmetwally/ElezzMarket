
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useDatabase } from "@/firebase";
import { ref, get } from "firebase/database";
import type { Order, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomersClient } from "./components/client";
import { getCustomerColumns } from "./components/columns";

export type CustomerWithOrderCount = Customer & {
  id: string; // using phone1 as id
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const database = useDatabase();
  const [version] = React.useState(0);

  const [customers, setCustomers] = React.useState<CustomerWithOrderCount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);


  React.useEffect(() => {
    if (!database) return;
    setIsLoading(true);
    const ordersRef = ref(database, 'orders');
    get(ordersRef).then(snapshot => {
        const allOrders: Order[] = [];
        if (snapshot.exists()) {
            const ordersByMonthYear = snapshot.val();
            Object.keys(ordersByMonthYear).forEach(monthYear => {
                const ordersByDay = ordersByMonthYear[monthYear];
                Object.keys(ordersByDay).forEach(day => {
                    const orders = ordersByDay[day];
                    Object.keys(orders).forEach(orderId => {
                        allOrders.push({ ...orders[orderId], id: orderId });
                    });
                });
            });
        }
        
        const sortedOrders = allOrders.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        const customerMap = new Map<string, CustomerWithOrderCount>();
        
        sortedOrders.forEach((order: any) => {
          const phone = order.customerPhone1;
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
              facebookName: order.facebookName,
              customerPhone1: order.customerPhone1,
              customerPhone2: order.customerPhone2,
              customerAddress: order.customerAddress,
              zoning: order.zoning,
              orderCount: 1,
              lastOrderDate: orderDate,
            });
          }
        });
        setCustomers(Array.from(customerMap.values()));
        setIsLoading(false);
    }).catch(error => {
        console.error("Error fetching all orders for customers page:", error);
        setIsLoading(false);
    });
  }, [database, version]);


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

    