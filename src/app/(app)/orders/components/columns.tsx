"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Order } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getOrderColumns = (language: 'ar' | 'en'): ColumnDef<Order>[] => [
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
    accessorKey: "customerName",
    header: language === 'ar' ? "العميل" : "Customer",
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
        <div className="flex justify-end w-full">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? "الاجمالي" : "Total"}
            <ArrowUpDown className="ms-2 h-4 w-4" />
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
    accessorKey: "moderatorName",
    header: language === 'ar' ? "المودريتور" : "Moderator",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
       <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? "التاريخ" : "Date"}
            <ArrowUpDown className="ms-2 h-4 w-4" />
          </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
  },
  {
    id: "actions",
    header: () => <div className="text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</div>,
    cell: ({ row }) => {
      return <div className="flex justify-center"><RowActions orderId={row.original.id} /></div>;
    },
  },
];
