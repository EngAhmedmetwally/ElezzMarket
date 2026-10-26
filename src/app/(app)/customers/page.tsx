
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/components/language-provider";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Customer } from "@/lib/types";
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

  // OPTIMIZATION: Limit RTDB listener to last 1000 items. 
  // Most users only need recent active customers. Permanently cached in IDB.
  const customersQuery = useMemoFirebase(() => {
      if (!database) return null;
      return query(ref(database, 'customers'), limitToLast(1000));
  }, [database]);

  const { data: allCustomers, isLoading: isLoadingCustomers } = useRealtimeCachedCollection<Customer & {id: string}>('customers', customersQuery);
  
  const whatsappQuery = useMemoFirebase(() => {
      if (!database) return null;
      return query(ref(database, 'whatsapp-logs'), limitToLast(300));
  }, [database]);

  const { data: whatsappLogs } = useRealtimeCachedCollection<any>('whatsapp-logs', whatsappQuery);
  
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [exportPassword, setExportPassword] = React.useState("");

  const customersWithOrderData = React.useMemo((): CustomerWithOrderCount[] => {
    if (!allCustomers) return [];
    return allCustomers.map(customer => ({
        ...customer,
        id: customer.id,
        orderCount: customer.orderCount || 0,
        lastOrderDate: customer.lastOrderDate || '',
    }));
  }, [allCustomers]);

  const columns = React.useMemo(() => getCustomerColumns(language, whatsappLogs), [language, whatsappLogs]);

  const handleCustomerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!database) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json: any[] = XLSX.utils.sheet_to_json(sheet);
            
            if (json.length === 0) return;

            const existingPhones = new Set(allCustomers?.map(c => c.id) || []);
            const updates: { [key: string]: any } = {};
            let count = 0;

            for (const row of json) {
                const p1 = row.customerPhone1 ? String(row.customerPhone1).replace(/\D/g, '') : null;
                if (!p1 || existingPhones.has(p1)) continue;

                updates[`customers/${p1}`] = {
                    customerName: String(row.customerName).trim(),
                    facebookName: row.facebookName ? String(row.facebookName).trim() : "",
                    customerPhone1: p1,
                    customerPhone2: row.customerPhone2 ? String(row.customerPhone2).replace(/\D/g, '') : "",
                    customerAddress: String(row.customerAddress || '').trim(),
                    zoning: String(row.zoning || '').trim(),
                    orderCount: 0,
                    lastOrderDate: ""
                };
                count++;
                existingPhones.add(p1);
            }

            if (count > 0) {
                await update(ref(database), updates);
                toast({ title: language === 'ar' ? "تم الاستيراد" : "Import Done", description: `${count} customers added.` });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error" });
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'العملاء' : 'Customers'}>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}><FileSpreadsheet className="me-2 h-4 w-4" />{language === 'ar' ? 'استخراج' : 'Export'}</Button>
            <Button variant="outline" onClick={() => document.getElementById('imp-cust')?.click()}><Upload className="me-2 h-4 w-4" />{language === 'ar' ? 'استيراد' : 'Import'}</Button>
        </div>
        <input type="file" id="imp-cust" className="hidden" onChange={handleCustomerUpload} />
      </PageHeader>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent>
              <DialogHeader><DialogTitle>Export Data</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4"><Label>Password</Label><Input type="password" value={exportPassword} onChange={(e) => setExportPassword(e.target.value)} /></div>
              <DialogFooter><Button onClick={() => { if(exportPassword === "HamzaEzz") { toast({title: "Exporting..."}); setIsExportDialogOpen(false); } }}>Confirm</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      {isLoadingCustomers ? (
        <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm"/><Skeleton className="h-64 w-full"/></div>
      ) : (
        <CustomersClient data={customersWithOrderData} columns={columns} />
      )}
    </div>
  );
}
