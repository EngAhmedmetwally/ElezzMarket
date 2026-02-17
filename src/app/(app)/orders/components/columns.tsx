
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getOrderColumns = (language: 'ar' | 'en', onUpdate: () => void): ColumnDef<Order>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "id",
    header: language === 'ar' ? "رقم الاوردر" : "Order ID",
  },
  {
    id: "customer",
    accessorFn: (row) => `${row.customerName} ${row.customerPhone}`,
    header: language === 'ar' ? "العميل" : "Customer",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.customerName}</div>
        <div className="text-sm text-muted-foreground">{row.original.customerPhone}</div>
      </div>
    )
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">{language === 'ar' ? "الحالة" : "Status"}</div>,
    cell: ({ row }) => <div className="text-center"><StatusBadge status={row.getValue("status")} /></div>,
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <div className="text-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? "الاجمالي" : "Total"}
            <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        style: "currency",
        currency: "EGP",
      }).format(amount);

      return <div className="text-end font-medium">{formatted}</div>;
    },
  },
   {
    id: "totalCommission",
    accessorFn: (row) => (row.salesCommission || 0) + (row.deliveryCommission || 0),
    header: ({ column }) => {
       return (
        <div className="hidden lg:table-cell text-end">
           <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? "إجمالي العمولة" : "Total Commission"}
            <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
          </Button>
        </div>
       )
    },
    cell: ({ row }) => {
      const totalCommission = (row.original.salesCommission || 0) + (row.original.deliveryCommission || 0);

      if (row.original.status === 'ملغي') {
        return <div className="hidden lg:table-cell text-end font-medium">-</div>;
      }

      const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        style: "currency",
        currency: "EGP",
      }).format(totalCommission);

      return <div className="hidden lg:table-cell text-end font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "moderatorName",
    header: () => <div className="hidden lg:table-cell text-start">{language === 'ar' ? "المودريتور" : "Moderator"}</div>,
    cell: ({ row }) => <div className="hidden lg:table-cell">{row.original.moderatorName}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <div className="hidden md:table-cell">
       <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? "التاريخ" : "Date"}
            <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
          </Button>
      </div>
    ),
    cell: ({ row }) => <div className="hidden md:table-cell">{new Date(row.getValue("createdAt")).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</div>,
    cell: ({ row }) => {
      return <div className="text-center"><RowActions order={row.original} onUpdate={onUpdate} /></div>;
    },
  },
];
