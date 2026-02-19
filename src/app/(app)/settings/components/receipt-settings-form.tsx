"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ReceiptSettingsFormProps {
    form: ReturnType<typeof useForm<any>>;
    onSubmit: (data: any) => void;
}

export function ReceiptSettingsForm({ form, onSubmit }: ReceiptSettingsFormProps) {
  const { language } = useLanguage();

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
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
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

            <h4 className="text-md font-medium">{language === 'ar' ? 'بيانات الموظفين' : 'Staff Info'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pl-4 border-l-2 md:border-r-2 rtl:border-r-2 rtl:border-l-0">
                <FormField control={form.control} name="showCourierName" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">{language === 'ar' ? 'إظهار اسم المندوب' : 'Show Courier Name'}</FormLabel></div>
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
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
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
