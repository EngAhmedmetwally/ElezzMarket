
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerWithOrderCount } from "../page";

export const getCustomerColumns = (language: 'ar' | 'en'): ColumnDef<CustomerWithOrderCount>[] => [
  {
    accessorKey: "customerName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {language === 'ar' ? 'الاسم' : 'Name'}
          <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.customerName}</div>
        {row.original.facebookName && <div className="text-xs text-muted-foreground">{row.original.facebookName}</div>}
      </div>
    )
  },
  {
    accessorKey: "customerPhone1",
    header: language === 'ar' ? 'رقم الموبايل 1' : 'Phone 1',
  },
  {
    accessorKey: "customerPhone2",
    header: language === 'ar' ? 'رقم الموبايل 2' : 'Phone 2',
  },
  {
    accessorKey: "zoning",
    header: language === 'ar' ? 'المنطقة' : 'Zoning',
  },
  {
    accessorKey: "orderCount",
    header: ({ column }) => {
      return (
        <div className="text-center">
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                {language === 'ar' ? 'عدد الطلبات' : 'Orders'}
                <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
            </Button>
        </div>
      )
    },
    cell: ({ row }) => <div className="text-center">{row.original.orderCount}</div>,
  },
  {
    accessorKey: "lastOrderDate",
    header: ({ column }) => (
       <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? 'آخر طلب' : 'Last Order'}
            <ArrowUpDown className={language === 'ar' ? 'ms-2 h-4 w-4' : 'ml-2 h-4 w-4'} />
          </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("lastOrderDate")).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
  },
];

    