
"use client";

import * as React from "react";
import { MoreHorizontal, Edit, ToggleLeft, ToggleRight, History } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ProductForm } from "./product-form";
import { useDatabase } from "@/firebase";
import { ref, update } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { ProductHistoryView } from "./product-history";

interface RowActionsProps {
  product: Product;
  onUpdate: () => void;
}

export function RowActions({ product, onUpdate }: RowActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  const handleToggleStatus = async () => {
    if (!database) return;
    const productRef = ref(database, `products/${product.id}`);
    try {
        await update(productRef, { isActive: !product.isActive });
        toast({ title: language === 'ar' ? "تم تحديث الحالة" : "Status Updated" });
        onUpdate();
    } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  // Delay cleanup logic
  const openEdit = () => setTimeout(() => setIsEditDialogOpen(true), 100);
  const openHistory = () => setTimeout(() => setIsHistoryOpen(true), 100);

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
          <DropdownMenuItem onSelect={openEdit}>
            <Edit className="me-2 h-4 w-4" />
            <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openHistory}>
            <History className="me-2 h-4 w-4" />
            <span>{language === 'ar' ? 'سجل التعديلات' : 'History'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleToggleStatus}>
            {product.isActive ? <ToggleLeft className="me-2 h-4 w-4" /> : <ToggleRight className="me-2 h-4 w-4" />}
            <span>{product.isActive ? (language === 'ar' ? 'تعطيل' : 'Deactivate') : (language === 'ar' ? 'تفعيل' : 'Activate')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ProductForm productToEdit={product} onSuccess={handleEditSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجل تعديلات المنتج' : 'Product History'}</DialogTitle>
            <DialogDescription>{product.name}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ProductHistoryView history={product.history} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
