
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useDatabase, useUser } from "@/firebase";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { ref, update } from "firebase/database";
import type { AppSettings, WhatsAppSettings } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { testWhatsAppConnection } from "@/app/actions/whatsapp";
import { CheckCircle2, XCircle, Loader2, MessageSquare } from "lucide-react";

const whatsappSettingsSchema = z.object({
  provider: z.string().min(1, "اسم المزود مطلوب"),
  endpoint: z.string().url("رابط API غير صالح"),
  token: z.string().min(1, "التوكن مطلوب"),
  instanceId: z.string().optional(),
  isEnabled: z.boolean().default(false),
});

type WhatsAppFormValues = z.infer<typeof whatsappSettingsSchema>;

export default function WhatsAppPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user } = useUser();
  const isAdmin = user?.role === 'Admin' || user?.email === 'emergency.admin@elezz.com';

  const { data: appSettingsCollection, isLoading } = useRealtimeCachedCollection<AppSettings>('app-settings');
  const [isTestingApi, setIsTestingApi] = React.useState(false);
  const [apiTestResult, setApiTestResult] = React.useState<{ success: boolean; error?: string } | null>(null);

  const currentAppSettings = React.useMemo(() => {
    if (!appSettingsCollection || appSettingsCollection.length === 0) return null;
    return appSettingsCollection[0];
  }, [appSettingsCollection]);

  const form = useForm<WhatsAppFormValues>({
    resolver: zodResolver(whatsappSettingsSchema),
    defaultValues: {
      provider: "",
      endpoint: "",
      token: "",
      instanceId: "",
      isEnabled: false,
    }
  });

  React.useEffect(() => {
    if (currentAppSettings?.whatsapp) {
      form.reset({
          provider: currentAppSettings.whatsapp.provider || "",
          endpoint: currentAppSettings.whatsapp.endpoint || "",
          token: currentAppSettings.whatsapp.token || "",
          instanceId: currentAppSettings.whatsapp.instanceId || "",
          isEnabled: currentAppSettings.whatsapp.isEnabled || false,
      });
    }
  }, [currentAppSettings, form]);

  async function onSubmit(data: WhatsAppFormValues) {
      if (!database) return;
      try {
          await update(ref(database, 'app-settings/main/whatsapp'), data);
          toast({ title: language === 'ar' ? 'تم حفظ إعدادات واتساب' : 'WhatsApp Settings Saved' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  }

  const handleTestWhatsApp = async () => {
    const data = form.getValues();
    if (!data.endpoint || !data.token) {
        toast({ variant: 'destructive', title: language === 'ar' ? 'بيانات ناقصة' : 'Missing Data' });
        return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);
    try {
        const result = await testWhatsAppConnection({
            endpoint: data.endpoint,
            token: data.token,
            instanceId: data.instanceId,
        });
        setApiTestResult(result);
        if (result.success) {
            toast({ title: language === 'ar' ? 'تم الاتصال بنجاح' : 'Connection Successful' });
        }
    } catch (error: any) {
        setApiTestResult({ success: false, error: error.message });
    } finally {
        setIsTestingApi(false);
    }
  };

  if (isLoading) {
      return (
          <div className="space-y-8">
            <PageHeader title={language === 'ar' ? 'واتساب' : 'WhatsApp'} />
            <Skeleton className="h-[400px] w-full" />
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'إدارة واتساب' : 'WhatsApp Management'} />

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
                <MessageSquare className="h-6 w-6" />
                {language === 'ar' ? 'إعدادات ربط واتساب API' : 'WhatsApp API Integration'}
            </CardTitle>
            <CardDescription>
                {language === 'ar' ? 'قم بتهيئة بيانات المزود لتفعيل الإرسال الجماعي التلقائي.' : 'Configure API provider details to enable automated bulk messaging.'}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="provider" render={({ field }) => (
                            <FormItem><FormLabel>Provider Name</FormLabel><FormControl><Input placeholder="UltraMsg, Twilio, etc." {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="isEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8">
                                <FormLabel>Enable Automation</FormLabel>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="endpoint" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>API Endpoint URL</FormLabel><FormControl><Input placeholder="https://api.ultramsg.com/instanceXXX/messages/chat" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="token" render={({ field }) => (
                            <FormItem><FormLabel>Auth Token / API Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="instanceId" render={({ field }) => (
                            <FormItem><FormLabel>Instance ID / Sender Number</FormLabel><FormControl><Input placeholder="instance12345" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}/>
                    </div>

                    {apiTestResult && (
                        <div className={cn("p-4 rounded-lg flex items-start gap-3 border", apiTestResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800")}>
                            {apiTestResult.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                            <div className="text-sm">
                                <p className="font-bold">{apiTestResult.success ? (language === 'ar' ? 'متصل بنجاح' : 'Connected Successfully') : (language === 'ar' ? 'فشل الاتصال' : 'Connection Failed')}</p>
                                {apiTestResult.error && <p className="mt-1 opacity-90">{apiTestResult.error}</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={handleTestWhatsApp} disabled={isTestingApi}>
                            {isTestingApi && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                            {language === 'ar' ? 'فحص الاتصال' : 'Test API'}
                        </Button>
                        <Button type="submit">{language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}</Button>
                    </div>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}

