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
import type { Customer, Product, OrderItem, ShippingZone, Commission } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCollection, useDatabase, useUser, useMemoFirebase } from "@/firebase";
import { ref, get, update, push, set, runTransaction } from "firebase/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const orderFormSchema = z.object({
  id: z.string().min(1, "رقم الطلب مطلوب"),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  facebookName: z.string().optional(),
  customerPhone1: z.string().min(1, "رقم الموبايل 1 مطلوب"),
  customerPhone2: z.string().optional(),
  customerAddress: z.string().min(1, "العنوان بالتفصيل مطلوب"),
  zoning: z.string().min(1, "المنطقة مطلوبة"),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        productName: z.string().min(1, "اسم المنتج مطلوب"),
        quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
        price: z.coerce.number().min(0, "السعر يجب أن يكون رقمًا موجبًا"),
        weight: z.coerce.number().optional(),
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
  
  const shippingZonesQuery = useMemoFirebase(() => database ? ref(database, 'shipping-zones') : null, [database]);
  const { data: shippingZones, isLoading: isLoadingZones } = useCollection<ShippingZone>(shippingZonesQuery);

  const [selectedZone, setSelectedZone] = React.useState<ShippingZone | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      id: "",
      customerName: "",
      facebookName: "",
      customerPhone1: "",
      customerPhone2: "",
      customerAddress: "",
      zoning: "",
      items: [{ productId: "", productName: "", quantity: 1, price: 0, weight: undefined }],
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
      (c: any) =>
        (c.customerName && c.customerName.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.customerPhone1 && c.customerPhone1.includes(customerSearch)) ||
        (c.customerPhone2 && c.customerPhone2.includes(customerSearch))
    );
  }, [customerSearch, allCustomers]);

  const handleCustomerSelect = (customer: Customer & {id: string}) => {
    form.setValue("customerName", customer.customerName);
    form.setValue("facebookName", customer.facebookName || "");
    form.setValue("customerPhone1", customer.customerPhone1);
    form.setValue("customerPhone2", customer.customerPhone2 || "");
    form.setValue("customerAddress", customer.customerAddress);
    form.setValue("zoning", customer.zoning);
    const zone = shippingZones?.find(z => z.name === customer.zoning);
    setSelectedZone(zone || null);
    setCustomerSearch(""); 
  };


  const watchedItems = form.watch("items");
  const itemsTotal = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  const shippingCost = selectedZone?.cost || 0;
  const total = itemsTotal + shippingCost;
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
    const orderIdRef = ref(database, `order-lookup/${data.id}`);
    const snapshot = await get(orderIdRef);
    
    if (snapshot.exists()) {
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
    
    const allProducts: (Product & {id: string})[] = products || [];
    const updates: { [key: string]: any } = {};

    try {
        const commissionRulesSnap = await get(ref(database, 'commission-rules'));
        const commissionRules = commissionRulesSnap.val();
        const registrationCommissionAmount = commissionRules?.["تم التسجيل"]?.amount || 0;
        let totalCommission = 0;

        if (registrationCommissionAmount > 0) {
            const newCommissionRef = push(ref(database, 'commissions'));
            const commissionId = newCommissionRef.key;
            if (!commissionId) throw new Error("Could not create commission ID");

            const newCommission: Commission = {
                id: commissionId,
                orderId: data.id,
                userId: user.id, // The moderator creating it
                orderStatus: "تم التسجيل",
                amount: registrationCommissionAmount,
                calculationDate: new Date().toISOString(),
                paymentStatus: 'Calculated',
            };
            updates[`commissions/${commissionId}`] = newCommission;
            totalCommission += registrationCommissionAmount;
        }

        const resolvedItems: OrderItem[] = [];

        for (const item of data.items) {
            let productId = item.productId;
            const existingProduct = allProducts.find(p => p.id === productId || p.name.toLowerCase() === item.productName.toLowerCase());

            if (existingProduct) {
                productId = existingProduct.id;
                const productSalesRef = ref(database, `products/${productId}/salesCount`);
                await runTransaction(productSalesRef, (currentCount) => {
                    return (currentCount || 0) + item.quantity;
                });
            } else {
                const newProductRef = push(ref(database, 'products'));
                productId = newProductRef.key!;
                const newProductData: Omit<Product, 'id'> & {salesCount: number} = {
                    name: item.productName,
                    price: item.price,
                    weight: item.weight,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                    salesCount: item.quantity
                };
                updates[`products/${productId}`] = newProductData;
            }
            
            if (!productId) {
                throw new Error(`Could not determine product ID for ${item.productName}`);
            }

            resolvedItems.push({ ...item, productId });
        }
        
        const newOrder = {
            id: data.id,
            customerName: data.customerName,
            facebookName: data.facebookName,
            customerPhone1: data.customerPhone1,
            customerPhone2: data.customerPhone2,
            customerAddress: data.customerAddress,
            zoning: data.zoning,
            items: resolvedItems,
            shippingCost,
            total,
            status: "تم التسجيل",
            moderatorId: user.id,
            moderatorName: user.name || user.email || 'Unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [
                {
                    status: 'تم التسجيل',
                    createdAt: new Date().toISOString(),
                    userName: user.name || user.email || 'Unknown',
                }
            ],
            totalCommission: totalCommission,
        };
        updates[orderPath] = newOrder;
        
        updates[`order-lookup/${data.id}`] = { path: datePath };
        updates[`customer-orders/${data.customerPhone1}/${data.id}`] = true;

        const customerRef = ref(database, `customers/${data.customerPhone1}`);
        const customerSnapshot = await get(customerRef);
        if (!customerSnapshot.exists()) {
            const newCustomer: Customer = {
                customerName: data.customerName,
                facebookName: data.facebookName,
                customerPhone1: data.customerPhone1,
                customerPhone2: data.customerPhone2,
                customerAddress: data.customerAddress,
                zoning: data.zoning,
            };
            updates[`customers/${data.customerPhone1}`] = newCustomer; 
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
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

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
                 <div className="relative md:col-span-2">
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
                                {filteredCustomers.map((customer: any) => (
                                    <div 
                                        key={customer.id} 
                                        className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                        onClick={() => handleCustomerSelect(customer)}
                                    >
                                        <p className="font-medium">{customer.customerName}</p>
                                        <p className="text-muted-foreground">{customer.customerPhone1}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                 </div>
                 <FormField control={form.control} name="facebookName" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'اسم فيسبوك' : 'Facebook Name'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'اسم الملف الشخصي على فيسبوك' : 'Facebook profile name'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="customerPhone1" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم الموبايل 1' : 'Phone Number 1'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'رقم الموبايل الأساسي' : 'Primary phone number'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="customerPhone2" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم الموبايل 2 (اختياري)' : 'Phone Number 2 (Optional)'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'رقم موبايل إضافي' : 'Additional phone number'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="customerAddress" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                    <FormLabel>{language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}</FormLabel>
                    <FormControl><Input placeholder={language === 'ar' ? 'عنوان الشارع، رقم المبنى، إلخ.' : 'Street address, building no., etc.'} {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="zoning" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'المنطقة' : 'Zoning'}</FormLabel>
                    {isLoadingZones ? <Skeleton className="h-10" /> : (
                      <Select onValueChange={(zoneName) => {
                          field.onChange(zoneName);
                          const zone = shippingZones?.find(z => z.name === zoneName);
                          setSelectedZone(zone || null);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? 'اختر منطقة' : 'Select a zone'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingZones?.map(zone => (
                            <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    <FormItem className="flex-1 min-w-[150px]">
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
                                if (product.weight) {
                                    form.setValue(`items.${index}.weight`, product.weight);
                                }
                            } else {
                                form.setValue(`items.${index}.productId`, '');
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                 <FormField
                    control={form.control}
                    name={`items.${index}.weight`}
                    render={({ field }) => (
                    <FormItem className="w-24">
                        <FormLabel className={cn(index > 0 && "sr-only")}>
                        {language === "ar" ? "الوزن" : "Weight"}
                        </FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            placeholder={language === "ar" ? "الوزن" : "Weight"}
                            {...field}
                            value={field.value ?? ''}
                            step="any"
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
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

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productId: "", productName: "", quantity: 1, price: 0, weight: undefined })}>
            <PlusCircle className="me-2 h-4 w-4" />
            {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
          </Button>
          
          <Separator className="my-6" />

            <div className="space-y-2">
                <div className="flex justify-between">
                    <p>{language === 'ar' ? 'مجموع المنتجات' : 'Items Subtotal'}</p>
                    <p>{formatCurrency(itemsTotal)}</p>
                </div>
                <div className="flex justify-between">
                    <p>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</p>
                    <p>{formatCurrency(shippingCost)}</p>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                    <p>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</p>
                    <p>{formatCurrency(total)}</p>
                </div>
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
