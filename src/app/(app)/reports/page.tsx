"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/datepicker"

const commissionReportData = [
    { moderator: 'علي حسن', sales: '50,000 ج.م', salesCommission: '2,500 ج.م', deliveries: 100, deliveryCommission: '1,000 ج.م', returns: 5, returnCommission: '- 250 ج.م', totalCommission: '3,250 ج.م' },
    { moderator: 'فاطمة أحمد', sales: '45,000 ج.م', salesCommission: '2,250 ج.م', deliveries: 90, deliveryCommission: '900 ج.م', returns: 2, returnCommission: '- 100 ج.م', totalCommission: '3,050 ج.م' },
    { moderator: 'مشرف آخر', sales: '60,000 ج.م', salesCommission: '3,000 ج.م', deliveries: 120, deliveryCommission: '1,200 ج.م', returns: 8, returnCommission: '- 400 ج.م', totalCommission: '3,800 ج.م' },
];


export default function ReportsPage() {
  const { language } = useLanguage();
    const [fromDate, setFromDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [toDate, setToDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    );

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'التقارير' : 'Reports'} />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>{language === 'ar' ? 'تقرير العمولات' : 'Commission Report'}</CardTitle>
                    <CardDescription>{language === 'ar' ? 'ملخص عمولات الوسطاء حسب النطاق الزمني' : 'Moderator commissions summary by date range'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'} />
                    <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'} />
                    <Button>{language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'المبيعات' : 'Sales'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'عمولة البيع' : 'Sales Commission'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'التسليمات' : 'Deliveries'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'عمولة التسليم' : 'Delivery Commission'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'المرتجعات' : 'Returns'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'عمولة الإرجاع' : 'Return Commission'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionReportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.moderator}</TableCell>
                    <TableCell className="text-end">{row.sales}</TableCell>
                    <TableCell className="text-end">{row.salesCommission}</TableCell>
                    <TableCell className="text-end">{row.deliveries}</TableCell>
                    <TableCell className="text-end">{row.deliveryCommission}</TableCell>
                    <TableCell className="text-end">{row.returns}</TableCell>
                    <TableCell className="text-end text-destructive">{row.returnCommission}</TableCell>
                    <TableCell className="text-end font-medium">{row.totalCommission}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقارير أخرى' : 'Other Reports'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{language === 'ar' ? 'ستكون التقارير والتحليلات التفصيلية الأخرى متاحة هنا قريبًا.' : 'Detailed reports and analytics will be available here.'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
