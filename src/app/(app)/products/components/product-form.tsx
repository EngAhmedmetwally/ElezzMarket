
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Product, ProductHistoryItem } from "@/lib/types";
import { useDatabase, useUser } from "@/firebase";
import { ref, set, push, update, child } from "firebase/database";
import { Switch } from "@/components/ui/switch";

const productFormSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  price: z.coerce.number().min(0, "السعر مطلوب"),
  weight: z.coerce.number().optional(),
  sku: z.string().optional(),
  isActive: z.boolean().default(true),
});
type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  productToEdit?: Product;
}

export function ProductForm({ onSuccess, productToEdit }: ProductFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const database = useDatabase();
  const { user } = useUser();
  const isEditMode = !!productToEdit;
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productToEdit ? {
        name: productToEdit.name,
        price: productToEdit.price,
        weight: productToEdit.weight || undefined,
        sku: productToEdit.sku || "",
        isActive: productToEdit.isActive,
    } : {
      name: "",
      price: 0,
      weight: undefined,
      sku: "",
      isActive: true,
    },
  });

  async function onSubmit(data: ProductFormValues) {
    if (!database || !user) {
      toast({ variant: "destructive", title: "Database error" });
      return;
    }
    
    try {
        if (isEditMode && productToEdit) {
            const productRef = ref(database, `products/${productToEdit.id}`);
            const updates: { [key: string]: any } = {};

            updates[`/products/${productToEdit.id}/name`] = data.name;
            updates[`/products/${productToEdit.id}/price`] = data.price;
            updates[`/products/${productToEdit.id}/weight`] = data.weight || 0;
            updates[`/products/${productToEdit.id}/sku`] = data.sku || "";
            updates[`/products/${productToEdit.id}/isActive`] = data.isActive;
            updates[`/products/${productToEdit.id}/updatedAt`] = new Date().toISOString();

            if (data.price !== productToEdit.price) {
                const historyKey = push(child(productRef, 'history')).key;
                if (historyKey) {
                    updates[`/products/${productToEdit.id}/history/${historyKey}`] = {
                        userId: user.id,
                        userName: user.name || user.email!,
                        createdAt: new Date().toISOString(),
                        field: 'price',
                        oldValue: productToEdit.price,
                        newValue: data.price,
                    } as ProductHistoryItem;
                }
            }

            const oldWeight = productToEdit.weight || 0;
            const newWeight = data.weight || 0;
            if (newWeight !== oldWeight) {
                const historyKey = push(child(productRef, 'history')).key;
                 if (historyKey) {
                    updates[`/products/${productToEdit.id}/history/${historyKey}`] = {
                        userId: user.id,
                        userName: user.name || user.email!,
                        createdAt: new Date().toISOString(),
                        field: 'weight',
                        oldValue: oldWeight,
                        newValue: newWeight,
                    } as ProductHistoryItem;
                }
            }

            await update(ref(database), updates);
            toast({ title: language === 'ar' ? "تم تحديث المنتج" : "Product Updated" });
        } else {
            const newProductRef = push(ref(database, 'products'));
            const newProductData = {
                name: data.name,
                price: data.price,
                weight: data.weight || 0,
                sku: data.sku || "",
                isActive: data.isActive,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await set(newProductRef, newProductData);
            toast({ title: language === 'ar' ? "تمت إضافة المنتج" : "Product Added" });
        }
        onSuccess?.();
    } catch (e: any) {
        toast({ variant: "destructive", title: language === 'ar' ? "خطأ" : "Error", description: e.message });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ar' ? 'مثال: جبنة قريش' : 'e.g. Cottage Cheese'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'السعر' : 'Price'}</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="0.0" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'SKU (اختياري)' : 'SKU (Optional)'}</FormLabel>
              <FormControl>
                <Input placeholder="PROD-123" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">{language === 'ar' ? 'نشط' : 'Active'}</FormLabel>
                        <FormDescription>
                            {language === 'ar' ? 'المنتجات النشطة فقط تظهر في شاشة الطلبات.' : 'Only active products appear in the order screen.'}
                        </FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
            )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : (isEditMode ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة منتج' : 'Add Product'))
              }
          </Button>
        </div>
      </form>
    </Form>
  );
}
