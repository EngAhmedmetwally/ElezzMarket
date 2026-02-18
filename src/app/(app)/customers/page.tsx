
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
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
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: ordersData, isLoading } = useCollection<Order>(ordersQuery);

  const customers: CustomerWithOrderCount[] = React.useMemo(() => {
    if (!ordersData) return [];
    const customerMap = new Map<string, CustomerWithOrderCount>();
    ordersData.forEach((order: any) => {
      const phone = order.customerPhone;
      if (!phone) return;

      if (customerMap.has(phone)) {
        const existing = customerMap.get(phone)!;
        existing.orderCount += 1;
        // Keep the latest order date
        if (new Date(order.createdAt.toDate()) > new Date(existing.lastOrderDate)) {
           existing.lastOrderDate = order.createdAt.toDate().toISOString();
        }
      } else {
        customerMap.set(phone, {
          id: phone,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerAddress: order.customerAddress,
          zoning: order.zoning,
          orderCount: 1,
          lastOrderDate: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date().toISOString(),
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
