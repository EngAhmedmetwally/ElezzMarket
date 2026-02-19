
"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import type { Order } from "@/lib/types";

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
  order: Order;
  onUpdate: () => void;
}

export function RowActions({ order, onUpdate }: RowActionsProps) {
  const { language } = useLanguage();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={!order.id}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{language === 'ar' ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
            {language === 'ar' ? 'نسخ رقم الطلب' : 'Copy Order ID'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>{language === 'ar' ? 'عرض التفاصيل' : 'View details'}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
