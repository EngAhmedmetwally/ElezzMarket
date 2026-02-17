"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(orderId)}>
          Copy Order ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={`/orders/${orderId}`} passHref>
          <DropdownMenuItem>View details</DropdownMenuItem>
        </Link>
        <DropdownMenuItem>Update status</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Delete order</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
