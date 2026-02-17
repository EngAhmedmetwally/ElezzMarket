
"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowActionsProps {
  orderId: string;
}

export function RowActions({ orderId }: RowActionsProps) {
  const { language } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{language === 'ar' ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(orderId)}>
          {language === 'ar' ? 'نسخ رقم الطلب' : 'Copy Order ID'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/orders/${orderId}`}>{language === 'ar' ? 'عرض التفاصيل' : 'View details'}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>{language === 'ar' ? 'تحديث الحالة' : 'Update status'}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
          {language === 'ar' ? 'حذف الطلب' : 'Delete order'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
