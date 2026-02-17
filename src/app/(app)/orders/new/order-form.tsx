"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";

const orderFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  customerAddress: z.string().min(1, "Customer address is required"),
  zoning: z.string().min(1, "Zoning is required"),
  items: z
    .array(
      z.object({
        productName: z.string().min(1, "Product name is required"),
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
        price: z.coerce.number().min(0, "Price must be a positive number"),
      })
    )
    .min(1, "Order must have at least one item."),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
    onSuccess?: () => void;
}

export function OrderForm({ onSuccess }: OrderFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      zoning: "",
      items: [{ productName: "", quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const total = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);

  function onSubmit(data: OrderFormValues) {
    console.log(data);
    toast({
      title: language === 'ar' ? "تم إنشاء الطلب" : "Order Created",
      description: language === 'ar' ? "تم إنشاء طلب جديد بنجاح." : "A new order has been successfully created.",
    });
    onSuccess?.();
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="customerPhone" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم هاتف العميل' : 'Customer Phone'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="customerAddress" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>{language === 'ar' ? 'العنوان' : 'Address'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'عنوان الشارع' : 'Street Address'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="zoning" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'المنطقة' : 'Zoning'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'مثال: القاهرة, الجيزة' : 'e.g. Cairo, Giza'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
            </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap gap-4 items-start">
                <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel className={index > 0 ? 'sr-only' : ''}>{language === 'ar' ? 'المنتج' : 'Product'}</FormLabel>
                      <FormControl><Input placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                    <FormItem className="w-24">
                       <FormLabel className={index > 0 ? 'sr-only' : ''}>{language === 'ar' ? 'الكمية' : 'Quantity'}</FormLabel>
                      <FormControl><Input type="number" placeholder={language === 'ar' ? 'الكمية' : 'Qty'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                    <FormItem className="w-32">
                       <FormLabel className={index > 0 ? 'sr-only' : ''}>{language === 'ar' ? 'السعر (جنيه)' : 'Price (EGP)'}</FormLabel>
                      <FormControl><Input type="number" placeholder={language === 'ar' ? 'السعر' : 'Price'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <div className={index > 0 ? 'pt-8' : 'pt-2'}>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{language === 'ar' ? 'إزالة عنصر' : 'Remove item'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productName: "", quantity: 1, price: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
          </Button>
          
          <Separator className="my-6" />

          <div className="flex justify-end items-center">
            <p className="text-lg font-semibold">{language === 'ar' ? 'المجموع:' : 'Total:'}</p>
            <p className="text-lg font-semibold ml-4">EGP {total.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit">{language === 'ar' ? 'إنشاء الطلب' : 'Create Order'}</Button>
        </div>
      </form>
    </Form>
  );
}
