
"use client";
import type { OrderEditHistoryItem } from '@/lib/types';
import { useLanguage } from '@/components/language-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface OrderEditHistoryProps {
  history?: Record<string, OrderEditHistoryItem>;
}

export function OrderEditHistory({ history }: OrderEditHistoryProps) {
  const { language } = useLanguage();

  if (!history) {
    return <p className="py-8 text-center text-muted-foreground">{language === 'ar' ? 'لا يوجد سجل تعديلات.' : 'No edit history found.'}</p>;
  }

  const sortedHistory = Object.values(history).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ScrollArea className="max-h-[60vh]">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التفصيل' : 'Description'}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedHistory.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell className="text-xs">{format(new Date(item.createdAt), 'PPP p')}</TableCell>
                        <TableCell>{item.userName}</TableCell>
                        <TableCell>{item.description}</TableCell>
                    </TableRow>
                ))}
                    {sortedHistory.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            {language === 'ar' ? 'لا يوجد سجل تعديلات.' : 'No edit history found.'}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </ScrollArea>
  )
}
