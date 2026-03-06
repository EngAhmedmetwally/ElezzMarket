
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { User } from "@/lib/types";
import { useDatabase } from "@/firebase";
import { ref, remove, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface RowActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onUpdate: () => void;
}

export function RowActions({ user, onEdit, onUpdate }: RowActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleToggleStatus = async () => {
    if (!database) return;
    const userRef = ref(database, `users/${user.id}`);
    try {
        const newStatus = user.status === 'نشط' ? 'معطل' : 'نشط';
        await update(userRef, { status: newStatus });
        toast({ title: language === 'ar' ? "تم تحديث الحالة" : "Status Updated" });
        onUpdate();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }
  
  const handleDelete = async () => {
    if (!database) return;
    try {
        await remove(ref(database, `users/${user.id}`));
        toast({ title: language === 'ar' ? "تم حذف المستخدم" : "User Deleted" });
        onUpdate();
        setIsDeleteDialogOpen(false);
    } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  // Use delay to prevent pointer-events locking issues from Radix/Shadcn
  const delayedEdit = () => {
    setTimeout(() => onEdit(user), 100);
  };

  const delayedDelete = () => {
    setTimeout(() => setIsDeleteDialogOpen(true), 100);
  };


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
          <DropdownMenuItem onSelect={delayedEdit}>
            <Edit className="me-2 h-4 w-4" />
            <span>{language === 'ar' ? 'تعديل المستخدم' : 'Edit user'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleToggleStatus}>
            {user.status === 'نشط' ? <ToggleLeft className="me-2 h-4 w-4" /> : <ToggleRight className="me-2 h-4 w-4" />}
            <span>{user.status === 'نشط' ? (language === 'ar' ? 'تعطيل' : 'Disable') : (language === 'ar' ? 'تفعيل' : 'Enable')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={delayedDelete}>
            <Trash2 className="me-2 h-4 w-4" />
            <span>{language === 'ar' ? 'حذف المستخدم' : 'Delete user'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' ? `لا يمكن التراجع عن هذا الإجراء. سيتم حذف المستخدم "${user.name}" بشكل دائم.` : `This action cannot be undone. This will permanently delete the user "${user.name}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
