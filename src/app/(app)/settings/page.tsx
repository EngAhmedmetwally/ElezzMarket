
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
import { useDatabase, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { ref, update, set } from "firebase/database";
import type { ReceiptSettings, User, AppSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


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
});

type ReceiptSettingsFormValues = z.infer<typeof receiptSettingsSchema>;

const appSettingsSchema = z.object({
  maxUsers: z.coerce.number().int().min(1, "العدد يجب أن يكون 1 على الأقل"),
});

type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;


export default function SettingsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user } = useUser();
  const isEmergencyAdmin = user?.email === 'emergency.admin@elezz.com';

  const receiptSettingsRef = useMemoFirebase(() => database ? ref(database, 'receipt-settings') : null, [database]);
  const { data: currentReceiptSettings, isLoading: isLoadingReceiptSettings } = useDoc<ReceiptSettings>(receiptSettingsRef);

  const appSettingsRef = useMemoFirebase(() => database ? ref(database, 'app-settings') : null, [database]);
  const { data: currentAppSettings, isLoading: isLoadingAppSettings } = useDoc<AppSettings>(appSettingsRef);
  
  const usersQuery = useMemoFirebase(() => database ? ref(database, 'users') : null, [database]);
  const { data: usersData, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

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
    if (!database || !receiptSettingsRef) return;
    try {
      await update(receiptSettingsRef, data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الإيصال بنجاح.' : 'Receipt settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  async function onAppSettingsSubmit(data: AppSettingsFormValues) {
    if (!database || !appSettingsRef) return;
    try {
      await set(appSettingsRef, data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الخطة بنجاح.' : 'Plan settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  const maxUsers = currentAppSettings?.maxUsers || 25;
  const isLoading = isLoadingReceiptSettings || isLoadingUsers || isLoadingAppSettings;

  if (isLoading) {
    return (
        <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
            {isEmergencyAdmin && <Skeleton className="h-24" />}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-8">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-96 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />

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
    </div>
  );
}
