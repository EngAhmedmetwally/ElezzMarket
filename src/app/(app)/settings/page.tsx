
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
import { ref, set } from "firebase/database";
import type { ReceiptSettings, User, AppSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Download, Upload, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { idbGetAll, idbClear, idbBulkPut } from "@/lib/db";
import { saveAs } from "file-saver";
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
import { syncEvents } from "@/lib/sync-events";


const receiptSettingsSchema = z.object({
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
  showCourierName: z.boolean().default(false),
  showModeratorName: z.boolean().default(false),
});

type ReceiptSettingsFormValues = z.infer<typeof receiptSettingsSchema>;

const appSettingsSchema = z.object({
  maxUsers: z.coerce.number().int().min(1, "العدد يجب أن يكون 1 على الأقل"),
});

type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;

const DB_STORES = ['orders', 'users', 'products', 'shipping-zones', 'commission-rules', 'customers', 'app-settings', 'receipt-settings', 'sync-timestamps', 'commissions'];

export default function SettingsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user } = useUser();
  const isEmergencyAdmin = user?.email === 'emergency.admin@elezz.com';

  const { data: receiptSettingsCollection, isLoading: isLoadingReceiptSettings } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');
  const { data: appSettingsCollection, isLoading: isLoadingAppSettings } = useRealtimeCachedCollection<AppSettings>('app-settings');
  const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');

  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      showCourierName: false,
      showModeratorName: false,
    },
  });

  const appSettingsForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      maxUsers: 25,
    },
  });

  const watchedReceiptSettings = receiptForm.watch();
  
  React.useEffect(() => {
    if (currentReceiptSettings) {
        const valuesToSet = { ...receiptForm.getValues(), ...currentReceiptSettings };
        receiptForm.reset(valuesToSet);
    }
  }, [currentReceiptSettings, receiptForm]);

  React.useEffect(() => {
    if (currentAppSettings) {
      appSettingsForm.reset({ maxUsers: currentAppSettings.maxUsers });
    }
  }, [currentAppSettings, appSettingsForm]);

  async function onReceiptSubmit(data: ReceiptSettingsFormValues) {
    if (!database) return;
    try {
      await set(ref(database, 'receipt-settings'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الإيصال بنجاح.' : 'Receipt settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  async function onAppSettingsSubmit(data: AppSettingsFormValues) {
    if (!database) return;
    try {
      await set(ref(database, 'app-settings'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الخطة بنجاح.' : 'Plan settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  const handleBackup = async () => {
    setIsProcessing(true);
    toast({ title: language === 'ar' ? "جاري النسخ الاحتياطي..." : "Backup in progress...", description: language === 'ar' ? "قد تستغرق هذه العملية بعض الوقت." : "This may take a moment." });

    try {
      const backupData: { [key: string]: any } = {};
      for (const storeName of DB_STORES) {
        const data = await idbGetAll(storeName);
        backupData[storeName] = data;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      saveAs(blob, `elezz-market-db-backup-${timestamp}.json`);

      toast({ title: language === 'ar' ? "اكتمل النسخ الاحتياطي" : "Backup Complete", description: language === 'ar' ? "تم حفظ ملف النسخ الاحتياطي بنجاح." : "The backup file has been saved successfully." });
    } catch (error) {
      console.error("Backup failed:", error);
      toast({ variant: "destructive", title: language === 'ar' ? "فشل النسخ الاحتياطي" : "Backup Failed", description: (error as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({ title: language === 'ar' ? "جاري الاستعادة..." : "Restore in progress...", description: language === 'ar' ? "يرجى عدم إغلاق الصفحة." : "Please do not close the page." });

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      for (const storeName of DB_STORES) {
        await idbClear(storeName);
        if (backupData[storeName] && Array.isArray(backupData[storeName])) {
          await idbBulkPut(storeName, backupData[storeName]);
        }
      }
      
      syncEvents.emit('synced', 'all');

      toast({ title: language === 'ar' ? "اكتملت الاستعادة" : "Restore Complete", description: language === 'ar' ? "تمت استعادة قاعدة البيانات بنجاح." : "The database has been restored successfully." });
    } catch (error) {
      console.error("Restore failed:", error);
      toast({ variant: "destructive", title: language === 'ar' ? "فشلت الاستعادة" : "Restore Failed", description: language === 'ar' ? "الملف غير صالح أو تالف." : "The file is invalid or corrupt." });
    } finally {
      setIsProcessing(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    toast({ title: language === 'ar' ? "جاري الحذف..." : "Deletion in progress..." });

    try {
      for (const storeName of DB_STORES) {
        await idbClear(storeName);
      }
      
      syncEvents.emit('synced', 'all');
      
      toast({ title: language === 'ar' ? "تم حذف قاعدة البيانات" : "Database Deleted", description: language === 'ar' ? "تم مسح جميع البيانات المحلية بنجاح." : "All local data has been successfully cleared." });
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ variant: "destructive", title: language === 'ar' ? "فشل الحذف" : "Delete Failed", description: (error as Error).message });
    } finally {
      setIsProcessing(false);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">{language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</TabsTrigger>
          <TabsTrigger value="database">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</TabsTrigger>
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
                    <ReceiptSettingsForm form={receiptForm} onSubmit={onReceiptSubmit} />
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
        <TabsContent value="database" className="space-y-8 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'حفظ نسخة من بياناتك المحلية أو استعادتها من ملف.' : 'Save a copy of your local data or restore it from a file.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <Button onClick={handleBackup} disabled={isProcessing}>
                <Download className="me-2 h-4 w-4" />
                {language === 'ar' ? 'نسخ احتياطي للبيانات' : 'Backup Data'}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="me-2 h-4 w-4" />
                {language === 'ar' ? 'استعادة البيانات' : 'Restore Data'}
              </Button>
              <Input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleRestore}
                accept=".json"
              />
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{language === 'ar' ? 'حذف قاعدة البيانات' : 'Delete Database'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'سيؤدي هذا إلى حذف جميع البيانات المحلية المخزنة في متصفحك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.' : 'This will permanently delete all local data stored in your browser. This action cannot be undone.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isProcessing}>
                      <Trash2 className="me-2 h-4 w-4" />
                      {language === 'ar' ? 'حذف جميع البيانات المحلية' : 'Delete All Local Data'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد تماماً؟' : 'Are you absolutely sure?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {language === 'ar' ? 'سيتم حذف جميع الطلبات والمستخدمين والمنتجات والإعدادات المخزنة محلياً. إذا لم يكن لديك نسخة احتياطية، فستفقد هذه البيانات إلى الأبد. سيحاول التطبيق إعادة المزامنة من الخادم بعد ذلك.' : 'This will delete all locally stored orders, users, products, and settings. If you do not have a backup, this data will be lost forever. The app will attempt to re-sync from the server afterwards.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{language === 'ar' ? 'نعم، قم بالحذف' : 'Yes, delete it'}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
