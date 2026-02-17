
"use client";

import * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order, OrderStatus } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";


interface DataTableProps<TData extends Order, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdate: () => void;
}

export function OrdersClient<TData extends Order, TValue>({
  columns,
  data,
  onUpdate
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
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
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 20,
        }
    }
  });

  const orderStatuses: OrderStatus[] = ["تم الحجز", "تم الارسال", "تم التسليم", "ملغي"];

  const filters = (
    <div className="flex flex-wrap items-center gap-4 py-4">
        <Input
          placeholder={language === 'ar' ? 'بحث (رقم طلب, عميل, هاتف)...' : 'Search (ID, customer, phone)...'}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder={language === 'ar' ? "فلترة حسب الحالة" : "Filter by status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? "كل الحالات" : "All Statuses"}</SelectItem>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  );

  const pagination = (
     <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {language === 'ar' ? `تم تحديد ${table.getFilteredSelectedRowModel().rows.length} من ${table.getFilteredRowModel().rows.length} صف.` : `${table.getFilteredSelectedRowModel().rows.length} of ${table.getFilteredRowModel().rows.length} row(s) selected.`}
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

  if (isMobile) {
    return (
      <div>
        {filters}
        <div className="space-y-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const selectCell = row.getVisibleCells().find(cell => cell.column.id === 'select');
              const totalCommission = (row.original.salesCommission || 0) + (row.original.deliveryCommission || 0);
              return (
                <Card key={row.id} data-state={row.getIsSelected() && "selected"} className="data-[state=selected]:bg-muted/50">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-4">
                      {selectCell && flexRender(
                          selectCell.column.columnDef.cell,
                          selectCell.getContext()
                      )}
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
                      <div className="text-sm text-muted-foreground">{row.original.customerPhone}</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex gap-4 items-end">
                        <div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? 'الإجمالي' : 'Total'}</div>
                          <div className="font-bold">
                            {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(row.original.total)}
                          </div>
                        </div>
                        {row.original.status !== 'ملغي' && (
                            <div>
                                <div className="text-xs text-muted-foreground">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</div>
                                <div className="font-bold">
                                  {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(totalCommission)}
                                </div>
                            </div>
                        )}
                      </div>
                      <RowActions order={row.original} onUpdate={onUpdate} />
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
    </div>
  );
}
