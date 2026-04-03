
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { DatePicker } from "@/components/ui/datepicker"
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { User, Adjustment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Badge } from "@/components/ui/badge";
import { subDays } from "date-fns";

export default function AdjustmentsReportPage() {
    const { language } = useLanguage();
    // Default to last 7 days
    const [fromDate, setFromDate] = React.useState<Date | undefined>(
        subDays(new Date(), 7)
    );
    const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

    const { data: usersData, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
    const { data: adjustmentsData, isLoading: isLoadingAdjustments } = useRealtimeCachedCollection<Adjustment>('adjustments');

    const { reportData, filteredAdjustments } = React.useMemo(() => {
        if (!usersData || !adjustmentsData) return { reportData: [], filteredAdjustments: [] };

        const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : 0;
        const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

        const filtered = adjustmentsData.filter(a => {
            const aTime = new Date(a.date).getTime();
            return aTime >= from && aTime <= to;
        });

        const data = usersData
            .filter(user => user.role !== 'Admin')
            .map(user => {
                const userAdjustments = filtered.filter(a => a.userId === user.id);
                const bonuses = userAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0);
                const discounts = userAdjustments.filter(a => a.type === 'discount').reduce((sum, a) => sum + a.amount, 0);

                return {
                    id: user.id,
                    name: user.name,
                    bonuses: bonuses,
                    discounts: discounts,
                    netBalance: bonuses - discounts
                };
            })
            .filter(row => row.bonuses !== 0 || row.discounts !== 0)
            .sort((a, b) => b.netBalance - a.netBalance);

        return { reportData: data, filteredAdjustments: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    }, [usersData, adjustmentsData, fromDate, toDate]);

    const totalBonuses = reportData.reduce((acc, curr) => acc + curr.bonuses, 0);
    const totalDiscounts = reportData.reduce((acc, curr) => acc + curr.discounts, 0);

    const chartData = reportData.map(d => ({ name: d.name, value: d.netBalance }));
    const isLoading = isLoadingUsers || isLoadingAdjustments;

    if (isLoading) {
      return (
        <div className="space-y-8">
          <PageHeader title={language === 'ar' ? 'تقرير الخصومات والمكافآت' : 'Bonuses & Discounts Report'} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      )
    }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير الخصومات والمكافآت' : 'Bonuses & Discounts Report'} />
      
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'} />
          <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">{language === 'ar' ? 'إجمالي المكافآت' : 'Total Bonuses'}</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBonuses, language)}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">{language === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts'}</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalDiscounts, language)}</div>
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'صافي التسويات حسب الموظف' : 'Net Balance per Staff'}</CardTitle>
          </CardHeader>
          <CardContent>
              <StaffPerformanceChart 
                data={chartData} 
                barDataKey="balance"
                barLabel={language === 'ar' ? 'الرصيد' : 'Balance'}
                formatter={(val) => formatCurrency(val, language)}
              />
          </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>{language === 'ar' ? 'ملخص مستحقات الموظفين (تسويات فقط)' : 'Staff Adjustment Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead className="text-start">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                  <TableHead className="text-end text-green-600">{language === 'ar' ? 'إجمالي المكافآت' : 'Total Bonuses'}</TableHead>
                  <TableHead className="text-end text-red-600">{language === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts'}</TableHead>
                  <TableHead className="text-end font-bold">{language === 'ar' ? 'صافي الرصيد' : 'Net Balance'}</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {reportData.map((row) => (
                  <TableRow key={row.id}>
                      <TableCell className="font-medium text-start">{row.name}</TableCell>
                      <TableCell className="text-end text-green-600">+{formatCurrency(row.bonuses, language)}</TableCell>
                      <TableCell className="text-end text-red-600">-{formatCurrency(row.discounts, language)}</TableCell>
                      <TableCell className={`text-end font-bold ${row.netBalance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                          {row.netBalance > 0 ? '+' : ''}{formatCurrency(row.netBalance, language)}
                      </TableCell>
                  </TableRow>
                  ))}
                  {reportData.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">{language === 'ar' ? 'لا توجد تسويات مالية لهذه الفترة.' : 'No adjustments for this period.'}</TableCell></TableRow>
                  )}
              </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'سجل التسويات التفصيلي' : 'Detailed Adjustments Log'}</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                          <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                          <TableHead>{language === 'ar' ? 'البند' : 'Category'}</TableHead>
                          <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                          <TableHead className="text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredAdjustments.map(adj => (
                          <TableRow key={adj.id}>
                              <TableCell>{adj.userName}</TableCell>
                              <TableCell>{adj.date}</TableCell>
                              <TableCell>{adj.category}</TableCell>
                              <TableCell>
                                  <Badge variant={adj.type === 'bonus' ? 'default' : 'destructive'} className={adj.type === 'bonus' ? 'bg-green-600' : ''}>
                                      {adj.type === 'bonus' ? (language === 'ar' ? 'مكافأة' : 'Bonus') : (language === 'ar' ? 'خصم' : 'Discount')}
                                  </Badge>
                              </TableCell>
                              <TableCell className={`text-end font-bold ${adj.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                                  {adj.type === 'bonus' ? '+' : '-'}{formatCurrency(adj.amount, language)}
                              </TableCell>
                          </TableRow>
                      ))}
                      {filteredAdjustments.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">{language === 'ar' ? 'لا توجد بيانات.' : 'No data.'}</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
