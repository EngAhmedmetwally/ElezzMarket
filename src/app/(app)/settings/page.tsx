"use client";

import { PageHeader } from "@/components/page-header";
import { ReceiptSettingsForm } from "./components/receipt-settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { ReceiptPreview } from "./components/receipt-preview";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { ref, update } from "firebase/database";
import type { ReceiptSettings, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";


const settingsFormSchema = z.object({
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

type SettingsFormValues = z.infer<typeof settingsFormSchema>;


export default function SettingsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user } = useUser();
  const isEmergencyAdmin = user?.email === 'emergency.admin@elezz.com';

  const settingsRef = useMemoFirebase(() => database ? ref(database, 'receipt-settings') : null, [database]);
  const { data: currentSettings, isLoading } = useDoc<ReceiptSettings>(settingsRef);
  
  const usersQuery = useMemoFirebase(() => database ? ref(database, 'users') : null, [database]);
  const { data: usersData, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
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

  const watchedSettings = form.watch();
  
  React.useEffect(() => {
    if (currentSettings) {
        const valuesToSet = { ...form.getValues(), ...currentSettings };
        form.reset(valuesToSet);
    }
  }, [currentSettings, form]);

  async function onSubmit(data: SettingsFormValues) {
    if (!database || !settingsRef) return;
    try {
      await update(settingsRef, data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved', description: language === 'ar' ? 'تم تحديث إعدادات الإيصال بنجاح.' : 'Receipt settings have been updated successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  }

  if (isLoading || isLoadingUsers) {
    return (
        <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'خطة المستخدمين' : 'User Plan'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{usersData?.length || 0} / 25</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عدد المستخدمين المسجلين في النظام' : 'Registered users in the system'}</p>
            </CardContent>
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
                <ReceiptSettingsForm form={form} onSubmit={onSubmit} />
            </CardContent>
        </Card>

        <div className="lg:sticky lg:top-20">
            <Card>
                 <CardHeader>
                    <CardTitle>{language === 'ar' ? 'معاينة الإيصال' : 'Receipt Preview'}</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <ReceiptPreview settings={watchedSettings} />
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
