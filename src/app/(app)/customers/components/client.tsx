
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
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const filters = (
    <div className="flex items-center py-4">
      <Input
        placeholder={language === 'ar' ? 'فلترة بالاسم أو الهاتف...' : 'Filter by name or phone...'}
        value={globalFilter ?? ""}
        onChange={(event) =>
          setGlobalFilter(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );

  const pagination = (
     <div className="flex items-center justify-end space-x-2 py-4">
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
                  onClick={() => handleRowClick(customer)}
                  className="cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-bold">{customer.customerName}</div>
                            <div className="text-sm text-muted-foreground">{customer.customerPhone}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-medium">{customer.orderCount} {language === 'ar' ? 'طلبات' : 'orders'}</div>
                            <div className="text-xs text-muted-foreground">{language === 'ar' ? 'آخر طلب:' : 'Last order:'} {new Date(customer.lastOrderDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
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
                  className="cursor-pointer"
                  onClick={() => handleRowClick(row.original)}
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
