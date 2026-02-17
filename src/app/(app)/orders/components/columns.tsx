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
    header: language === 'ar' ? "الحالة" : "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {language === 'ar' ? "الاجمالي" : "Total"}
          <ArrowUpDown className={language === 'ar' ? 'mr-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"));
      const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        style: "currency",
        currency: "EGP",
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
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
            <ArrowUpDown className={language === 'ar' ? 'mr-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
          </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
  },
  {
    id: "actions",
    header: language === 'ar' ? "الإجراءات" : "Actions",
    cell: ({ row }) => {
      return <RowActions orderId={row.original.id} />;
    },
  },
];
