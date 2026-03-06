
'use client';

import Link from 'next/link';
import { Package, Users2 } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';

export default function HomePage() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{language === 'ar' ? 'مرحباً بك' : 'Welcome'}</h1>
        <p className="text-lg text-muted-foreground">{language === 'ar' ? 'اختر وجهتك التالية للبدء' : 'Choose where you want to go'}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto w-full">
          <Link href="/orders" passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer p-6 pt-8">
                <div className="flex flex-col items-center gap-4">
                  <Package className="h-16 w-16 text-primary" />
                  <CardTitle className="text-2xl">{language === 'ar' ? 'الطلبات' : 'Orders'}</CardTitle>
                </div>
            </Card>
          </Link>
          <Link href="/customers" passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer p-6 pt-8">
                <div className="flex flex-col items-center gap-4">
                  <Users2 className="h-16 w-16 text-primary" />
                  <CardTitle className="text-2xl">{language === 'ar' ? 'العملاء' : 'Customers'}</CardTitle>
                </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
