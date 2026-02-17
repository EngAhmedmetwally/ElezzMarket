"use client";

import * as React from "react";
import { mockOrders } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download } from "lucide-react";
import { OrdersClient } from "./components/client";
import { columns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderForm } from "./new/order-form";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DatePickerWithRange } from "@/components/date-range-picker";
import type { DateRange } from "react-day-picker";

export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const filteredOrders = React.useMemo(() => {
    if (!dateRange?.from) return mockOrders;
    
    const toDate = dateRange.to ? new Date(dateRange.to) : undefined;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    return mockOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (dateRange.from && orderDate < dateRange.from) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
    });
  }, [dateRange]);


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
    const sheetData = mockOrders.map(order => ({
        'رقم الاوردر': order.id,
        'التاريخ': new Date(order.createdAt).toLocaleDateString('ar-EG'),
        'اسم العميل': order.customerName,
        'رقم التليفون': order.customerPhone,
        'المنطقة': order.zoning,
        'العنوان بالتفصيل': order.customerAddress,
        'الطلبات': order.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
        'الاجمالي': order.total,
        'المودريتور': order.moderatorName,
        'حالة الاوردر': order.status,
        'التسليم': order.status,
        'عمولة الحجز': 5, // Mock data
        'عمولة التسليم': 5, // Mock data
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(data, "orders_export.xlsx");
  }


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'الطلبات' : 'Orders'}>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
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
              <OrderForm onSuccess={() => setIsNewOrderOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        <input
          type="file"
          id="import-orders"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
        />
        <Button asChild variant="outline">
            <label htmlFor="import-orders" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'استيراد' : 'Import'}
            </label>
        </Button>
        <Button variant="outline" onClick={handleFileDownload}>
            <Download className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'تصدير' : 'Export'}
        </Button>

      </PageHeader>
      <div className="mb-4">
        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
      </div>
      <OrdersClient data={filteredOrders} columns={columns} />
    </div>
  );
}
