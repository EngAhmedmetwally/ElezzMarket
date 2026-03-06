
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, Customer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomersClient } from "./components/client";
import { getCustomerColumns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDatabase } from "@/firebase";
import { ref, update } from "firebase/database";

export type CustomerWithOrderCount = Customer & {
  id: string;
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  const { data: allCustomers, isLoading: isLoadingCustomers } = useRealtimeCachedCollection<Customer & {id: string}>('customers');
  
  const isLoading = isLoadingOrders || isLoadingCustomers;

  const customersWithOrderData = React.useMemo((): CustomerWithOrderCount[] => {
    if (!allCustomers || !allOrders) return [];

    const ordersByCustomer = new Map<string, { count: number; lastOrder: string }>();
    
    allOrders.forEach(order => {
        if (!order.customerPhone1) return;
        const existing = ordersByCustomer.get(order.customerPhone1) || { count: 0, lastOrder: '' };
        existing.count++;
        if (!existing.lastOrder || new Date(order.createdAt) > new Date(existing.lastOrder)) {
            existing.lastOrder = order.createdAt;
        }
        ordersByCustomer.set(order.customerPhone1, existing);
    });

    return allCustomers.map(customer => {
      const orderData = ordersByCustomer.get(customer.id);
      return {
        ...customer,
        id: customer.id,
        orderCount: orderData?.count || 0,
        lastOrderDate: orderData?.lastOrder || '',
      };
    });
  }, [allCustomers, allOrders]);

  const columns = getCustomerColumns(language);

  const handleCustomerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!database) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ في قاعدة البيانات' : 'Database Error' });
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            if (json.length === 0) {
                toast({ variant: 'destructive', title: language === 'ar' ? 'ملف فارغ' : 'Empty File' });
                return;
            }

            const existingCustomerPhones = new Set(allCustomers?.map(c => c.id) || []);
            const updates: { [key: string]: any } = {};
            let processedCount = 0;
            let skippedCount = 0;
            let alreadyExistsCount = 0;

            for (const row of json) {
                const phone1 = row.customerPhone1 ? String(row.customerPhone1).trim() : null;
                
                if (!phone1) {
                    skippedCount++;
                    continue;
                }

                if (existingCustomerPhones.has(phone1)) {
                    alreadyExistsCount++;
                    continue;
                }

                const phone2 = row.customerPhone2 ? String(row.customerPhone2).trim() : null;
                
                if (!row.customerName || !row.customerAddress || !row.zoning) {
                    skippedCount++;
                    continue;
                }

                if (phone1.length !== 11) {
                    skippedCount++;
                    continue;
                }
                if (phone2 && phone2.startsWith("01") && phone2.length !== 11) {
                    skippedCount++;
                    continue;
                }

                updates[`customers/${phone1}`] = {
                    customerName: String(row.customerName).trim(),
                    facebookName: row.facebookName ? String(row.facebookName).trim() : "",
                    customerPhone1: phone1,
                    customerPhone2: phone2 || "",
                    customerAddress: String(row.customerAddress).trim(),
                    zoning: String(row.zoning).trim(),
                };
                processedCount++;
                existingCustomerPhones.add(phone1);
            }

            if (processedCount > 0) {
                await update(ref(database), updates);
                toast({
                    title: language === 'ar' ? "اكتمل الاستيراد" : "Import Complete",
                    description: `${language === 'ar' ? 'تمت إضافة' : 'Added'} ${processedCount} ${language === 'ar' ? 'عميل جديد.' : 'new customers.'}`,
                });
            }

            if (alreadyExistsCount > 0) {
                toast({
                    title: language === 'ar' ? 'عملاء تم تخطيهم' : 'Skipped Customers',
                    description: `${language === 'ar' ? 'تم تخطي' : 'Skipped'} ${alreadyExistsCount} ${language === 'ar' ? 'عملاء لأنهم مسجلون بالفعل.' : 'customers as they are already registered.'}`,
                });
            }
            
            if (skippedCount > 0) {
                toast({
                    variant: "destructive",
                    title: language === 'ar' ? 'صفوف تم تخطيها' : 'Rows Skipped',
                    description: `${language === 'ar' ? 'تم تخطي' : 'Skipped'} ${skippedCount} ${language === 'ar' ? 'صفوف بسبب بيانات غير مكتملة أو أرقام هواتف غير صالحة.' : 'rows due to incomplete data or invalid phone numbers.'}`,
                });
            }
            
            if (processedCount === 0 && json.length > 0 && alreadyExistsCount === json.length) {
                // All were duplicates
            } else if (processedCount === 0 && json.length > 0) {
                 toast({
                    variant: "destructive",
                    title: language === 'ar' ? "فشل الاستيراد" : "Import Failed",
                    description: language === 'ar' ? "لم يتم العثور على بيانات عملاء صالحة. يرجى التحقق من الملف." : "No valid customer data found. Please check the file.",
                });
            }

        } catch (error) {
            console.error("Error processing file:", error);
            toast({
                variant: "destructive",
                title: language === 'ar' ? "خطأ في الاستيراد" : "Import Error",
                description: language === 'ar' ? "فشل في معالجة الملف. يرجى التحقق من تنسيق الملف." : "Failed to process file. Please check the file format.",
            });
        } finally {
            if (event.target) {
                event.target.value = ''; // Reset file input
            }
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleTemplateDownload = () => {
    // We only export the headers to serve as a template for import
    const sheetData = [{
        'customerName': '',
        'facebookName': '',
        'customerPhone1': '',
        'customerPhone2': '',
        'customerAddress': '',
        'zoning': '',
    }];

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = { Sheets: { 'template': worksheet }, SheetNames: ['template'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(data, "customers_import_template.xlsx");
  }


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'العملاء' : 'Customers'}>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.getElementById('import-customers')?.click()}>
                <Upload className="me-2 h-4 w-4" />
                {language === 'ar' ? 'استيراد عملاء' : 'Import Customers'}
            </Button>
            <Button variant="outline" onClick={handleTemplateDownload}>
                <Download className="me-2 h-4 w-4" />
                {language === 'ar' ? 'تحميل قالب' : 'Download Template'}
            </Button>
        </div>
        <input
          type="file"
          id="import-customers"
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleCustomerUpload}
        />
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>
            <div className="rounded-md border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <CustomersClient data={customersWithOrderData} columns={columns} />
      )}
    </div>
  );
}
