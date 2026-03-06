
"use client";

import { PageHeader } from "@/components/page-header";
import { ReceiptSettingsForm } from "./components/receipt-settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { ReceiptPreview } from "./components/receipt-preview";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase, useUser } from "@/firebase";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { ref, set, query, orderByChild, get, update, endBefore } from "firebase/database";
import type { ReceiptSettings, User, AppSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OrderStatusSettings } from "./components/order-status-settings";


const receiptSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  logoSize: z.coerce.number().min(20).max(300).default(100),
  headerText: z.string().optional(),
  showOrderId: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showCustomerName: z.boolean().default(true),
  showFacebookName: z.boolean().default(true),
  showCustomerPhone: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showPaymentMethod: z.boolean().default(true),
  showItemsSubtotal: z.boolean().default(true),
  showShippingCost: z.boolean().default(true),
  showGrandTotal: z.boolean().default(true),
  footerText: z.string().optional(),
  mandatoryFooterText: z.string().optional(),
  showItemWeight: z.boolean().default(false),
  showItemPrice: z.boolean().default(true),
  showItemSubtotal: z.boolean().default(true),
  showCourierName: z.boolean().default(false),
  showModeratorName: z.boolean().default(false),
  showModeratorUsername: z.boolean().default(false),
  showTotalItems: z.boolean().default(true),
  showTotalWeight: z.boolean().default(true),
});

type ReceiptSettingsFormValues = z.infer<typeof receiptSettingsSchema>;

const appSettingsSchema = z.object({
  maxUsers: z.coerce.number().int().min(1, "العدد يجب أن يكون 1 على الأقل"),
  autoGenerateOrderId: z.boolean().default(false),
});

type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;


export default function SettingsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user } = useUser();
  const isAdmin = user?.role === 'Admin';
  const isEmergencyAdmin = user?.email === 'emergency.admin@elezz.com';
  const canManageStatuses = user?.role === 'Admin' || isEmergencyAdmin;

  const { data: receiptSettingsCollection, isLoading: isLoadingReceiptSettings } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');
  const { data: appSettingsCollection, isLoading: isLoadingAppSettings } = useRealtimeCachedCollection<AppSettings>('app-settings');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const [deleteMonth, setDeleteMonth] = React.useState<number | undefined>();
  const [deleteYear, setDeleteYear] = React.useState<number | undefined>();
  const [deletePassword, setDeletePassword] = React.useState('');
  const [isAdvancedDeleteOpen, setIsAdvancedDeleteOpen] = React.useState(false);

  const currentReceiptSettings = React.useMemo(() => {
    if (!receiptSettingsCollection || receiptSettingsCollection.length === 0) return null;
    return receiptSettingsCollection[0];
  }, [receiptSettingsCollection]);
  
  const currentAppSettings = React.useMemo(() => {
    if (!appSettingsCollection || appSettingsCollection.length === 0) return null;
    return appSettingsCollection[0];
  }, [appSettingsCollection]);

  const nonCourierUsersCount = React.useMemo(() => {
    if (!usersData) return 0;
    return usersData.filter(u => u.role !== 'Courier').length;
  }, [usersData]);

  const receiptForm = useForm<ReceiptSettingsFormValues>({
    resolver: zodResolver(receiptSettingsSchema),
    defaultValues: {
      showLogo: true,
      logoSize: 100,
      headerText: 'العز ماركت',
      showOrderId: true,
      showDate: true,
      showCustomerName: true,
      showFacebookName: true,
      showCustomerPhone: true,
      showCustomerAddress: true,
      showPaymentMethod: true,
      showItemsSubtotal: true,
      showShippingCost: true,
      showGrandTotal: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      mandatoryFooterText: '',
      showItemWeight: false,
      showItemPrice: true,
      showItemSubtotal: true,
      showCourierName: false,
      showModeratorName: false,
      showModeratorUsername: false,
      showTotalItems: true,
      showTotalWeight: true,
    },
  });

  const appSettingsForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      maxUsers: 25,
      autoGenerateOrderId: false,
    },
  });

  const watchedReceiptSettings = receiptForm.watch();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(0, i).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' }),
  }));

  React.useEffect(() => {
    if (currentReceiptSettings) {
        const valuesToSet = { ...receiptForm.getValues(), ...currentReceiptSettings };
        receiptForm.reset(valuesToSet);
    }
  }, [currentReceiptSettings, receiptForm]);

  React.useEffect(() => {
    if (currentAppSettings) {
      appSettingsForm.reset({ 
          maxUsers: currentAppSettings.maxUsers,
          autoGenerateOrderId: currentAppSettings.autoGenerateOrderId || false,
        });
    }
  }, [currentAppSettings, appSettingsForm]);

  async function onReceiptSubmit(data: ReceiptSettingsFormValues) {
    if (!database) return;
    try {
      await update(ref(database, 'receipt-settings/main'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الإيصال بنجاح.' : 'Receipt settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  async function onAppSettingsSubmit(data: AppSettingsFormValues) {
    if (!database) return;
    try {
      await set(ref(database, 'app-settings/main'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الخطة بنجاح.' : 'Plan settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  const handleAdvancedDelete = async () => {
    if (!isEmergencyAdmin) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'غير مصرح به' : 'Unauthorized' });
      return;
    }

    if (deletePassword !== 'omarmeto') {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'كلمة مرور غير صحيحة' : 'Incorrect Password',
      });
      return;
    }
    if (!deleteYear || !deleteMonth) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'الشهر والسنة مطلوبان' : 'Month and Year Required',
      });
      return;
    }
    if (!database) {
      toast({ variant: "destructive", title: "Database error" });
      return;
    }

    setIsProcessing(true);
    toast({ title: language === 'ar' ? "جاري الحذف..." : "Deletion in progress..." });

    try {
      const deleteBeforeDate = new Date(deleteYear, deleteMonth - 1, 1);
      
      const ordersRootRef = ref(database, 'orders');
      const snapshot = await get(ordersRootRef);
      
      if (!snapshot.exists()) {
        toast({ title: language === 'ar' ? "لا توجد طلبات للحذف" : "No Orders to Delete" });
        setIsProcessing(false);
        setIsAdvancedDeleteOpen(false);
        return;
      }

      const updates: { [key: string]: null } = {};
      let count = 0;
      const allOrdersData = snapshot.val();

      // Iterate through years
      for (const year in allOrdersData) {
        // Iterate through months
        for (const month in allOrdersData[year]) {
          // Iterate through days
          for (const day in allOrdersData[year][month]) {
            // Iterate through orders
            for (const orderId in allOrdersData[year][month][day]) {
              const orderData = allOrdersData[year][month][day][orderId];
              if (orderData && orderData.createdAt) {
                const orderDate = new Date(orderData.createdAt);
                if (orderDate < deleteBeforeDate) {
                  const path = `orders/${year}/${month}/${day}/${orderId}`;
                  updates[path] = null;
                  if (orderData.customerPhone1) {
                    updates[`customer-orders/${orderData.customerPhone1}/${orderId}`] = null;
                  }
                  count++;
                }
              }
            }
          }
        }
      }

      if (count > 0) {
        await update(ref(database), updates);
        toast({ title: language === 'ar' ? "اكتمل الحذف" : "Deletion Complete", description: `${language === 'ar' ? 'تم حذف' : 'Deleted'} ${count} ${language === 'ar' ? 'طلب بنجاح من قاعدة البيانات الرئيسية.' : 'orders successfully from the main database.'}` });
      } else {
        toast({ title: language === 'ar' ? "لا توجد طلبات للحذف" : "No Orders to Delete" });
      }
    } catch (error) {
      console.error("Advanced delete failed:", error);
      toast({ variant: "destructive", title: language === 'ar' ? "فشل الحذف" : "Delete Failed", description: (error as Error).message });
    } finally {
      setIsProcessing(false);
      setIsAdvancedDeleteOpen(false);
      setDeletePassword('');
    }
  };


  const maxUsers = currentAppSettings?.maxUsers || 25;
  const isLoading = isLoadingReceiptSettings || isLoadingUsers || isLoadingAppSettings;

  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className={cn("grid w-full",
          isEmergencyAdmin ? "grid-cols-3" :
          canManageStatuses ? "grid-cols-2" :
          "grid-cols-1"
        )}>
          <TabsTrigger value="general">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</TabsTrigger>
          {canManageStatuses && <TabsTrigger value="statuses">{language === 'ar' ? 'حالات الطلب' : 'Order Statuses'}</TabsTrigger>}
          {isEmergencyAdmin && <TabsTrigger value="database">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</TabsTrigger>}
        </TabsList>
        <TabsContent value="general" className="space-y-8 mt-6">
          {isEmergencyAdmin && (
            <Card>
                <Form {...appSettingsForm}>
                  <form onSubmit={appSettingsForm.handleSubmit(onAppSettingsSubmit)}>
                    <CardHeader>
                      <CardTitle>{language === 'ar' ? 'إدارة الخطة' : 'Plan Management'}</CardTitle>
                      <CardDescription>{language === 'ar' ? 'قم بتعيين الحد الأقصى للمستخدمين (غير المناديب) للنظام.' : 'Set the maximum number of users (non-couriers) for the system.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center rounded-lg border p-4">
                          <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'خطة المستخدمين' : 'User Plan'}</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{nonCourierUsersCount}</span>
                                <span className="text-xl font-medium text-muted-foreground">/ {maxUsers}</span>
                              </div>
                          </div>
                          <div className="w-full sm:w-auto">
                            <FormField
                              control={appSettingsForm.control}
                              name="maxUsers"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{language === 'ar' ? 'تعيين الحد الأقصى للمستخدمين' : 'Set Max Users'}</FormLabel>
                                  <FormControl>
                                    <Input type="number" className="max-w-xs" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                      </div>
                       <FormField
                          control={appSettingsForm.control}
                          name="autoGenerateOrderId"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">{language === 'ar' ? 'إنشاء رقم الطلب تلقائياً' : 'Auto-generate Order ID'}</FormLabel>
                                <FormDescription>{language === 'ar' ? 'عند التفعيل، سيتم إنشاء رقم الطلب تلقائياً.' : 'If enabled, the order ID will be generated automatically.'}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                      <Button type="submit" disabled={appSettingsForm.formState.isSubmitting}>{language === 'ar' ? 'حفظ إعدادات الخطة' : 'Save Plan Settings'}</Button>
                    </CardFooter>
                  </form>
                </Form>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2">
                <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات إيصال البيع' : 'Receipt Settings'}</CardTitle>
                <CardDescription>
                    {language === 'ar' ? 'تحكم في العناصر التي تظهر في فاتورة الإيصال الحراري.' : 'Control which elements appear on the thermal receipt invoice.'}
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReceiptSettingsForm form={receiptForm} onSubmit={onReceiptSubmit} isAdmin={isEmergencyAdmin} />
                </CardContent>
            </Card>

            <div className="lg:sticky lg:top-20">
                <Card>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'معاينة الإيصال' : 'Receipt Preview'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReceiptPreview settings={watchedReceiptSettings} />
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
        {canManageStatuses && (
         <TabsContent value="statuses" className="space-y-8 mt-6">
            <OrderStatusSettings />
        </TabsContent>
        )}
        {isEmergencyAdmin && (
          <TabsContent value="database" className="space-y-8 mt-6">
            <Card className="border-orange-500 dark:border-orange-400">
                <CardHeader>
                    <CardTitle className="text-orange-600 dark:text-orange-400">{language === 'ar' ? 'حذف متقدم للبيانات (قاعدة البيانات الرئيسية)' : 'Advanced Data Deletion (Main Database)'}</CardTitle>
                    <CardDescription className="text-orange-600 dark:text-orange-500">
                        {language === 'ar' ? 'تحذير: هذا الإجراء سيقوم بحذف بيانات الطلبات بشكل دائم من قاعدة البيانات الرئيسية. استخدمه بحذر شديد.' : 'Warning: This action will permanently delete order data from the main database. Use with extreme caution.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>{language === 'ar' ? 'حذف جميع الطلبات بشكل دائم قبل الشهر المحدد.' : 'Permanently delete all orders before the selected month.'}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select onValueChange={(val) => setDeleteMonth(Number(val))}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder={language === 'ar' ? 'اختر الشهر' : 'Select Month'} />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(month => (
                                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(val) => setDeleteYear(Number(val))}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder={language === 'ar' ? 'اختر السنة' : 'Select Year'} />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <AlertDialog open={isAdvancedDeleteOpen} onOpenChange={setIsAdvancedDeleteOpen}>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={isProcessing || !deleteMonth || !deleteYear}>
                                {language === 'ar' ? 'بدء عملية الحذف' : 'Initiate Deletion'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد تماماً؟' : 'Are you absolutely sure?'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {language === 'ar' ? `سيتم حذف جميع الطلبات بشكل دائم من قاعدة البيانات الرئيسية قبل شهر ${months.find(m => m.value === deleteMonth)?.label || ''} ${deleteYear || ''}. لا يمكن التراجع عن هذا الإجراء.` : `This will permanently delete all orders from the main database before ${months.find(m => m.value === deleteMonth)?.label || ''} ${deleteYear || ''}. This action cannot be undone.`}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <div className="space-y-2">
                                <Label htmlFor="delete-password-confirm">{language === 'ar' ? 'كلمة مرور التأكيد' : 'Confirmation Password'}</Label>
                                <Input
                                    id="delete-password-confirm"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder={language === 'ar' ? 'أدخل كلمة المرور للتأكيد' : 'Enter password to confirm'}
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletePassword('')}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleAdvancedDelete} className="bg-destructive hover:bg-destructive/90">{language === 'ar' ? 'نعم، قم بالحذف النهائي' : 'Yes, permanently delete'}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
