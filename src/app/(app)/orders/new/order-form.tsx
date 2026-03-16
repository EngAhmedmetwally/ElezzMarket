
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { PlusCircle, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Customer, Product, OrderItem, ShippingZone, AppSettings, Order } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { useDatabase, useUser } from "@/firebase";
import { ref, get, update, push, set, runTransaction } from "firebase/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { idbPut } from "@/lib/db";
import { syncEvents } from "@/lib/sync-events";
import { Textarea } from "@/components/ui/textarea";

const orderFormSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  facebookName: z.string().optional(),
  customerPhone1: z.string().length(11, "رقم الموبايل الأول يجب أن يكون 11 رقمًا"),
  customerPhone2: z.string().optional().refine((val) => !val || !val.startsWith("01") || val.length === 11, {
    message: "رقم الموبايل الثاني يجب أن يكون 11 رقمًا إذا بدأ بـ 01",
  }),
  customerAddress: z.string().min(1, "العنوان بالتفصيل مطلوب"),
  zoning: z.string().min(1, "المنطقة مطلوبة"),
  paymentMethod: z.enum(["نقدي عند الاستلام", "انستا باى", "فودافون كاش", "اورانج كاش"], {
      required_error: "طريقة الدفع مطلوبة",
  }),
  shippingCost: z.coerce.number().min(0, "تكلفة الشحن يجب أن تكون رقمًا موجبًا").optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "المنتج المحدد ليس من قائمة الاصناف"),
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
    orderToEdit?: Order | null;
}

export function OrderForm({ onSuccess, orderToEdit }: OrderFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const database = useDatabase();
  const { user } = useUser();
  const isEditMode = !!orderToEdit;
  
  const [newOrderId, setNewOrderId] = React.useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeProductSearchIndex, setActiveProductIndex] = React.useState<number | null>(null);

  const { data: customers } = useRealtimeCachedCollection<Customer & {id: string}>('customers');
  const { data: allProducts } = useRealtimeCachedCollection<Product>('products');
  const { data: shippingZones, isLoading: isLoadingZones } = useRealtimeCachedCollection<ShippingZone>('shipping-zones');
  const { data: appSettingsCollection } = useRealtimeCachedCollection<AppSettings>('app-settings');

  const products = React.useMemo(() => allProducts?.filter(p => p.isActive), [allProducts]);

  const appSettings = React.useMemo(() => {
    if (!appSettingsCollection || appSettingsCollection.length === 0) return null;
    return appSettingsCollection[0];
  }, [appSettingsCollection]);

  const isAutoIdEnabled = appSettings?.autoGenerateOrderId === true;

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
      paymentMethod: "نقدي عند الاستلام",
      shippingCost: 0,
      notes: "",
      items: [{ productId: "", productName: "", quantity: 1, price: 0, weight: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  React.useEffect(() => {
    if (isEditMode && orderToEdit) {
        form.reset({
            id: orderToEdit.id,
            customerName: orderToEdit.customerName,
            facebookName: orderToEdit.facebookName || "",
            customerPhone1: orderToEdit.customerPhone1,
            customerPhone2: orderToEdit.customerPhone2 || "",
            customerAddress: orderToEdit.customerAddress,
            zoning: orderToEdit.zoning,
            paymentMethod: orderToEdit.paymentMethod || "نقدي عند الاستلام",
            shippingCost: orderToEdit.shippingCost || 0,
            notes: orderToEdit.notes || "",
            items: orderToEdit.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight || undefined
            })),
        });
    }
  }, [isEditMode, orderToEdit, form]);

  const [customerSearch, setCustomerSearch] = React.useState("");
  const allCustomers = customers || [];
  
  const filteredCustomers = React.useMemo(() => {
    if (!customerSearch) return [];
    return allCustomers.filter(
      (c: any) =>
        (c.customerPhone1 && c.customerPhone1.includes(customerSearch)) ||
        (c.customerPhone2 && c.customerPhone2.includes(customerSearch)) ||
        (c.customerName && c.customerName.toLowerCase().includes(customerSearch.toLowerCase()))
    );
  }, [customerSearch, allCustomers]);

  const handleCustomerSelect = (customer: Customer & {id: string}) => {
    form.setValue("customerPhone1", customer.customerPhone1);
    form.setValue("customerName", customer.customerName);
    form.setValue("facebookName", customer.facebookName || "");
    form.setValue("customerPhone2", customer.customerPhone2 || "");
    form.setValue("customerAddress", customer.customerAddress);
    form.setValue("zoning", customer.zoning);
    const zone = shippingZones?.find(z => z.name === customer.zoning);
    form.setValue("shippingCost", zone?.cost || 0);
    setCustomerSearch(""); 
    form.trigger(["customerPhone1", "customerName", "customerAddress", "zoning"]);
  };

  const handleProductSelect = (index: number, product: Product) => {
    form.setValue(`items.${index}.productName`, product.name);
    form.setValue(`items.${index}.price`, product.price);
    form.setValue(`items.${index}.productId`, product.id);
    if (product.weight) {
        form.setValue(`items.${index}.weight`, product.weight);
    }
    setActiveProductIndex(null);
    form.trigger(`items.${index}.productId`);
  };

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedShippingCost = useWatch({ control: form.control, name: "shippingCost" });
  
  const itemsTotal = React.useMemo(() => {
    return watchedItems.reduce((acc, item) => acc + (Number(item?.quantity) || 0) * (Number(item?.price) || 0), 0);
  }, [watchedItems]);

  const total = itemsTotal + (Number(watchedShippingCost) || 0);

  async function onSubmit(data: OrderFormValues) {
    if (!database || !user) {
      toast({ variant: "destructive", title: "Authentication Error" });
      return;
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && orderToEdit) {
            let orderPath = orderToEdit.path;
            if (!orderPath && orderToEdit.createdAt) {
                const d = new Date(orderToEdit.createdAt);
                orderPath = `orders/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${orderToEdit.id}`;
            }

            if (!orderPath) throw new Error("Order path missing");

            const updates: { [key: string]: any } = {};
            const newTotal = data.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0) + (data.shippingCost || 0);
            
            const updatedData = { ...data, total: newTotal, updatedAt: new Date().toISOString() };
            Object.keys(updatedData).forEach(key => {
                if (key !== 'id') updates[`${orderPath}/${key}`] = (updatedData as any)[key];
            });

            await update(ref(database), updates);
            const snapshot = await get(ref(database, orderPath));
            if (snapshot.exists()) {
                await idbPut('orders', { ...snapshot.val(), id: orderToEdit.id, path: orderPath });
                syncEvents.emit('synced', 'orders');
            }

            toast({ title: language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully' });
            onSuccess?.();
        } else {
            let orderId: string;
            if (isAutoIdEnabled) {
                const transactionResult = await runTransaction(ref(database, 'counters/orders'), (current) => (current === null) ? 20001 : current + 1);
                if (!transactionResult.committed) throw new Error('Failed to generate ID');
                orderId = String(transactionResult.snapshot.val());
            } else {
                if (!data.id) {
                    form.setError("id", { message: "ID Required" });
                    setIsSubmitting(false);
                    return;
                }
                orderId = data.id;
            }
            
            const now = new Date();
            const orderPath = `orders/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${orderId}`;
            
            const commissionRulesSnap = await get(ref(database, 'commission-rules'));
            const commissionAmount = commissionRulesSnap.val()?.["تم التسجيل"]?.amount || 0;

            const newOrder: Order = {
                id: orderId,
                customerName: data.customerName,
                facebookName: data.facebookName,
                customerPhone1: data.customerPhone1,
                customerPhone2: data.customerPhone2,
                customerAddress: data.customerAddress,
                zoning: data.zoning,
                paymentMethod: data.paymentMethod,
                items: data.items as OrderItem[],
                shippingCost: data.shippingCost || 0,
                total,
                status: "تم التسجيل",
                notes: data.notes || "",
                moderatorId: user.id,
                moderatorName: user.name || user.email || 'System',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                statusHistory: {
                    [push(ref(database)).key!]: {
                        status: 'تم التسجيل',
                        notes: data.notes || "",
                        createdAt: now.toISOString(),
                        userName: user.name || user.email || 'System',
                        userId: user.id
                    }
                },
                totalCommission: commissionAmount,
            };

            await set(ref(database, orderPath), newOrder);
            await idbPut('orders', { ...newOrder, path: orderPath });
            syncEvents.emit('synced', 'orders');

            const updates: { [key: string]: any } = {};
            updates[`order-lookup/${orderId}`] = true;
            updates[`customer-orders/${data.customerPhone1}/${orderId}`] = true;
            
            const custSnap = await get(ref(database, `customers/${data.customerPhone1}`));
            if (!custSnap.exists()) {
                updates[`customers/${data.customerPhone1}`] = { 
                    customerName: data.customerName, 
                    facebookName: data.facebookName, 
                    customerPhone1: data.customerPhone1, 
                    customerPhone2: data.customerPhone2, 
                    customerAddress: data.customerAddress, 
                    zoning: data.zoning 
                };
            }

            if (commissionAmount !== 0) {
                const commRef = push(ref(database, 'commissions'));
                updates[`commissions/${commRef.key}`] = { 
                    orderId, 
                    userId: user.id, 
                    orderStatus: "تم التسجيل", 
                    amount: commissionAmount, 
                    calculationDate: now.toISOString(), 
                    paymentStatus: 'Calculated' 
                };
            }

            await update(ref(database), updates);
            setNewOrderId(orderId);
            setIsSuccessModalOpen(true);
        }
    } catch(e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  return (
    <>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {!isEditMode && (
                <FormField control={form.control} name="id" render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</FormLabel>
                    <FormControl><Input placeholder={isAutoIdEnabled ? 'تلقائي' : 'أدخل الرقم'} {...field} disabled={isAutoIdEnabled} onFocus={(e) => e.target.select()} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}/>
            )}
            
            <div>
                <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative md:col-span-2">
                        <FormField control={form.control} name="customerPhone1" render={({ field }) => (
                            <FormItem>
                            <FormLabel className="dark:text-yellow-400">
                                {language === 'ar' ? 'رقم الموبايل 1' : 'Phone Number 1'}
                                <span className="text-destructive ms-1">*</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative group">
                                    <Input 
                                        placeholder={language === 'ar' ? 'ابحث برقم الهاتف...' : 'Search by phone number...'} 
                                        {...field} 
                                        autoComplete="off"
                                        onFocus={(e) => {
                                            e.target.select();
                                            setCustomerSearch(field.value);
                                        }}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setCustomerSearch(e.target.value);
                                        }}
                                    />
                                    <div 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1"
                                        onClick={() => setCustomerSearch(field.value || " ")}
                                    >
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        {customerSearch && filteredCustomers.length > 0 && (
                            <Card className="absolute z-20 w-full mt-1 shadow-lg">
                                <CardContent className="p-2 max-h-60 overflow-y-auto">
                                    {filteredCustomers.map((customer: any) => (
                                        <div 
                                            key={customer.id} 
                                            className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleCustomerSelect(customer);
                                            }}
                                        >
                                            <p className="font-medium">{customer.customerPhone1}</p>
                                            <p className="text-muted-foreground">{customer.customerName}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem>
                        <FormLabel className="dark:text-yellow-400">
                            {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                            <span className="text-destructive ms-1">*</span>
                        </FormLabel>
                        <FormControl><Input {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="facebookName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'اسم فيسبوك' : 'Facebook Name'}</FormLabel>
                        <FormControl><Input {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="customerPhone2" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الموبايل 2' : 'Phone Number 2'}</FormLabel>
                        <FormControl><Input {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="customerAddress" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel className="dark:text-yellow-400">
                            {language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}
                            <span className="text-destructive ms-1">*</span>
                        </FormLabel>
                        <FormControl><Input {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="zoning" render={({ field }) => (
                        <FormItem>
                        <FormLabel className="dark:text-yellow-400">
                            {language === 'ar' ? 'المنطقة' : 'Zoning'}
                            <span className="text-destructive ms-1">*</span>
                        </FormLabel>
                        {isLoadingZones ? <Skeleton className="h-10" /> : (
                        <Select onValueChange={(val) => {
                            field.onChange(val);
                            const zone = shippingZones?.find(z => z.name === val);
                            form.setValue("shippingCost", zone?.cost || 0);
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
                     <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-yellow-400">
                                    {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                                    <span className="text-destructive ms-1">*</span>
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر طريقة الدفع" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="نقدي عند الاستلام">نقدي عند الاستلام</SelectItem>
                                        <SelectItem value="انستا باى">انستا باى</SelectItem>
                                        <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
                                        <SelectItem value="اورانج كاش">اورانج كاش</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="shippingCost" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</FormLabel>
                        <FormControl><Input type="number" {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>{language === 'ar' ? 'ملاحظات الطلب' : 'Order Notes'}</FormLabel>
                        <FormControl><Textarea placeholder={language === 'ar' ? 'أضف أي ملاحظات إضافية هنا...' : 'Add any additional notes here...'} {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </div>
            
            <div>
            <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h3>
            <div className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap gap-4 items-end relative">
                    <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                        <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel className={cn(index > 0 && 'sr-only', "dark:text-yellow-400")}>
                            {language === 'ar' ? 'المنتج' : 'Product'}
                            <span className="text-destructive ms-1">*</span>
                        </FormLabel>
                        <FormControl>
                            <div className="relative group">
                                <Input 
                                    placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} 
                                    {...field}
                                    autoComplete="off"
                                    onFocus={(e) => {
                                        e.target.select();
                                        setActiveProductIndex(index);
                                    }}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setActiveProductIndex(index);
                                    }}
                                    onBlur={() => setTimeout(() => setActiveProductIndex(null), 200)}
                                />
                                <div 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1"
                                    onClick={() => setActiveProductIndex(index)}
                                >
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                                {activeProductSearchIndex === index && products && (
                                    <Card className="absolute z-30 w-full mt-1 shadow-lg max-h-60 overflow-y-auto">
                                        <CardContent className="p-1">
                                            {products
                                                .filter(p => p.name.toLowerCase().includes(field.value.toLowerCase()))
                                                .map(product => (
                                                    <div 
                                                        key={product.id} 
                                                        className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm flex justify-between items-center"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleProductSelect(index, product);
                                                        }}
                                                    >
                                                        <span className="font-medium">{product.name}</span>
                                                        <span className="text-muted-foreground text-xs">{formatCurrency(product.price, language)}</span>
                                                    </div>
                                                ))
                                            }
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name={`items.${index}.weight`} render={({ field }) => (
                        <FormItem className="w-20">
                        <FormLabel className={cn(index > 0 && 'sr-only')}>الوزن</FormLabel>
                        <FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} onFocus={(e) => e.target.select()} disabled /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                        <FormItem className="w-24">
                        <FormLabel className={cn(index > 0 && 'sr-only')}>الكمية</FormLabel>
                        <FormControl><Input type="number" {...field} onFocus={(e) => e.target.select()} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                        <FormItem className="w-32">
                        <FormLabel className={cn(index > 0 && 'sr-only')}>السعر</FormLabel>
                        <FormControl><Input type="number" {...field} disabled /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ productId: "", productName: "", quantity: 1, price: 0, weight: undefined }, { shouldFocus: false })}>
                <PlusCircle className="me-2 h-4 w-4" />
                إضافة صنف
            </Button>
            
            <Separator className="my-6" />

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <p>{language === 'ar' ? 'مجموع المنتجات' : 'Items Subtotal'}</p>
                        <p>{formatCurrency(itemsTotal, language)}</p>
                    </div>
                    <div className="flex justify-between">
                        <p>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</p>
                        <p>{formatCurrency(Number(watchedShippingCost) || 0, language)}</p>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <p>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</p>
                        <p>{formatCurrency(total, language)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : isEditMode ? "حفظ التغييرات" : "إنشاء الطلب"}
            </Button>
            </div>
        </form>
        </Form>
        <Dialog open={isSuccessModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setIsSuccessModalOpen(false);
                if (onSuccess) onSuccess();
                form.reset();
                setNewOrderId(null);
            }
        }}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Order Created'}</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                    <p className="text-lg">رقم الطلب:</p>
                    <p className="text-2xl font-bold text-primary">{newOrderId}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button>موافق</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
