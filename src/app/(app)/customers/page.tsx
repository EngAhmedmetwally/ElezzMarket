
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase";
import { ref, query, orderByChild } from "firebase/database";
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

  const ordersQuery = useMemoFirebase(() => {
    if (!database) return null;
    return query(ref(database, "orders"), orderByChild("createdAt"));
  }, [database]);

  const { data: ordersData, isLoading } = useCollection<Order>(ordersQuery);

  const customers: CustomerWithOrderCount[] = React.useMemo(() => {
    if (!ordersData) return [];
    // RTDB orderByChild sorts ascending, so we reverse for descending order by date.
    const sortedOrders = [...ordersData].reverse(); 
    const customerMap = new Map<string, CustomerWithOrderCount>();
    
    sortedOrders.forEach((order: any) => {
      const phone = order.customerPhone;
      if (!phone) return;

      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

      if (customerMap.has(phone)) {
        const existing = customerMap.get(phone)!;
        existing.orderCount += 1;
        // Keep the latest order date
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
