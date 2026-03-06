
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
import { PlusCircle, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import type { Customer, Product, OrderItem, ShippingZone, Commission, AppSettings, Order, OrderEditHistoryItem, PaymentMethod } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { useDatabase, useUser } from "@/firebase";
import { ref, get, update, push, set, runTransaction, child } from "firebase/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { idbPut } from "@/lib/db";
import { syncEvents } from "@/lib/sync-events";

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
    .min(1, "يجب أن يحتوي الطلب على عنصر واحد على الأقل.")
    .superRefine((items, ctx) => {
        items.forEach((item, index) => {
            if (!item.productId) {
                ctx.addIssue({
                    path: [index, 'productName'],
                    message: "المنتج المحدد غير موجود. يرجى الاختيار من القائمة.",
                    code: z.ZodIssueCode.custom
                });
            }
        });
    }),
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
  const { data: appSettingsCollection, isLoading: isLoadingAppSettings } = useRealtimeCachedCollection<AppSettings>('app-settings');

  const products = React.useMemo(() => allProducts?.filter(p => p.isActive), [allProducts]);

  const appSettings = React.useMemo(() => {
    if (!appSettingsCollection || appSettingsCollection.length === 0) return null;
    return appSettingsCollection[0];
  }, [appSettingsCollection]);

  const isAutoIdEnabled = appSettings?.autoGenerateOrderId === true;

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
      paymentMethod: "نقدي عند الاستلام",
      shippingCost: 0,
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
            items: orderToEdit.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight || undefined
            })),
        });
        const zone = shippingZones?.find(z => z.name === orderToEdit.zoning);
        setSelectedZone(zone || null);
    }
  }, [isEditMode, orderToEdit, form, shippingZones]);


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
    setSelectedZone(zone || null);
    form.setValue("shippingCost", zone?.cost || 0);
    setCustomerSearch(""); 
  };

  const handleProductSelect = (index: number, product: Product) => {
    form.setValue(`items.${index}.productName`, product.name);
    form.setValue(`items.${index}.price`, product.price);
    form.setValue(`items.${index}.productId`, product.id);
    if (product.weight) {
        form.setValue(`items.${index}.weight`, product.weight);
    }
    setActiveProductIndex(null);
  };

  const watchedItems = form.watch("items");
  const watchedShippingCost = form.watch("shippingCost");
  const itemsTotal = watchedItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const shippingCost = Number(watchedShippingCost) || 0;
  const total = itemsTotal + shippingCost;
  const customerPhone1Value = form.watch("customerPhone1");
  
  React.useEffect(() => {
      if(!isEditMode) {
        setCustomerSearch(customerPhone1Value);
      }
  }, [customerPhone1Value, isEditMode]);

  async function onSubmit(data: OrderFormValues) {
    if (!database || !user) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'لا يمكن إنشاء الطلب. يرجى تسجيل الدخول أولاً.' : 'Cannot create order. Please sign in first.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && orderToEdit) {
            let orderPath = orderToEdit.path;
            if (!orderPath) {
                if (orderToEdit.createdAt && orderToEdit.id) {
                    const d = new Date(orderToEdit.createdAt);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    orderPath = `orders/${year}/${month}/${day}/${orderToEdit.id}`;
                } else {
                     toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Order path or creation date is missing, cannot update.",
                    });
                    setIsSubmitting(false);
                    return;
                }
            }

            const now = new Date().toISOString();
            const historyDescriptions: string[] = [];

            const oldShippingCost = orderToEdit.shippingCost || 0;
            const newShippingCost = data.shippingCost || 0;
            if (oldShippingCost !== newShippingCost) {
                historyDescriptions.push(`تغيير قيمة الشحن من ${formatCurrency(oldShippingCost, language)} إلى ${formatCurrency(newShippingCost, language)}`);
            }

            const oldItemsMap = new Map(orderToEdit.items.map(item => [item.productId, item]));
            const newItemsMap = new Map(data.items.map(item => [item.productId!, item]));

            for (const [productId, oldItem] of oldItemsMap.entries()) {
                const newItem = newItemsMap.get(productId);
                if (!newItem) {
                    historyDescriptions.push(`حذف صنف: ${oldItem.productName}`);
                } else {
                    if (oldItem.quantity !== newItem.quantity) {
                        const action = newItem.quantity > oldItem.quantity ? 'إضافة كمية' : 'تخفيض كمية';
                        historyDescriptions.push(`${action} لـ ${newItem.productName} من ${oldItem.quantity} إلى ${newItem.quantity}`);
                    }
                }
            }

            for (const [productId, newItem] of newItemsMap.entries()) {
                if (!oldItemsMap.has(productId)) {
                    historyDescriptions.push(`إضافة صنف: ${newItem.productName} (الكمية: ${newItem.quantity})`);
                }
            }

            const updates: { [key: string]: any } = {};
            const newItemsTotal = data.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
            const newTotal = newItemsTotal + newShippingCost;
            const updatedData = { ...data, shippingCost: newShippingCost, total: newTotal, updatedAt: new Date().toISOString() };
            
            Object.keys(updatedData).forEach(key => {
                if (key !== 'id') {
                    updates[`${orderPath}/${key}`] = (updatedData as any)[key];
                }
            });

            if (historyDescriptions.length > 0) {
                 historyDescriptions.forEach(desc => {
                    const historyKey = push(child(ref(database), `${orderPath}/editHistory`)).key;
                    if (historyKey) {
                        const newHistoryEntry: Omit<OrderEditHistoryItem, 'id'> = {
                            userId: user.id,
                            userName: user.name || user.email || "Unknown",
                            createdAt: now,
                            description: desc,
                        };
                        updates[`${orderPath}/editHistory/${historyKey}`] = newHistoryEntry;
                    }
                });
            }

            await update(ref(database), updates);

            // Fetch and update cache
            const orderRef = ref(database, orderPath);
            const snapshot = await get(orderRef);
            if (snapshot.exists()) {
                const updatedOrderFromDB = snapshot.val();
                const orderToCache = { ...updatedOrderFromDB, id: orderToEdit.id, path: orderPath };
                await idbPut('orders', orderToCache);
                syncEvents.emit('synced', 'orders');
            }

            toast({
                title: language === 'ar' ? 'تم تحديث الطلب' : 'Order Updated',
                description: `${language === 'ar' ? 'تم تحديث الطلب رقم' : 'Order #'} ${orderToEdit.id} ${language === 'ar' ? 'بنجاح.' : 'has been updated.'}`
            });

            if (onSuccess) onSuccess();

        } else {
            const existingCustomer = (customers || []).find(c => c.id === data.customerPhone1);
            if (existingCustomer && existingCustomer.customerName.trim().toLowerCase() !== data.customerName.trim().toLowerCase()) {
                 form.setError("customerName", { type: "manual", message: language === 'ar' ? `رقم الهاتف هذا مسجل للعميل "${existingCustomer.customerName}". يرجى استخدام البحث أو تصحيح الاسم.` : `This phone number is registered to "${existingCustomer.customerName}". Please use search or correct the name.` });
                 setIsSubmitting(false);
                 return;
            }

            let orderId: string;
            const now = new Date();
            const year = String(now.getFullYear());
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            if (isAutoIdEnabled) {
                const counterRef = ref(database, 'counters/orders');
                const transactionResult = await runTransaction(counterRef, (currentCount) => (currentCount === null) ? 20001 : currentCount + 1);
                if (!transactionResult.committed) {
                    throw new Error(language === 'ar' ? 'فشل الحصول على رقم طلب جديد.' : 'Failed to get a new order ID.');
                }
                orderId = String(transactionResult.snapshot.val());
            } else {
                if (!data.id) {
                    form.setError("id", { type: "manual", message: language === 'ar' ? "رقم الطلب مطلوب." : "Order ID is required." });
                    setIsSubmitting(false);
                    return;
                }
                orderId = data.id;
                const orderPathCheck = `orders/${year}/${month}/${day}/${orderId}`;
                const orderRefCheck = ref(database, orderPathCheck);
                const snapshot = await get(orderRefCheck);
                if (snapshot.exists()) {
                    form.setError("id", { type: "manual", message: language === 'ar' ? "رقم الطلب هذا موجود بالفعل." : "This Order ID already exists." });
                    setIsSubmitting(false);
                    return;
                }
            }
            
            const orderPath = `orders/${year}/${month}/${day}/${orderId}`;
            const orderRef = ref(database, orderPath);
            
            const resolvedItems: OrderItem[] = data.items.map(item => ({
                productId: item.productId!,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                weight: item.weight,
            }));

            // Prepare commission
            const commissionRulesSnap = await get(ref(database, 'commission-rules'));
            const commissionRules = commissionRulesSnap.val();
            const registrationCommissionAmount = commissionRules?.["تم التسجيل"]?.amount || 0;

            const statusHistory: any = {};
            const initialHistoryKey = push(child(orderRef, 'statusHistory')).key;
            statusHistory[initialHistoryKey!] = { status: 'تم التسجيل', createdAt: new Date().toISOString(), userName: user.name || user.email || 'Unknown', userId: user.id };

            const newOrder: Order = {
                id: orderId,
                customerName: data.customerName,
                facebookName: data.facebookName,
                customerPhone1: data.customerPhone1,
                customerPhone2: data.customerPhone2,
                customerAddress: data.customerAddress,
                zoning: data.zoning,
                paymentMethod: data.paymentMethod,
                items: resolvedItems,
                shippingCost,
                total,
                status: "تم التسجيل",
                moderatorId: user.id,
                moderatorName: user.name || user.email || 'Unknown',
                moderatorUsername: user.username,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                statusHistory,
                totalCommission: registrationCommissionAmount,
            };

            // 1. Core write
            await set(orderRef, newOrder);
            
            // 2. Immediate cache update for UI responsiveness
            await idbPut('orders', { ...newOrder, id: orderId, path: orderPath });
            syncEvents.emit('synced', 'orders');

            // 3. Perform other updates in parallel to save time
            const backgroundPromises: Promise<any>[] = [];
            
            const updates: { [key: string]: any } = {};
            updates[`order-lookup/${orderId}`] = true;
            updates[`customer-orders/${data.customerPhone1}/${orderId}`] = true;
            
            // Check if customer needs to be created
            const customerRef = ref(database, `customers/${data.customerPhone1}`);
            backgroundPromises.push(get(customerRef).then(async (snap) => {
                if (!snap.exists()) {
                    const newCustomer: Customer = {
                        customerName: data.customerName, facebookName: data.facebookName, customerPhone1: data.customerPhone1, customerPhone2: data.customerPhone2, customerAddress: data.customerAddress, zoning: data.zoning,
                    };
                    await update(ref(database), { [`customers/${data.customerPhone1}`]: newCustomer });
                }
            }));

            // Product stats updates
            resolvedItems.forEach(item => {
                const productRef = ref(database, `products/${item.productId}`);
                backgroundPromises.push(runTransaction(productRef, (currentProduct) => {
                    if (currentProduct) {
                        currentProduct.salesCount = (currentProduct.salesCount || 0) + item.quantity;
                        currentProduct.soldWeight = (currentProduct.soldWeight || 0) + ((item.weight || 0) * item.quantity);
                    }
                    return currentProduct;
                }));
            });

            // Registration commission
            if (registrationCommissionAmount !== 0) {
                const newCommission: Omit<Commission, 'id'> = {
                    orderId: orderId, userId: user.id, orderStatus: "تم التسجيل", amount: registrationCommissionAmount, calculationDate: new Date().toISOString(), paymentStatus: 'Calculated',
                };
                backgroundPromises.push(set(push(ref(database, 'commissions')), newCommission));
            }

            backgroundPromises.push(update(ref(database), updates));

            // Wait for all non-critical background tasks
            await Promise.all(backgroundPromises);

            setNewOrderId(orderId);
            setIsSuccessModalOpen(true);
        }
    } catch(e: any) {
        console.error("Order submission failed:", e);
        toast({
            variant: "destructive",
            title: isEditMode ? (language === 'ar' ? 'فشل تحديث الطلب' : 'Order Update Failed') : (language === 'ar' ? 'فشل إنشاء الطلب' : 'Order Creation Failed'),
            description: e.message,
        });
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
                    <FormControl><Input 
                        placeholder={isAutoIdEnabled ? (language === 'ar' ? 'سيتم إنشاؤه تلقائياً' : 'Will be auto-generated') : (language === 'ar' ? 'أدخل رقم الطلب' : 'Enter Order ID')} 
                        {...field}
                        value={field.value ?? ''}
                        disabled={isAutoIdEnabled || isLoadingAppSettings} 
                    /></FormControl>
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
                            <FormLabel>{language === 'ar' ? 'رقم الموبايل 1' : 'Phone Number 1'}</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder={language === 'ar' ? 'ابحث برقم الهاتف...' : 'Search by phone number...'} 
                                    {...field} 
                                    autoComplete="off"
                                    disabled={isEditMode}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        {filteredCustomers.length > 0 && customerSearch && !isEditMode && (
                            <Card className="absolute z-20 w-full mt-1 shadow-lg">
                                <CardContent className="p-2 max-h-60 overflow-y-auto">
                                    {filteredCustomers.map((customer: any) => (
                                        <div 
                                            key={customer.id} 
                                            className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm"
                                            onClick={() => handleCustomerSelect(customer)}
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
                        <FormLabel>{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder={language === 'ar' ? 'اسم العميل الكامل' : 'Full customer name'} 
                                {...field} 
                                disabled={isEditMode}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="facebookName" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'اسم فيسبوك' : 'Facebook Name'}</FormLabel>
                        <FormControl><Input placeholder={language === 'ar' ? 'اسم الملف الشخصي على فيسبوك' : 'Facebook profile name'} {...field}  disabled={isEditMode} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="customerPhone2" render={({ field }) => (
                        <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الموبايل 2 (اختياري)' : 'Phone Number 2 (Optional)'}</FormLabel>
                        <FormControl><Input placeholder={language === 'ar' ? 'رقم موبايل إضافي' : 'Additional phone number'} {...field} disabled={isEditMode} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="customerAddress" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>{language === 'ar' ? 'العنوان بالتفصيل' : 'Detailed Address'}</FormLabel>
                        <FormControl><Input placeholder={language === 'ar' ? 'عنوان الشارع، رقم المبنى، إلخ.' : 'Street address, building no., etc.'} {...field} disabled={isEditMode} /></FormControl>
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
                            form.setValue("shippingCost", zone?.cost || 0);
                        }} value={field.value} disabled={isEditMode}>
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
                                <FormLabel>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={language === 'ar' ? 'اختر طريقة الدفع' : 'Select a payment method'} />
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
                </div>
            </div>
            
            <div>
            <h3 className="text-lg font-medium mb-4">{language === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h3>
            <div className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap gap-4 items-start relative">
                    <FormField control={form.control} name={`items.${index}.productName`} render={({ field }) => (
                        <FormItem className="flex-1 min-w-[150px]">
                        <FormLabel className={cn(index > 0 && 'sr-only')}>{language === 'ar' ? 'المنتج' : 'Product'}</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                placeholder={language === 'ar' ? 'اسم المنتج' : 'Product name'} 
                                {...field}
                                onFocus={() => setActiveProductIndex(index)}
                                onBlur={() => setTimeout(() => setActiveProductIndex(null), 200)}
                                onChange={(e) => {
                                    field.onChange(e);
                                    setActiveProductIndex(index);
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
                                disabled
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
                        <FormControl><Input type="number" placeholder={language === 'ar' ? 'السعر' : 'Price'} {...field} disabled /></FormControl>
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
                        <p>{formatCurrency(itemsTotal, language)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <Label>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</Label>
                        <FormField
                            control={form.control}
                            name="shippingCost"
                            render={({ field }) => (
                                <FormItem className="w-32">
                                    <FormControl>
                                        <Input
                                            type="number"
                                            className="text-end"
                                            {...field}
                                            value={field.value ?? ''}
                                            step="any"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                {isSubmitting 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                    : isEditMode ? (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (language === 'ar' ? 'إنشاء الطلب' : 'Create Order')}
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
                setSelectedZone(null);
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تم إنشاء الطلب بنجاح' : 'Order Created Successfully'}</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                    <p className="text-lg">{language === 'ar' ? `تم تسجيل الطلب رقم` : `Order registered with number`}</p>
                    <p className="text-2xl font-bold text-primary mt-2">{newOrderId}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>{language === 'ar' ? 'موافق' : 'OK'}</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
