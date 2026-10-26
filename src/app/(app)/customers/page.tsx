
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
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDatabase, useMemoFirebase } from "@/firebase";
import { ref, update, query, limitToLast } from "firebase/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CustomerWithOrderCount = Customer & {
  id: string;
  orderCount: number;
  lastOrderDate: string;
};

export default function CustomersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();

  const { data: allCustomers, isLoading: isLoadingCustomers } = useRealtimeCachedCollection<Customer & {id: string}>('customers');
  
  const whatsappQuery = useMemoFirebase(() => {
      if (!database) return null;
      return query(ref(database, 'whatsapp-logs'), limitToLast(300));
  }, [database]);

  const { data: whatsappLogs } = useRealtimeCachedCollection<any>('whatsapp-logs', whatsappQuery);
  
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [exportPassword, setExportPassword] = React.useState("");

  const customersWithOrderData = React.useMemo((): CustomerWithOrderCount[] => {
    if (!allCustomers) return [];

    return allCustomers.map(customer => {
      return {
        ...customer,
        id: customer.id,
        orderCount: customer.orderCount || 0,
        lastOrderDate: customer.lastOrderDate || '',
      };
    });
  }, [allCustomers]);

  const columns = React.useMemo(() => getCustomerColumns(language, whatsappLogs), [language, whatsappLogs]);

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
                // تنظيف رقم الهاتف ليكون أرقام فقط لضمان دقة المفاتيح في قاعدة البيانات
                const phone1 = row.customerPhone1 ? String(row.customerPhone1).replace(/\D/g, '') : null;
                
                if (!phone1) {
                    skippedCount++;
                    continue;
                }

                if (existingCustomerPhones.has(phone1)) {
                    alreadyExistsCount++;
                    continue;
                }

                const phone2 = row.customerPhone2 ? String(row.customerPhone2).replace(/\D/g, '') : "";
                
                if (!row.customerName || !row.customerAddress || !row.zoning) {
                    skippedCount++;
                    continue;
                }

                updates[`customers/${phone1}`] = {
                    customerName: String(row.customerName).trim(),
                    facebookName: row.facebookName ? String(row.facebookName).trim() : "",
                    customerPhone1: phone1,
                    customerPhone2: phone2,
                    customerAddress: String(row.customerAddress).trim(),
                    zoning: String(row.zoning).trim(),
                    orderCount: 0,
                    lastOrderDate: ""
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
        } catch (error) {
            console.error("Error processing file:", error);
            toast({
                variant: "destructive",
                title: language === 'ar' ? "خطأ في الاستيراد" : "Import Error",
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
    const sheetData = [{
        'customerName': '',
        'facebookName': '',
        'customerPhone1': '',
        'customerPhone2': '',
        'customerAddress': '',
        'zoning': '',
    }];

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
    saveAs(data, "customers_import_template.xlsx");
  }

  const handleExport = () => {
    if (exportPassword !== "HamzaEzz") {
      toast({ variant: "destructive", title: language === 'ar' ? "كلمة مرور خاطئة" : "Incorrect Password" });
      return;
    }

    try {
        const exportData = allCustomers?.map(c => ({
            [language === 'ar' ? 'اسم العميل' : 'Customer Name']: c.customerName,
            [language === 'ar' ? 'رقم الهاتف' : 'Phone Number']: c.customerPhone1,
        })) || [];

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
        saveAs(data, `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        setIsExportDialogOpen(false);
        setExportPassword("");
        toast({ title: language === 'ar' ? "تم الاستخراج بنجاح" : "Export Successful" });
    } catch (error) {
        toast({ variant: "destructive", title: language === 'ar' ? "خطأ في الاستخراج" : "Export Error" });
    }
  };


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'العملاء' : 'Customers'}>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                <FileSpreadsheet className="me-2 h-4 w-4" />
                {language === 'ar' ? 'استخراج (Excel)' : 'Export (Excel)'}
            </Button>
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

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{language === 'ar' ? 'تأكيد استخراج البيانات' : 'Confirm Data Export'}</DialogTitle>
                  <DialogDescription>
                      {language === 'ar' ? 'يرجى إدخال كلمة المرور للمتابعة.' : 'Please enter the password to proceed.'}
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                      <Input 
                        type="password" 
                        value={exportPassword} 
                        onChange={(e) => setExportPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleExport()}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                  <Button onClick={handleExport}>{language === 'ar' ? 'تأكيد واستخراج' : 'Confirm & Export'}</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {isLoadingCustomers ? (
        <div className="space-y-4">
            <div className="flex items-center py-4"><Skeleton className="h-10 w-full max-w-sm" /></div>
            <div className="rounded-md border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <CustomersClient data={customersWithOrderData} columns={columns} />
      )}
    </div>
  );
}
