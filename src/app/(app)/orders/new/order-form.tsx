
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
import type { Customer, Product, OrderItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCollection, useDatabase, useUser, useMemoFirebase } from "@/firebase";
import { ref, get, update, push, set, runTransaction } from "firebase/database";

const orderFormSchema = z.object({
  id: z.string().min(1, "رقم الطلب مطلوب"),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  customerPhone: z.string().min(1, "رقم هاتف العميل مطلوب"),
  customerAddress: z.string().min(1, "عنوان العميل مطلوب"),
  zoning: z.string().min(1, "المنطقة مطلوبة"),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
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
  const database = useDatabase();
  const { user } = useUser();

  const customersQuery = useMemoFirebase(() => database ? ref(database, 'customers') : null, [database]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const productsQuery = useMemoFirebase(() => database ? ref(database, 'products') : null, [database]);
  const { data: products } = useCollection<Product>(productsQuery);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      id: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      zoning: "",
      items: [{ productId: "", productName: "", quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [customerSearch, setCustomerSearch] = React.useState("");
  const allCustomers = customers || [];
  
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return [];
    return allCustomers.filter(
      c => (c.customerName && c.customerName.toLowerCase().includes(customerSearch.toLowerCase())) ||
           (c.customerPhone && c.customerPhone.toLowerCase().includes(customerSearch.toLowerCase()))
    );
  }, [customerSearch, allCustomers]);

  const handleCustomerSelect = (customer: Customer & {id: string}) => {
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

  async function onSubmit(data: OrderFormValues) {
    if (!database || !user) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'لا يمكن إنشاء الطلب. يرجى تسجيل الدخول أولاً.' : 'Cannot create order. Please sign in first.',
      });
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const monthYear = `${month}-${year}`;
    const datePath = `${monthYear}/${day}`;

    const orderPath = `orders/${datePath}/${data.id}`;
    const orderIdRef = ref(database, orderPath);
    const snapshot = await get(orderIdRef);
    
    if (snapshot.exists()) {
        form.setError("id", {
            type: "manual",
            message: language === 'ar' ? "رقم الطلب هذا موجود بالفعل في هذا اليوم." : "This Order ID already exists for this day.",
        });
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ في الإدخال' : "Input Error",
            description: language === 'ar' ? "رقم الطلب هذا موجود بالفعل في هذا اليوم. يرجى إدخال رقم مختلف." : "This Order ID already exists for this day. Please enter a different one.",
        });
        return;
    }
    
    const allProducts: (Product & {id: string})[] = products || [];
    const updates: { [key: string]: any } = {};

    try {
        const resolvedItems: OrderItem[] = [];

        await Promise.all(data.items.map(async (item) => {
            let productId = item.productId;
            const existingProduct = allProducts.find(p => p.id === productId || p.name.toLowerCase() === item.productName.toLowerCase());

            if (existingProduct) {
                productId = existingProduct.id;
            } else {
                const newProductRef = push(ref(database, 'products'));
                productId = newProductRef.key!;
                const newProduct: Omit<Product, 'id'> = {
                    name: item.productName,
                    price: item.price,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                    salesCount: 0
                };
                updates[`products/${productId}`] = newProduct;
            }
            
            if (!productId) {
                throw new Error(`Could not determine product ID for ${item.productName}`);
            }

            resolvedItems.push({ ...item, productId });

            const productSalesRef = ref(database, `products/${productId}/salesCount`);
            await runTransaction(productSalesRef, (currentCount) => {
                return (currentCount || 0) + item.quantity;
            });
        }));
        
        const newOrder = {
            id: data.id,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerAddress: data.customerAddress,
            zoning: data.zoning,
            items: resolvedItems,
            total: total,
            status: "تم الحجز",
            moderatorId: user.id,
            moderatorName: user.name || user.email || 'Unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [
                {
                    status: 'تم الحجز',
                    createdAt: new Date().toISOString(),
                    userName: user.name || user.email || 'Unknown',
                }
            ],
            salesCommission: 0,
            deliveryCommission: 0,
        };
        updates[orderPath] = newOrder;
        
        // Add to lookup tables
        updates[`order-lookup/${data.id}`] = { path: datePath };
        updates[`customer-orders/${data.customerPhone}/${data.id}`] = true;

        const customerRef = ref(database, `customers/${data.customerPhone}`);
        const customerSnapshot = await get(customerRef);
        if (!customerSnapshot.exists()) {
            const newCustomer: Customer = {
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                zoning: data.zoning,
            };
            updates[`customers/${data.customerPhone}`] = newCustomer; 
        }

        await update(ref(database), updates);

        toast({
            title: language === 'ar' ? "تم إنشاء الطلب" : "Order Created",
            description: language === 'ar' ? "تم إنشاء طلب جديد بنجاح." : "A new order has been successfully created.",
        });
        onSuccess?.();
        form.reset();
    } catch(e: any) {
        console.error("Order creation failed:", e);
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'فشل إنشاء الطلب' : 'Order Creation Failed',
            description: e.message,
        });
    }
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
                                {filteredCustomers.map((customer) => (
                                    <div 
                                        key={customer.id} 
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
                            const product = products?.find(p => p.name === e.target.value);
                            if (product) {
                                form.setValue(`items.${index}.price`, product.price);
                                form.setValue(`items.${index}.productId`, product.id);
                            } else {
                                form.setValue(`items.${index}.productId`, '');
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

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productId: "", productName: "", quantity: 1, price: 0 })}>
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
        {(products || []).map((product) => (
            <option key={product.id} value={product.name} />
        ))}
      </datalist>
    </Form>
  );
}
