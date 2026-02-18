
"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { User } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddUserForm } from "./add-user-form";


interface RowActionsProps {
  user: User;
  onUpdate: () => void;
}

export function RowActions({ user, onUpdate }: RowActionsProps) {
  const { language } = useLanguage();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
            {language === 'ar' ? 'نسخ معرف المستخدم' : 'Copy User ID'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
            {language === 'ar' ? 'تعديل المستخدم' : 'Edit user'}
          </DropdownMenuItem>
          <DropdownMenuItem>
            {language === 'ar' ? 'عرض التفاصيل' : 'View details'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
            {language === 'ar' ? 'تعطيل المستخدم' : 'Disable user'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {user && <AddUserForm userToEdit={user} onSuccess={handleEditSuccess} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
