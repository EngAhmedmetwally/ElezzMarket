
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { useDatabase, useDoc, useMemoFirebase } from "@/firebase";
import { ref, update } from "firebase/database";
import type { ReceiptSettings } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const settingsFormSchema = z.object({
  showLogo: z.boolean().default(true),
  headerText: z.string().optional(),
  showOrderId: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showCustomerName: z.boolean().default(true),
  showCustomerPhone: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showItemsSubtotal: z.boolean().default(true),
  showShippingCost: z.boolean().default(true),
  showGrandTotal: z.boolean().default(true),
  footerText: z.string().optional(),
  showItemWeight: z.boolean().default(false),
  showItemPrice: z.boolean().default(true),
  showItemSubtotal: z.boolean().default(true),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function ReceiptSettingsForm() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();

  const settingsRef = useMemoFirebase(() => database ? ref(database, 'receipt-settings') : null, [database]);
  const { data: currentSettings, isLoading } = useDoc<ReceiptSettings>(settingsRef);
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      showLogo: true,
      headerText: language === 'ar' ? 'سوق العز' : 'ElEzz Market',
      showOrderId: true,
      showDate: true,
      showCustomerName: true,
      showCustomerPhone: true,
      showCustomerAddress: true,
      showItemsSubtotal: true,
      showShippingCost: true,
      showGrandTotal: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      showItemWeight: false,
      showItemPrice: true,
      showItemSubtotal: true,
    },
  });
  
  React.useEffect(() => {
    if (currentSettings) {
        // use form.reset to update form values with data from DB
        const valuesToSet = { ...form.getValues(), ...currentSettings };
        form.reset(valuesToSet);
    }
  }, [currentSettings, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!database || !settingsRef) return;
    try {
      await update(settingsRef, data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الإيصال بنجاح.' : 'Receipt settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }
  
  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <h4 className="text-md font-medium">{language === 'ar' ? 'رأس الإيصال' : 'Header'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showLogo" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">{language === 'ar' ? 'إظهار الشعار' : 'Show Logo'}</FormLabel>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="headerText" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'نص رأس الإيصال' : 'Header Text'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                )}/>
            </div>
            
            <h4 className="text-md font-medium">{language === 'ar' ? 'محتوى الإيصال' : 'Content'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showOrderId" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار رقم الطلب' : 'Show Order ID'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showDate" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار التاريخ' : 'Show Date'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
            </div>

            <h4 className="text-md font-medium">{language === 'ar' ? 'بيانات العميل' : 'Customer Info'}</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showCustomerName" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار اسم العميل' : 'Show Customer Name'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showCustomerPhone" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار هاتف العميل' : 'Show Customer Phone'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showCustomerAddress" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار عنوان العميل' : 'Show Customer Address'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
            </div>

            <h4 className="text-md font-medium">{language === 'ar' ? 'جدول الأصناف' : 'Items Table'}</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showItemWeight" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار وزن الصنف' : 'Show Item Weight'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showItemPrice" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار سعر الوحدة' : 'Show Unit Price'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showItemSubtotal" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار إجمالي الصنف' : 'Show Item Subtotal'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
            </div>

            <h4 className="text-md font-medium">{language === 'ar' ? 'الملخص المالي' : 'Totals Summary'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showItemsSubtotal" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار مجموع المنتجات' : 'Show Items Subtotal'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showShippingCost" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار تكلفة الشحن' : 'Show Shipping Cost'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="showGrandTotal" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار الإجمالي الكلي' : 'Show Grand Total'}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
            </div>

             <h4 className="text-md font-medium">{language === 'ar' ? 'ذيل الإيصال' : 'Footer'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="footerText" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'نص ذيل الإيصال' : 'Footer Text'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                )}/>
            </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>{language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</Button>
        </div>
      </form>
    </Form>
  );
}
