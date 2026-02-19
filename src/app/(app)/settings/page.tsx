
"use client";

import { PageHeader } from "@/components/page-header";
import { ReceiptSettingsForm } from "./components/receipt-settings-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";

export default function SettingsPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الإعدادات' : 'Settings'} />
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إعدادات إيصال البيع' : 'Receipt Settings'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'تحكم في العناصر التي تظهر في فاتورة الإيصال الحراري.' : 'Control which elements appear on the thermal receipt invoice.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ReceiptSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
