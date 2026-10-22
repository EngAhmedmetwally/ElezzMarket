
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
import { ref, set, get, update } from "firebase/database";
import type { ReceiptSettings, User, AppSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
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
  showCustomerPhone2: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showPaymentMethod: z.boolean().default(true),
  showOrderNotes: z.boolean().default(true),
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

  const receiptForm = useForm<ReceiptSettingsFormValues>({
    resolver: zodResolver(receiptSettingsSchema),
    defaultValues: {
        showLogo: true,
        logoSize: 100,
        showOrderId: true,
        showDate: true,
        showCustomerName: true,
        showFacebookName: true,
        showCustomerPhone: true,
        showCustomerPhone2: true,
        showCustomerAddress: true,
        showPaymentMethod: true,
        showOrderNotes: true,
        showItemsSubtotal: true,
        showShippingCost: true,
        showGrandTotal: true,
        showItemWeight: false,
        showItemPrice: true,
        showItemSubtotal: true,
        showCourierName: false,
        showModeratorName: false,
        showModeratorUsername: false,
        showTotalItems: true,
        showTotalWeight: true,
    }
  });

  const appSettingsForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
        maxUsers: 10,
        autoGenerateOrderId: false,
    }
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
        receiptForm.reset({ ...receiptForm.getValues(), ...currentReceiptSettings });
    }
  }, [currentReceiptSettings, receiptForm]);

  React.useEffect(() => {
    if (currentAppSettings) {
      appSettingsForm.reset({ 
          maxUsers: currentAppSettings.maxUsers || 10,
          autoGenerateOrderId: currentAppSettings.autoGenerateOrderId || false,
        });
    }
  }, [currentAppSettings, appSettingsForm]);

  async function onReceiptSubmit(data: ReceiptSettingsFormValues) {
    if (!database) return;
    try {
      await update(ref(database, 'receipt-settings/main'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  async function onAppSettingsSubmit(data: AppSettingsFormValues) {
    if (!database) return;
    try {
      await update(ref(database, 'app-settings/main'), data);
      toast({ title: language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings Saved' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const handleAdvancedDelete = async () => {
    if (!isEmergencyAdmin || deletePassword !== 'omarmeto' || !deleteYear || !deleteMonth || !database) {
      toast({ variant: "destructive", title: "Error" });
      return;
    }

    setIsProcessing(true);
    try {
      const deleteBeforeDate = new Date(deleteYear, deleteMonth - 1, 1);
      const snapshot = await get(ref(database, 'orders'));
      if (!snapshot.exists()) {
        toast({ title: "No Orders" });
        return;
      }

      const updates: { [key: string]: null } = {};
      let count = 0;
      const allOrdersData = snapshot.val();

      for (const year in allOrdersData) {
        for (const month in allOrdersData[year]) {
          for (const day in allOrdersData[year][month]) {
            for (const orderId in allOrdersData[year][month][day]) {
              const orderData = allOrdersData[year][month][day][orderId];
              if (orderData && orderData.createdAt) {
                if (new Date(orderData.createdAt) < deleteBeforeDate) {
                  updates[`orders/${year}/${month}/${day}/${orderId}`] = null;
                  if (orderData.customerPhone1) updates[`customer-orders/${orderData.customerPhone1}/${orderId}`] = null;
                  count++;
                }
              }
            }
          }
        }
      }

      if (count > 0) {
        await update(ref(database), updates);
        toast({ title: "Done", description: `Deleted ${count} orders` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
      setIsAdvancedDeleteOpen(false);
    }
  };

  const isLoading = isLoadingReceiptSettings || isLoadingAppSettings || isLoadingUsers;

  if (isLoading) return <div className="space-y-8"><PageHeader title="Settings" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className={cn("grid w-full", isEmergencyAdmin ? "grid-cols-3" : canManageStatuses ? "grid-cols-2" : "grid-cols-1")}>
          <TabsTrigger value="general">{language === 'ar' ? 'العامة' : 'General'}</TabsTrigger>
          {canManageStatuses && <TabsTrigger value="statuses">{language === 'ar' ? 'الحالات' : 'Statuses'}</TabsTrigger>}
          {isEmergencyAdmin && <TabsTrigger value="database">{language === 'ar' ? 'القاعدة' : 'Database'}</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-8 mt-6">
          {isEmergencyAdmin && (
            <Card>
                <Form {...appSettingsForm}>
                  <form onSubmit={appSettingsForm.handleSubmit(onAppSettingsSubmit)}>
                    <CardHeader>
                        <CardTitle>{language === 'ar' ? 'إدارة الخطة' : 'Plan Management'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={appSettingsForm.control} name="maxUsers" render={({ field }) => (
                            <FormItem><FormLabel>Max Users</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}/>
                         <FormField control={appSettingsForm.control} name="autoGenerateOrderId" render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <FormLabel>Auto-generate Order ID</FormLabel>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )}/>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4"><Button type="submit">Save Plan</Button></CardFooter>
                  </form>
                </Form>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Receipt Settings</CardTitle></CardHeader>
                <CardContent><ReceiptSettingsForm form={receiptForm} onSubmit={onReceiptSubmit} isAdmin={isEmergencyAdmin} /></CardContent>
            </Card>
            <div className="lg:sticky lg:top-20"><Card><CardHeader><CardTitle>Preview</CardTitle></CardHeader><CardContent><ReceiptPreview settings={watchedReceiptSettings} /></CardContent></Card></div>
          </div>
        </TabsContent>

        <TabsContent value="statuses" className="mt-6"><OrderStatusSettings /></TabsContent>

        <TabsContent value="database" className="mt-6">
            <Card className="border-orange-500">
                <CardHeader><CardTitle className="text-orange-600">Advanced Data Deletion</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Select onValueChange={(val) => setDeleteMonth(Number(val))}><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent></Select>
                        <Select onValueChange={(val) => setDeleteYear(Number(val))}><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <AlertDialog open={isAdvancedDeleteOpen} onOpenChange={setIsAdvancedDeleteOpen}>
                        <AlertDialogTrigger asChild><Button variant="destructive" disabled={isProcessing || !deleteMonth || !deleteYear}>Start Cleanup</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete Permanently?</AlertDialogTitle></AlertDialogHeader>
                             <div className="space-y-2"><Label>Password</Label><Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></div>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleAdvancedDelete}>Delete All</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

