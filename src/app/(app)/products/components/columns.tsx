
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RowActions } from "./row-actions";
import { formatCurrency } from "@/lib/utils";

export const getProductColumns = (language: 'ar' | 'en', onUpdate: () => void): ColumnDef<Product>[] => {
  
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={ table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate") }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {language === 'ar' ? 'الاسم' : 'Name'}
          <ArrowUpDown className="ms-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <div className="text-end">
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {language === 'ar' ? 'السعر' : 'Price'}
            <ArrowUpDown className="ms-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-end">{formatCurrency(row.original.price, language)}</div>,
    },
    {
      accessorKey: "weight",
      header: () => <div className="text-center">{language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}</div>,
      cell: ({ row }) => <div className="text-center">{row.original.weight || '-'}</div>,
    },
    {
      accessorKey: "salesCount",
      header: ({ column }) => (
        <div className="text-center">
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {language === 'ar' ? 'الكمية المباعة (عدد)' : 'Sold Qty (Count)'}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{row.original.salesCount || 0}</div>,
    },
    {
      accessorKey: "soldWeight",
      header: ({ column }) => (
        <div className="text-center">
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              {language === 'ar' ? 'الوزن المباع (كجم)' : 'Sold Weight (kg)'}
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-center font-medium">{(row.original.soldWeight || 0).toFixed(2)}</div>,
    },
    {
      accessorKey: "sku",
      header: language === 'ar' ? 'SKU' : 'SKU',
      cell: ({ row }) => row.original.sku || '-',
    },
    {
      accessorKey: "isActive",
      header: () => <div className="text-center">{language === 'ar' ? 'الحالة' : 'Status'}</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant={row.original.isActive ? 'default' : 'destructive'} className={row.original.isActive ? "bg-green-600 hover:bg-green-600/90" : ""}>
            {row.original.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RowActions product={row.original} onUpdate={onUpdate} />
        </div>
      ),
    },
  ];
};
