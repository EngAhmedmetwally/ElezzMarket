
"use client";
import type { ProductHistoryItem } from '@/lib/types';
import { useLanguage } from '@/components/language-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';

interface ProductHistoryViewProps {
  history?: Record<string, ProductHistoryItem>;
}

export function ProductHistoryView({ history }: ProductHistoryViewProps) {
  const { language } = useLanguage();

  if (!history) {
    return <p className="py-8 text-center text-muted-foreground">{language === 'ar' ? 'لا يوجد سجل تعديلات.' : 'No history found.'}</p>;
  }

  const sortedHistory = Object.values(history).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const fieldLabels = {
      price: language === 'ar' ? 'السعر' : 'Price',
      weight: language === 'ar' ? 'الوزن' : 'Weight',
  }
  
  const formatCurrency = (value: number) => formatCurrencyUtil(value, language);
  const formatWeight = (value: number) => `${value.toFixed(2)} ${language === 'ar' ? 'كجم' : 'kg'}`;

  return (
    <ScrollArea className="max-h-[60vh]">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحقل' : 'Field'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'القيمة القديمة' : 'Old Value'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'القيمة الجديدة' : 'New Value'}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedHistory.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell className="text-xs">{new Date(item.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</TableCell>
                        <TableCell>{item.userName}</TableCell>
                        <TableCell>{fieldLabels[item.field]}</TableCell>
                        <TableCell className="text-end font-mono">{item.field === 'price' ? formatCurrency(item.oldValue) : formatWeight(item.oldValue)}</TableCell>
                        <TableCell className="text-end font-mono">{item.field === 'price' ? formatCurrency(item.newValue) : formatWeight(item.newValue)}</TableCell>
                    </TableRow>
                ))}
                 {sortedHistory.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            {language === 'ar' ? 'لا يوجد سجل تعديلات.' : 'No history found.'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </ScrollArea>
  )
}
