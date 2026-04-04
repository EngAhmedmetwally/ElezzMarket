
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker";
import { CommissionChart } from "./components/commission-chart";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { User, Commission } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { subDays } from "date-fns";

export default function ReportsPage() {
    const { language } = useLanguage();
    // Default to last 7 days
    const [fromDate, setFromDate] = React.useState<Date | undefined>(
        subDays(new Date(), 7)
    );
    const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

    const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
    const { data: commissionsData, isLoading: isLoadingCommissions } = useRealtimeCachedCollection<Commission>('commissions');

    const { reportData, totalCommissions } = React.useMemo(() => {
        if (!commissionsData) return { reportData: [], totalCommissions: 0 };

        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : 0;
        const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

        // 1. Filter commissions by date range first
        const filteredCommissions = commissionsData.filter(c => {
            if (!c.calculationDate) return false;
            const cTime = new Date(c.calculationDate).getTime();
            return cTime >= from && cTime <= to;
        });

        const totalInPeriod = filteredCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        // 2. Group by userId to identify all earners
        const earnersMap = new Map<string, number>();
        filteredCommissions.forEach(c => {
            const current = earnersMap.get(c.userId) || 0;
            earnersMap.set(c.userId, current + (Number(c.amount) || 0));
        });

        // 3. Create display data by matching IDs with user names
        const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
        
        const data = Array.from(earnersMap.entries()).map(([userId, amount]) => {
            const user = userMap.get(userId);
            let name = user?.name || (userId === 'emergency-admin' ? (language === 'ar' ? 'مسؤول الطوارئ' : 'Emergency Admin') : (language === 'ar' ? 'موظف غير معروف' : 'Unknown User'));
            
            return {
                id: userId,
                name: name,
                commissions: amount,
            };
        }).sort((a, b) => b.commissions - a.commissions);

        return { reportData: data, totalCommissions: totalInPeriod };
    }, [usersData, commissionsData, fromDate, toDate, language]);

    const chartData = reportData.map(d => ({ moderator: d.name, totalCommission: d.commissions }));
    const isLoading = isLoadingUsers || isLoadingCommissions;

    if (isLoading) {
      return (
        <div className="space-y-8">
          <PageHeader title={language === 'ar' ? 'تقارير العمولات' : 'Commission Reports'} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      )
    }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقارير العمولات' : 'Commission Reports'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="flex-1 w-full">
            <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'} />
          </div>
          <div className="flex-1 w-full">
            <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'} />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'إجمالي عمولات الفترة' : 'Total Commissions Period'}</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalCommissions, language)}</div>
              </CardContent>
          </Card>
      </div>

      {chartData.length > 0 && <CommissionChart data={chartData} />}

      <Card>
        <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقرير عمولات الموظفين' : 'Staff Commission Report'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'العمولات الناتجة تلقائياً من تغيير حالات الطلبات' : 'Commissions generated automatically from order status changes'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead className="text-start">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                  <TableHead className="text-end font-bold">{language === 'ar' ? 'إجمالي العمولات' : 'Total Commissions'}</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {reportData.map((row) => (
                  <TableRow key={row.id}>
                      <TableCell className="font-medium text-start">{row.name}</TableCell>
                      <TableCell className="text-end font-bold text-primary">{formatCurrency(row.commissions, language)}</TableCell>
                  </TableRow>
                  ))}
                  {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="h-32 text-center text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات عمولات لهذه الفترة.' : 'No commission data for this period.'}</TableCell></TableRow>
                  )}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
