
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerWithOrderCount } from "../page";
import { RowActions } from "./row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export const getCustomerColumns = (language: 'ar' | 'en'): ColumnDef<CustomerWithOrderCount>[] => [
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
    cell: ({ row }) => {
        const customer = row.original;
        return (
            <div className="flex items-center gap-2">
                <div className="flex flex-col">
                    <div className="font-medium">{customer.customerName}</div>
                    {customer.facebookName && <div className="text-xs text-muted-foreground">{customer.facebookName}</div>}
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "customerPhone1",
    header: language === 'ar' ? 'رقم الموبايل' : 'Phone',
    cell: ({ row }) => {
        const phone = row.original.customerPhone1;
        // In a real app we'd use a shared state for logs, but useCollection is cached.
        // We'll add the status indicator here.
        return (
            <div className="flex items-center gap-2">
                <WhatsAppStatusIndicator phone={phone} language={language} />
                <span>{phone}</span>
            </div>
        )
    }
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
                {language === 'ar' ? 'الطلبات' : 'Orders'}
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
    cell: ({ row }) => {
        const date = row.getValue("lastOrderDate");
        return date ? new Date(date as string).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-';
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</div>,
    cell: ({ row }) => {
      return <div className="text-center"><RowActions customer={row.original} /></div>;
    },
  },
];

function WhatsAppStatusIndicator({ phone, language }: { phone: string; language: string }) {
    const { data: logs } = useRealtimeCachedCollection<any>('whatsapp-logs');
    const log = logs?.find((l: any) => l.id === phone);

    if (!log) return null;

    const timeAgo = formatDistanceToNow(new Date(log.sentAt), { 
        addSuffix: true, 
        locale: language === 'ar' ? ar : undefined 
    });

    return (
        <div title={`${log.status === 'sent' ? 'Sent' : 'Failed'}: ${timeAgo}`}>
            {log.status === 'sent' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500" />
            )}
        </div>
    );
}
