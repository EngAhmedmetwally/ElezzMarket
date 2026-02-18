
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "./row-actions";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const getUserColumns = (language: 'ar' | 'en', onUpdate: () => void): ColumnDef<User>[] => [
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
    accessorKey: "name",
    header: language === 'ar' ? 'الاسم' : 'Name',
    cell: ({ row }) => {
        const user = row.original;
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="avatar" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "role",
    header: () => <div className="text-center">{language === 'ar' ? 'الدور' : 'Role'}</div>,
    cell: ({ row }) => <div className="text-center"><Badge variant="secondary">{row.getValue("role")}</Badge></div>,
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">{language === 'ar' ? 'الحالة' : 'Status'}</div>,
    cell: ({ row }) => <div className="text-center"><StatusBadge status={row.getValue("status")} /></div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
       <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {language === 'ar' ? 'تاريخ الإنشاء' : 'Date Created'}
            <ArrowUpDown className="ms-2 h-4 w-4" />
          </Button>
    ),
    cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
  },
  {
    id: "actions",
    header: () => <div className="text-center">{language === 'ar' ? "الإجراءات" : "Actions"}</div>,
    cell: ({ row }) => {
      return <div className="flex justify-center"><RowActions user={row.original} onUpdate={onUpdate} /></div>;
    },
  },
];
