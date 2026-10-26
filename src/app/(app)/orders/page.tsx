
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download, MoreHorizontal } from "lucide-react";
import { OrdersClient } from "./components/client";
import { getOrderColumns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { OrderForm } from "./new/order-form";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DatePicker } from "@/components/ui/datepicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersStatusPieChart } from "./components/orders-status-pie-chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDatabase, useUser, useMemoFirebase } from "@/firebase";
import { ref, query, limitToLast } from "firebase/database";
import type { Order, OrderStatus, Product, ShippingZone, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { subDays } from "date-fns";


export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useUser();
  const database = useDatabase();

  // OPTIMIZATION: Limit RTDB listener to last 500 items at root. 
  // Combined with local IDB cache, this saves massive bandwidth.
  const ordersQuery = useMemoFirebase(() => {
    if (!database) return null;
    return query(ref(database, 'orders'), limitToLast(500));
  }, [database]);

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders', ordersQuery);
  
  // Pre-load essential static data
  useRealtimeCachedCollection<Product>('products');
  useRealtimeCachedCollection<ShippingZone>('shipping-zones');
  useRealtimeCachedCollection<Customer & {id: string}>('customers');

  // Default filter to last 7 days (local filtering on the cached 500 items)
  const [fromDate, setFromDate] = React.useState<Date | undefined>(subDays(new Date(), 7));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [visibleCount, setVisibleCount] = React.useState(25);

  const columns = React.useMemo(() => getOrderColumns(language, () => {}), [language]);
  
  const filteredOrders = React.useMemo(() => {
    if (!allOrders) return [];
    
    let result = [...allOrders];

    // 1. Visibility (Admin/Moderator/Courier)
    if (user) {
        const isAdmin = user.role === 'Admin';
        const canSeeAll = user.orderVisibility === 'all' || (user.role === 'Moderator' && user.orderVisibility !== 'own');

        if (!isAdmin && !canSeeAll) {
             if (user.role === 'Moderator') {
                 result = result.filter(order => order.moderatorId === user.id);
             } else if (user.role === 'Courier') {
                 result = result.filter(order => order.courierId === user.id);
             } else {
                 result = [];
             }
        }
    } else {
        result = [];
    }

    // 2. Date Filter (Local)
    if (fromDate && toDate) {
        const from = fromDate.getTime();
        const to = new Date(toDate).setHours(23, 59, 59, 999);
        result = result.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt).getTime();
            return orderDate >= from && orderDate <= to;
        });
    }

    // 3. Search (Local)
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(order => 
            (order.id && order.id.toLowerCase().includes(lowerSearch)) ||
            (order.customerName && order.customerName.toLowerCase().includes(lowerSearch)) ||
            (order.customerPhone1 && order.customerPhone1.includes(searchTerm)) ||
            (order.facebookName && order.facebookName.toLowerCase().includes(lowerSearch))
        );
    }

    // 4. Status Filter (Local)
    if (statusFilter !== "all") {
        result = result.filter(order => order.status === statusFilter);
    }
    
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allOrders, user, fromDate, toDate, searchTerm, statusFilter]);

  const displayedOrders = React.useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);
  
  const hasMoreOrders = visibleCount < filteredOrders.length;

  const loadMoreOrders = () => setVisibleCount(prev => prev + 25);
  
  const uniqueOrderStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "معلق", "مكتمل", "ملغي"];

  const ordersByStatus = React.useMemo(() => {
    const counts = filteredOrders.reduce((acc, order) => {
        if (order.status) acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const handleTemplateDownload = () => {
    const sheetData = [{ 'رقم الاوردر': '', 'التاريخ': '', 'اسم العميل': '', 'رقم التليفون': '', 'المنطقة': '', 'العنوان بالتفصيل': '', 'الطلبات': '', 'الاجمالي': '', 'المودريتور': '', 'حالة الاوردر': '' }];
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = { Sheets: { 'template': ws }, SheetNames: ['template'] };
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), "orders_import_template.xlsx");
  }

  return (
    <div>
      <PageHeader 
        title={
          language === 'ar' ? (
            <span className="text-orange-600">الطلبات</span>
          ) : (
            <span className="text-orange-600">Orders</span>
          )
        }
      >
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'طلب جديد' : 'New Order'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء طلب جديد' : 'Create New Order'}</DialogTitle>
              <DialogDescription>{language === 'ar' ? 'املأ التفاصيل أدناه لإنشاء طلب جديد.' : 'Fill in the details below to create a new order.'}</DialogDescription>
            </DialogHeader>
            <div className="py-4"><OrderForm onSuccess={() => setIsNewOrderOpen(false)} /></div>
          </DialogContent>
        </Dialog>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><MoreHorizontal className="me-2 h-4 w-4" />{language === 'ar' ? 'إجراءات' : 'Actions'}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => document.getElementById('import-orders')?.click()}>
                    <Upload className="me-2 h-4 w-4" />{language === 'ar' ? 'استيراد' : 'Import'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTemplateDownload}>
                    <Download className="me-2 h-4 w-4" />{language === 'ar' ? 'تحميل قالب' : 'Download Template'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <input type="file" id="import-orders" className="hidden" accept=".xlsx, .xls, .csv" onChange={() => {}} />
      </PageHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 items-start">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1"><DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} /></div>
            <div className="flex-1"><DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} /></div>
          </div>
        </div>
        <Card className="lg:col-span-1">
            <CardHeader className="p-4"><CardTitle className="text-sm font-medium">{language === 'ar' ? 'ملخص الحالات' : 'Status Summary'}</CardTitle></CardHeader>
            <CardContent className="p-4"><OrdersStatusPieChart data={ordersByStatus} /></CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4"><Skeleton className="h-10 w-full max-w-sm" /></div>
            <div className="rounded-md border p-4"><div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div></div>
        </div>
      ) : (
        <>
          <OrdersClient 
            data={displayedOrders} 
            columns={columns} 
            statuses={uniqueOrderStatuses} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onUpdate={() => {}} 
          />
          {hasMoreOrders && (
            <div className="flex justify-center mt-4">
              <Button onClick={loadMoreOrders} variant="outline">{language === 'ar' ? 'تحميل المزيد' : 'Load More'}</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
