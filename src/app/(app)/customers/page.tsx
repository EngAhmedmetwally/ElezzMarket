
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useDatabase } from "@/firebase";
import type { Order, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomersClient } from "./components/client";
import { getCustomerColumns } from "./components/columns";
import { DatePicker } from "@/components/ui/datepicker";
import { fetchOrdersByDateRange } from "@/lib/data-fetching";

export type CustomerWithOrderCount = Customer & {
  id: string; // using phone1 as id
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const database = useDatabase();
  const [version] = React.useState(0);
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

  const [customers, setCustomers] = React.useState<CustomerWithOrderCount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);


  React.useEffect(() => {
    if (!database || !fromDate || !toDate) return;
    
    setIsLoading(true);
    
    fetchOrdersByDateRange(database, fromDate, toDate).then(allOrders => {
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
        console.error("Error fetching orders for customers page:", error);
        setIsLoading(false);
    });
  }, [database, version, fromDate, toDate]);


  const columns = getCustomerColumns(language);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'العملاء' : 'Customers'} />
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>
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
