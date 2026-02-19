
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
import { useUser } from "@/firebase";
import { useCachedCollection } from "@/hooks/use-cached-collection";
import type { Order, OrderStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useUser();
  const { data: allOrders, isLoading, refetch } = useCachedCollection<Order>('orders');
  
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

  const handleUpdate = () => refetch();

  const columns = getOrderColumns(language, handleUpdate);
  
  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    
    let dateFiltered = allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });

    if (user) {
        const isAdmin = user.role === 'Admin';
        // A user can see all if they are explicitly set to 'all'.
        // Or if they are a Moderator and their visibility is NOT explicitly set to 'own'.
        // This makes 'all' the default for moderators if the property is missing or not 'own'.
        const canSeeAll = user.orderVisibility === 'all' || (user.role === 'Moderator' && user.orderVisibility !== 'own');

        if (!isAdmin && !canSeeAll) {
             if (user.role === 'Moderator') {
                 dateFiltered = dateFiltered.filter(order => order.moderatorId === user.id);
             } else if (user.role === 'Courier') {
                 dateFiltered = dateFiltered.filter(order => order.courierId === user.id);
             } else {
                 dateFiltered = [];
             }
        }
    } else {
        dateFiltered = [];
    }
    
    return [...dateFiltered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, user, fromDate, toDate]);

  
  const uniqueOrderStatuses = React.useMemo(() => {
    const definedStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];
    return definedStatuses;
  }, []);

  const ordersByStatus = React.useMemo(() => {
    const statusCounts = filteredOrders.reduce((acc, order) => {
        if (order.status) {
          acc[order.status] = (acc[order.status] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            console.log(json); // In a real app, you would process this data
            toast({
                title: language === 'ar' ? "اكتمل التحميل" : "Upload Complete",
                description: language === 'ar' ? `تمت معالجة ${json.length} من الطلبات.` : `Processed ${json.length} orders.`,
            });
        } catch (error) {
            console.error("Error processing file:", error);
            toast({
                variant: "destructive",
                title: language === 'ar' ? "خطأ في التحميل" : "Upload Error",
                description: language === 'ar' ? "فشل في معالجة الملف. يرجى التحقق من تنسيق الملف." : "Failed to process file. Please check the file format.",
            });
        }
      };
      reader.readAsBinaryString(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handleFileDownload = () => {
    if (!filteredOrders) return;
    const sheetData = filteredOrders.map(order => ({
        'رقم الاوردر': order.id,
        'التاريخ': order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : '',
        'اسم العميل': order.customerName,
        'رقم التليفون': order.customerPhone1,
        'المنطقة': order.zoning,
        'العنوان بالتفصيل': order.customerAddress,
        'الطلبات': (order.items || []).map(i => `${i.productName} (x${i.quantity})`).join(', '),
        'الاجمالي': order.total,
        'المودريتور': order.moderatorName,
        'حالة الاوردر': order.status,
        'التسليم': order.status,
        'عمولة الحجز': order.totalCommission || 0, // Placeholder, logic needed
        'عمولة التسليم': 0, // Placeholder, logic needed
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(data, "orders_export.xlsx");
  }

  const handleNewOrderSuccess = () => {
    setIsNewOrderOpen(false);
    handleUpdate();
  };

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'الطلبات' : 'Orders'}>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'طلب جديد' : 'New Order'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء طلب جديد' : 'Create New Order'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'املأ التفاصيل أدناه لإنشاء طلب جديد.' : 'Fill in the details below to create a new order.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <OrderForm onSuccess={handleNewOrderSuccess} />
            </div>
          </DialogContent>
        </Dialog>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <MoreHorizontal className="me-2 h-4 w-4" />
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => document.getElementById('import-orders')?.click()}>
                    <Upload className="me-2 h-4 w-4" />
                    {language === 'ar' ? 'استيراد' : 'Import'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFileDownload}>
                    <Download className="me-2 h-4 w-4" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <input
          type="file"
          id="import-orders"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
        />
      </PageHeader>
      
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-3 grid sm:grid-cols-2 gap-4">
          <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
          <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        </div>
        <Card className="md:col-span-1">
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'ملخص الحالات' : 'Status Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex justify-center items-center">
                 <OrdersStatusPieChart data={ordersByStatus} />
            </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="h-10 w-full max-w-xs ml-4" />
            </div>
            <div className="rounded-md border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <OrdersClient data={filteredOrders} columns={columns} onUpdate={handleUpdate} statuses={uniqueOrderStatuses} />
      )}
    </div>
  );
}
