
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";
import { useLanguage } from "@/components/language-provider";
import type { User } from "@/lib/types";


interface DataTableProps<TData extends User, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onUpdate: () => void;
}

export function UsersClient<TData extends User, TValue>({
  columns,
  data,
  onUpdate,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const filters = (
    <div className="flex items-center py-4">
      <Input
        placeholder={language === 'ar' ? 'فلترة بالاسم...' : 'Filter by name...'}
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
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
              const user = row.original;
              const selectCell = row.getVisibleCells().find(cell => cell.column.id === 'select');
              return (
                <Card key={row.id} data-state={row.getIsSelected() && "selected"} className="data-[state=selected]:bg-muted/50">
                  <CardHeader className="p-4 flex-row items-center gap-4 space-y-0">
                     {selectCell && flexRender(
                          selectCell.column.columnDef.cell,
                          selectCell.getContext()
                      )}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-bold">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.username}</div>
                    </div>
                    <RowActions user={user} onUpdate={onUpdate} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-center">
                    <Badge variant="secondary">{user.role}</Badge>
                    <StatusBadge status={user.status} />
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
                    <TableHead key={header.id} className={header.id === 'actions' ? 'text-center' : ''}>
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
