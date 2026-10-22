
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerWithOrderCount } from "../page";
import { RowActions } from "./row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, isAfter, isBefore, format } from "date-fns";
import { useDatabase } from "@/firebase";
import { ref, update } from "firebase/database";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { sendWhatsAppMessage } from "@/app/actions/whatsapp";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DataTableProps<TData extends CustomerWithOrderCount, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function CustomersClient<TData extends CustomerWithOrderCount, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const database = useDatabase();
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'lastOrderDate', desc: true } ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [isBroadcastOpen, setIsBroadcastOpen] = React.useState(false);
  const [broadcastMessage, setBroadcastMessage] = React.useState("");
  const [recencyFilter, setRecencyFilter] = React.useState("all");

  const { language } = useLanguage();
  const isMobile = useIsMobile();

  // Optimized logs fetching using existing pattern
  const { data: whatsappLogs } = useRealtimeCachedCollection<any>('whatsapp-logs');
  const { data: appSettings } = useRealtimeCachedCollection<any>('app-settings');
  const whatsappConfig = appSettings?.find(s => s.id === 'main')?.whatsapp;

  const filteredByRecency = React.useMemo(() => {
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const oneMonthAgo = subDays(now, 30);

    return data.filter(customer => {
      if (recencyFilter === "all") return true;
      
      const lastDateStr = customer.lastOrderDate;
      const lastDate = lastDateStr ? new Date(lastDateStr) : null;

      if (recencyFilter === "week") {
        return lastDate && isAfter(lastDate, oneWeekAgo);
      }
      if (recencyFilter === "month") {
        return lastDate && isAfter(lastDate, oneMonthAgo);
      }
      if (recencyFilter === "inactive") {
        return lastDate && isBefore(lastDate, oneMonthAgo);
      }
      if (recencyFilter === "never") {
        return !lastDate;
      }
      return true;
    });
  }, [data, recencyFilter]);

  const table = useReactTable({
    data: filteredByRecency,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleIndividualWhatsApp = (phone: string, name: string) => {
    const cleanPhone = formatPhoneNumberForWhatsApp(phone);
    const encodedText = encodeURIComponent(broadcastMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  const filters = (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="flex-1">
            <Input
              placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={recencyFilter} onValueChange={setRecencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'تصفية حسب النشاط' : 'Filter by activity'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="week">{language === 'ar' ? 'اشتروا خلال آخر أسبوع' : 'Bought last week'}</SelectItem>
                <SelectItem value="month">{language === 'ar' ? 'اشتروا خلال آخر شهر' : 'Bought last month'}</SelectItem>
                <SelectItem value="inactive">{language === 'ar' ? 'لم يشتروا منذ أكثر من شهر' : 'Inactive > 1 month'}</SelectItem>
                <SelectItem value="never">{language === 'ar' ? 'عملاء بدون طلبات' : 'Customers with no orders'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasSelection && (
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700 shrink-0"
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Zap className="me-2 h-4 w-4" />
            {language === 'ar' 
              ? `إرسال جماعي (${selectedRows.length})` 
              : `Bulk Send (${selectedRows.length})`}
          </Button>
        )}
      </div>
    </div>
  );

  const pagination = (
     <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {language === 'ar' 
            ? `تم تحديد ${selectedRows.length} من ${table.getFilteredRowModel().rows.length}` 
            : `${selectedRows.length} of ${table.getFilteredRowModel().rows.length} selected`}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {language === 'ar' ? 'السابق' : 'Previous'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
        </Button>
      </div>
  );
  
  const handleRowClick = (customer: TData) => {
    router.push(`/customers/${customer.id}`);
  }

  if (isMobile) {
    return (
      <div>
        {filters}
        <div className="space-y-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const customer = row.original;
              const lastLog = whatsappLogs?.find((l: any) => l.id === customer.customerPhone1);
              return (
                <Card 
                  key={row.id} 
                  className={`cursor-pointer transition-colors ${row.getIsSelected() ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-3">
                        <div className="pt-1" onClick={e => e.stopPropagation()}>
                           <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                          />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => handleRowClick(customer)}>
                            <div className="flex items-center gap-2">
                                <div className="font-bold truncate">{customer.customerName}</div>
                                {lastLog && (
                                    <div title={lastLog.sentAt}>
                                        {lastLog.status === 'sent' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                    </div>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">{customer.customerPhone1}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-right">
                                <div className="font-medium">{customer.orderCount} {language === 'ar' ? 'طلبات' : 'orders'}</div>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                                <RowActions customer={customer} />
                            </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="h-24 text-center flex items-center justify-center">
              {language === 'ar' ? 'لا توجد نتائج.' : 'No results.'}
            </div>
          )}
        </div>
        {pagination}
        <BroadcastDialog 
          open={isBroadcastOpen} 
          onOpenChange={setIsBroadcastOpen}
          selectedCustomers={selectedRows.map(r => r.original)}
          message={broadcastMessage}
          onMessageChange={setBroadcastMessage}
          onSend={handleIndividualWhatsApp}
          language={language}
          whatsappConfig={whatsappConfig}
          logs={whatsappLogs}
        />
      </div>
    );
  }

  return (
    <div>
      {filters}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={cell.column.id === 'actions' || cell.column.id === 'select' ? (e) => e.stopPropagation() : undefined}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {language === 'ar' ? 'لا توجد نتائج.' : 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination}
      
      <BroadcastDialog 
        open={isBroadcastOpen} 
        onOpenChange={setIsBroadcastOpen}
        selectedCustomers={selectedRows.map(r => r.original)}
        message={broadcastMessage}
        onMessageChange={setBroadcastMessage}
        onSend={handleIndividualWhatsApp}
        language={language}
        whatsappConfig={whatsappConfig}
        logs={whatsappLogs}
      />
    </div>
  );
}

function BroadcastDialog({ open, onOpenChange, selectedCustomers, message, onMessageChange, onSend, language, whatsappConfig, logs }: any) {
  const [isAutomatedSending, setIsAutomatedSending] = React.useState(false);
  const [sendingProgress, setSendingProgress] = React.useState(0);
  const [sendResults, setSendResults] = React.useState<Record<string, { status: string; error?: string }>>({});
  const database = useDatabase();
  const { toast } = useToast();

  const canUseAutomation = whatsappConfig?.isEnabled && whatsappConfig?.endpoint && whatsappConfig?.token;

  const handleAutomatedSend = async () => {
      if (!database || !canUseAutomation) return;
      
      setIsAutomatedSending(true);
      setSendingProgress(0);
      const results: Record<string, { status: string; error?: string }> = {};

      for (let i = 0; i < selectedCustomers.length; i++) {
          const customer = selectedCustomers[i];
          const phone = customer.customerPhone1;

          try {
              const res = await sendWhatsAppMessage({
                  endpoint: whatsappConfig.endpoint,
                  token: whatsappConfig.token,
                  instanceId: whatsappConfig.instanceId,
                  phone: phone,
                  message: message
              });

              if (res.success) {
                  results[phone] = { status: 'sent' };
                  // Log to database
                  const logRef = ref(database, `whatsapp-logs/${phone}`);
                  update(logRef, {
                      status: 'sent',
                      message: message,
                      sentAt: new Date().toISOString()
                  });
              } else {
                  results[phone] = { status: 'failed', error: res.error };
                  const logRef = ref(database, `whatsapp-logs/${phone}`);
                  update(logRef, {
                      status: 'failed',
                      error: res.error,
                      sentAt: new Date().toISOString()
                  });
              }
          } catch (error: any) {
              results[phone] = { status: 'failed', error: error.message };
          }

          setSendResults({...results});
          setSendingProgress(((i + 1) / selectedCustomers.length) * 100);
          // Small delay to prevent API flooding
          await new Promise(resolve => setTimeout(resolve, 800));
      }

      setIsAutomatedSending(false);
      toast({ title: language === 'ar' ? 'اكتمل الإرسال الجماعي' : 'Bulk Sending Complete' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {language === 'ar' ? 'إرسال رسالة واتساب جماعية' : 'WhatsApp Broadcast'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'يمكنك الإرسال تلقائياً عبر API أو فتح المحادثات يدوياً.' 
              : 'Send automatically via API or open chats manually.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-2">
             <label className="text-sm font-medium flex justify-between">
                <span>{language === 'ar' ? 'نص الرسالة الموحدة' : 'Unified Message'}</span>
                {isAutomatedSending && <span className="text-xs text-primary animate-pulse">{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>}
             </label>
             <Textarea 
               value={message}
               onChange={(e) => onMessageChange(e.target.value)}
               placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
               className="min-h-[100px] resize-none"
               disabled={isAutomatedSending}
             />
          </div>

          {isAutomatedSending && (
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                      <span>{Math.round(sendingProgress)}%</span>
                      <span>{Object.values(sendResults).filter(r => r.status === 'sent').length} / {selectedCustomers.length}</span>
                  </div>
                  <Progress value={sendingProgress} className="h-2" />
              </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden mt-2">
             <label className="text-sm font-medium mb-2">{language === 'ar' ? `قائمة المستلمين (${selectedCustomers.length})` : `Recipients (${selectedCustomers.length})`}</label>
             <ScrollArea className="flex-1 border rounded-md p-2 bg-muted/20">
                <div className="space-y-2">
                   {selectedCustomers.map((customer: any) => {
                     const result = sendResults[customer.customerPhone1];
                     const lastLog = logs?.find((l: any) => l.id === customer.customerPhone1);
                     
                     return (
                         <div key={customer.id} className="flex items-center justify-between p-2 bg-background border rounded-lg shadow-sm">
                            <div className="min-w-0 flex-1 me-4">
                               <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold truncate">{customer.customerName}</p>
                                    {(result || lastLog) && (
                                        <div title={result?.error || lastLog?.sentAt}>
                                            {(result?.status === 'sent' || lastLog?.status === 'sent') ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                                        </div>
                                    )}
                               </div>
                               <p className="text-xs text-muted-foreground">{customer.customerPhone1}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-600/30 hover:bg-green-50 shrink-0 h-8"
                              onClick={() => onSend(customer.customerPhone1, customer.customerName)}
                              disabled={isAutomatedSending}
                            >
                              <WhatsappIcon className="me-2 h-3.5 w-3.5" />
                              {language === 'ar' ? 'يدوي' : 'Manual'}
                            </Button>
                         </div>
                     );
                   })}
                </div>
             </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-background flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isAutomatedSending}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700" 
            onClick={handleAutomatedSend}
            disabled={isAutomatedSending || !canUseAutomation || !message}
          >
            {isAutomatedSending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Zap className="me-2 h-4 w-4" />}
            {language === 'ar' ? 'بدء الإرسال التلقائي' : 'Start Automated Sending'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
