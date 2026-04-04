
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderStatus, OrderItem } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderQuickView } from "./order-quick-view";


interface DataTableProps<TData extends Order, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdate: () => void;
  statuses: OrderStatus[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export function OrdersClient<TData extends Order, TValue>({
  columns,
  data,
  onUpdate,
  statuses,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [previewOrderId, setPreviewOrderId] = React.useState<string | null>(null);
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  // Long Press Detection Logic
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPress = React.useRef(false);

  const onTouchStart = (id: string) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      setPreviewOrderId(id);
    }, 500); // 500ms for long press
  };

  const onTouchEnd = (order: TData) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPress.current) {
      handleRowClick(order);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  const handleRowClick = (order: TData) => {
    const url = order.path
      ? `/orders/${order.id}?path=${encodeURIComponent(order.path)}`
      : `/orders/${order.id}`;
    router.push(url);
  };

  const filters = (
    <div className="flex flex-wrap items-center gap-4 py-4">
        <Input
          placeholder={language === 'ar' ? 'بحث (رقم طلب, عميل, هاتف, فيسبوك)...' : 'Search (ID, customer, phone, facebook)...'}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={onStatusChange}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder={language === 'ar' ? "فلترة حسب الحالة" : "Filter by status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? "كل الحالات" : "All Statuses"}</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  );

  if (isMobile) {
    return (
      <div>
        {filters}
        <div className="space-y-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const selectCell = row.getVisibleCells().find(cell => cell.column.id === 'select');
              const totalCommission = row.original.totalCommission || 0;
              const items: OrderItem[] = Array.isArray(row.original.items) ? row.original.items : Object.values(row.original.items || {});
              
              return (
                <Card 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"} 
                  className="data-[state=selected]:bg-muted/50 cursor-pointer active:scale-[0.98] transition-transform select-none touch-none"
                  onPointerDown={() => onTouchStart(row.original.id)}
                  onPointerUp={() => onTouchEnd(row.original)}
                  onPointerLeave={() => { if(timerRef.current) clearTimeout(timerRef.current); }}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-4">
                       <div onClick={(e) => e.stopPropagation()}>
                        {selectCell && flexRender(
                            selectCell.column.columnDef.cell,
                            selectCell.getContext()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{row.original.id}</div>
                        <div className="text-sm text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
                      </div>
                      <StatusBadge status={row.original.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-4">
                    <div>
                      <div className="font-medium">{row.original.customerName}</div>
                      <div className="text-sm text-muted-foreground">{row.original.customerPhone1}</div>
                      <div className="mt-2 text-xs text-muted-foreground italic line-clamp-1">
                        {items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex gap-4 items-end">
                        <div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</div>
                          <div className="font-bold">
                            {formatCurrency(row.original.total, language)}
                          </div>
                        </div>
                        {row.original.status !== 'ملغي' && (
                            <div>
                                <div className="text-xs text-muted-foreground">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</div>
                                <div className="font-bold">
                                  {formatCurrency(totalCommission, language)}
                                </div>
                            </div>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <RowActions order={row.original} onUpdate={onUpdate} />
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
        <Dialog open={!!previewOrderId} onOpenChange={(open) => !open && setPreviewOrderId(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{language === 'ar' ? 'معاينة سريعة للطلب' : 'Order Quick Preview'}</DialogTitle>
                </DialogHeader>
                {previewOrderId && <OrderQuickView orderId={previewOrderId} onClose={() => setPreviewOrderId(null)} />}
            </DialogContent>
        </Dialog>
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
                  className="cursor-pointer select-none active:bg-muted/80 transition-colors"
                  onPointerDown={() => onTouchStart(row.original.id)}
                  onPointerUp={() => onTouchEnd(row.original)}
                  onPointerLeave={() => { if(timerRef.current) clearTimeout(timerRef.current); }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      onClick={
                        cell.column.id === 'select' || cell.column.id === 'actions' 
                          ? (e) => e.stopPropagation() 
                          : undefined
                      }
                    >
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
      <Dialog open={!!previewOrderId} onOpenChange={(open) => !open && setPreviewOrderId(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>{language === 'ar' ? 'معاينة سريعة للطلب' : 'Order Quick Preview'}</DialogTitle>
              </DialogHeader>
              {previewOrderId && <OrderQuickView orderId={previewOrderId} onClose={() => setPreviewOrderId(null)} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
