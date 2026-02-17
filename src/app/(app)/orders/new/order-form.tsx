
"use client";

import * as React from "react";
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
import { mockOrders, mockProducts, mockCustomers } from "@/lib/data";
import type { Customer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const orderFormSchema = z.object({
  id: z.string().min(1, "رقم الطلب مطلوب"),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z.string().min(1, "رقم هاتف العميل مطلوب"),
  customerAddress: z.string().min(1, "عنوان العميل مطلوب"),
  zoning: z.string().min(1, "المنطقة مطلوبة"),
  items: z
    .array(
      z.object({
        productName: z.string().min(1, "اسم المنتج مطلوب"),
        quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
        price: z.coerce.number().min(0, "السعر يجب أن يكون رقمًا موجبًا"),
      })
    )
    .min(1, "يجب أن يحتوي الطلب على عنصر واحد على الأقل."),
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
      id: "",
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

  const [customerSearch, setCustomerSearch] = React.useState("");
  
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return [];
    return mockCustomers.filter(
      c => c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
           c.customerPhone.includes(customerSearch)
    );
  }, [customerSearch]);

  const handleCustomerSelect = (customer: Customer) => {
    form.setValue("customerName", customer.customerName);
    form.setValue("customerPhone", customer.customerPhone);
    form.setValue("customerAddress", customer.customerAddress);
    form.setValue("zoning", customer.zoning);
    setCustomerSearch(""); 
  };


  const watchedItems = form.watch("items");
  const total = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  const customerNameValue = form.watch("customerName");
  
  React.useEffect(() => {
      setCustomerSearch(customerNameValue);
  }, [customerNameValue]);

  function onSubmit(data: OrderFormValues) {
    if (mockOrders.some(order => order.id.toLowerCase() === data.id.toLowerCase())) {
        form.setError("id", {
            type: "manual",
            message: language === 'ar' ? "رقم الطلب هذا موجود بالفعل." : "This Order ID already exists.",
        });
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ في الإدخال' : "Input Error",
            description: language === 'ar' ? "رقم الطلب هذا موجود بالفعل. يرجى إدخال رقم مختلف." : "This Order ID already exists. Please enter a different one.",
        });
        return;
    }
    
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
        <div className="grid md:grid-cols-2 gap-4">
           <FormField control={form.control} name="id" render={({ field }) => (
                <FormItem>
                <FormLabel>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</FormLabel>
                <FormControl><Input placeholder={language === 'ar' ? 'أدخل رقم الطلب' : 'Enter Order ID'} {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}/>
        </div>
        
        <div>
            <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</h3>
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="relative">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder={language === 'ar' ? 'ابحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'} 
                                {...field} 
                                autoComplete="off"
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    {filteredCustomers.length > 0 && customerSearch && (
                        <Card className="absolute z-10 w-full mt-1 shadow-lg">
                            <CardContent className="p-2 max-h-60 overflow-y-auto">
                                {filteredCustomers.map((customer, index) => (
                                    <div 
                                        key={index} 
                                        className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                        onClick={() => handleCustomerSelect(customer)}
                                    >
                                        <p className="font-medium">{customer.customerName}</p>
                                        <p className="text-muted-foreground">{customer.customerPhone}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                 </div>

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
                      <FormLabel className={cn(index > 0 && 'sr-only')}>{language === 'ar' ? 'المنتج' : 'Product'}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} 
                          {...field}
                          list="product-list"
                          onChange={(e) => {
                            field.onChange(e);
                            const product = mockProducts.find(p => p.name === e.target.value);
                            if (product) {
                                form.setValue(`items.${index}.price`, product.price);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                    <FormItem className="w-24">
                       <FormLabel className={cn(index > 0 && 'sr-only')}>{language === 'ar' ? 'الكمية' : 'Quantity'}</FormLabel>
                      <FormControl><Input type="number" placeholder={language === 'ar' ? 'الكمية' : 'Qty'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                    <FormItem className="w-32">
                       <FormLabel className={cn(index > 0 && 'sr-only')}>{language === 'ar' ? 'السعر (جنيه)' : 'Price (EGP)'}</FormLabel>
                      <FormControl><Input type="number" placeholder={language === 'ar' ? 'السعر' : 'Price'} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <div className={cn('pt-2', index > 0 && 'md:pt-8')}>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{language === 'ar' ? 'إزالة عنصر' : 'Remove item'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productName: "", quantity: 1, price: 0 })}>
            <PlusCircle className="me-2 h-4 w-4" />
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
      <datalist id="product-list">
        {mockProducts.map((product) => (
            <option key={product.id} value={product.name} />
        ))}
      </datalist>
    </Form>
  );
}
