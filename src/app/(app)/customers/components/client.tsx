
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

interface DataTableProps<TData extends CustomerWithOrderCount, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function CustomersClient<TData extends CustomerWithOrderCount, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([ { id: 'lastOrderDate', desc: true } ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  const [isBroadcastOpen, setIsBroadcastOpen] = React.useState(false);
  const [broadcastMessage, setBroadcastMessage] = React.useState("");

  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const table = useReactTable({
    data,
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
      <div className="flex-1 max-w-sm">
        <Input
          placeholder={language === 'ar' ? 'فلترة بالاسم أو الهاتف...' : 'Filter by name or phone...'}
          value={globalFilter ?? ""}
          onChange={(event) =>
            setGlobalFilter(event.target.value)
          }
        />
      </div>
      {hasSelection && (
        <Button 
          variant="default" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setIsBroadcastOpen(true)}
        >
          <WhatsappIcon className="me-2 h-4 w-4" />
          {language === 'ar' 
            ? `إرسال رسالة جماعية (${selectedRows.length})` 
            : `WhatsApp Broadcast (${selectedRows.length})`}
        </Button>
      )}
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
                            <div className="font-bold truncate">{customer.customerName}</div>
                            <div className="text-sm text-muted-foreground">{customer.customerPhone1}</div>
                            {customer.customerPhone2 && <div className="text-sm text-muted-foreground">{customer.customerPhone2}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-right">
                                <div className="font-medium">{customer.orderCount} {language === 'ar' ? 'طلبات' : 'orders'}</div>
                                <div className="text-[10px] text-muted-foreground">{language === 'ar' ? 'آخر طلب:' : 'Last:'} {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</div>
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
      />
    </div>
  );
}

function BroadcastDialog({ open, onOpenChange, selectedCustomers, message, onMessageChange, onSend, language }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{language === 'ar' ? 'رسالة واتساب جماعية' : 'WhatsApp Broadcast'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'اكتب الرسالة ثم افتح المحادثات مع العملاء المختارين لإرسالها.' 
              : 'Write message then open chats with selected customers to send.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-2">
             <label className="text-sm font-medium">{language === 'ar' ? 'نص الرسالة الموحدة' : 'Unified Message'}</label>
             <Textarea 
               value={message}
               onChange={(e) => onMessageChange(e.target.value)}
               placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
               className="min-h-[120px] resize-none"
             />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
             <label className="text-sm font-medium mb-2">{language === 'ar' ? `قائمة المستلمين (${selectedCustomers.length})` : `Recipients (${selectedCustomers.length})`}</label>
             <ScrollArea className="flex-1 border rounded-md p-2 bg-muted/20">
                <div className="space-y-2">
                   {selectedCustomers.map((customer: any) => (
                     <div key={customer.id} className="flex items-center justify-between p-2 bg-background border rounded-lg shadow-sm">
                        <div className="min-w-0 flex-1 me-4">
                           <p className="text-sm font-bold truncate">{customer.customerName}</p>
                           <p className="text-xs text-muted-foreground">{customer.customerPhone1}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-600/30 hover:bg-green-50 shrink-0"
                          onClick={() => onSend(customer.customerPhone1, customer.customerName)}
                        >
                          <WhatsappIcon className="me-2 h-3.5 w-3.5" />
                          {language === 'ar' ? 'إرسال' : 'Send'}
                        </Button>
                     </div>
                   ))}
                </div>
             </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
