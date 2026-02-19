
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import type { Order, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomersClient } from "./components/client";
import { getCustomerColumns } from "./components/columns";
import { DatePicker } from "@/components/ui/datepicker";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

export type CustomerWithOrderCount = Customer & {
  id: string; // using phone1 as id
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

  const { data: allCustomers, isLoading: isLoadingCustomers } = useRealtimeCachedCollection<Customer & {id: string}>('customers');
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const isLoading = isLoadingCustomers || isLoadingOrders;

  const customers: CustomerWithOrderCount[] = React.useMemo(() => {
    if (!allCustomers || !allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    
    const ordersInDateRange = allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });

    const orderStatsMap = new Map<string, { orderCount: number; lastOrderDate: string }>();

    ordersInDateRange.forEach(order => {
        const phone = order.customerPhone1;
        if (!phone) return;

        const stats = orderStatsMap.get(phone) || { orderCount: 0, lastOrderDate: '' };
        stats.orderCount += 1;
        
        const orderDate = new Date(order.createdAt).toISOString();
        if (!stats.lastOrderDate || new Date(orderDate) > new Date(stats.lastOrderDate)) {
            stats.lastOrderDate = orderDate;
        }
        orderStatsMap.set(phone, stats);
    });

    return allCustomers.map((customer) => {
        const stats = orderStatsMap.get(customer.id);
        return {
            ...customer,
            orderCount: stats?.orderCount || 0,
            lastOrderDate: stats?.lastOrderDate || '',
        };
    });

  }, [allCustomers, allOrders, fromDate, toDate]);


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
