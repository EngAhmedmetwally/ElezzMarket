
"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { CustomerWithOrderCount } from "../page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhatsappIcon } from "@/components/icons/whatsapp-icon";
import { formatPhoneNumberForWhatsApp } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface RowActionsProps {
  customer: CustomerWithOrderCount;
}

export function RowActions({ customer }: RowActionsProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const handleWhatsApp = () => {
    if (customer.customerPhone1) {
      const phoneNumber = formatPhoneNumberForWhatsApp(customer.customerPhone1);
      window.open(`https://wa.me/${phoneNumber}`, '_blank', 'noopener,noreferrer');
    }
  };
  
  const viewDetails = () => {
      router.push(`/customers/${customer.id}`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{language === 'ar' ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
           <DropdownMenuItem onSelect={viewDetails}>
            {language === 'ar' ? 'عرض التفاصيل' : 'View details'}
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={handleWhatsApp}>
            <WhatsappIcon className="me-2 h-4 w-4 text-green-500" />
            <span>{language === 'ar' ? 'إرسال واتساب' : 'Send WhatsApp'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
