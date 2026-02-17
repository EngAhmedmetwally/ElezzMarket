
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/datepicker"
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommissionChart } from "./components/commission-chart";
import { mockOrders, mockUsers } from "@/lib/data";


export default function ReportsPage() {
  const { language, isRTL } = useLanguage();
  const isMobile = useIsMobile();
    const [fromDate, setFromDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [toDate, setToDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    );
    const Arrow = isRTL ? ArrowLeft : ArrowRight;

    const commissionReportData = React.useMemo(() => {
    const filteredOrders = mockOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (fromDate) {
            const fromDateStart = new Date(fromDate);
            fromDateStart.setHours(0, 0, 0, 0);
            if (orderDate < fromDateStart) return false;
        }
        if (toDate) {
            const toDateEnd = new Date(toDate);
            toDateEnd.setHours(23, 59, 59, 999);
            if (orderDate > toDateEnd) return false;
        }
        return true;
    });

    const moderators = mockUsers.filter(u => u.role === 'Moderator');
    
    return moderators.map(moderator => {
      const moderatorOrders = filteredOrders.filter(o => o.moderatorId === moderator.id);
      
      const sales = moderatorOrders.reduce((acc, order) => acc + order.total, 0);
      const salesCommission = moderatorOrders.reduce((acc, order) => acc + (order.salesCommission || 0), 0);
      
      const deliveredOrders = moderatorOrders.filter(o => o.status === 'تم التسليم');
      const deliveries = deliveredOrders.length;
      const deliveryCommission = deliveredOrders.reduce((acc, order) => acc + (order.deliveryCommission || 0), 0);

      const totalCommission = salesCommission + deliveryCommission;
      
      return {
        moderator: moderator.name,
        sales,
        salesCommission,
        deliveries,
        deliveryCommission,
        totalCommission,
      };
    }).filter(d => d.totalCommission > 0 || d.sales > 0);
  }, [fromDate, toDate]);


    const chartData = commissionReportData.map(d => ({ moderator: d.moderator, totalCommission: d.totalCommission }));
    const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'التقارير' : 'Reports'} />
      <div className="space-y-8">
        <CommissionChart data={chartData} />
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>{language === 'ar' ? 'تقرير العمولات التفصيلي' : 'Detailed Commission Report'}</CardTitle>
                    <CardDescription>{language === 'ar' ? 'ملخص عمولات الوسطاء حسب النطاق الزمني' : 'Moderator commissions summary by date range'}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'} />
                    <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'} />
                    <Button className="w-full sm:w-auto">{language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {isMobile ? (
                 <div className="space-y-4">
                    {commissionReportData.map((row, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-lg">{row.moderator}</CardTitle>
                                <CardDescription>{language === 'ar' ? 'إجمالي العمولة:' : 'Total Commission:'} <span className="font-bold text-primary">{formatCurrency(row.totalCommission)}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>{language === 'ar' ? 'المبيعات' : 'Sales'}</span> <span>{formatCurrency(row.sales)}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'عمولة البيع' : 'Sales Commission'}</span> <span>{formatCurrency(row.salesCommission)}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'التسليمات' : 'Deliveries'}</span> <span>{row.deliveries}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'عمولة التسليم' : 'Delivery Commission'}</span> <span>{formatCurrency(row.deliveryCommission)}</span></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-start">{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'المبيعات' : 'Sales'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة البيع' : 'Sales Commission'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'التسليمات' : 'Deliveries'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة التسليم' : 'Delivery Commission'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {commissionReportData.map((row, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium text-start">{row.moderator}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.sales)}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.salesCommission)}</TableCell>
                        <TableCell className="text-end">{row.deliveries}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.deliveryCommission)}</TableCell>
                        <TableCell className="text-end font-medium">{formatCurrency(row.totalCommission)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'تقارير إضافية' : 'Additional Reports'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                     <Link href="/reports/products">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{language === 'ar' ? 'تقرير المنتجات' : 'Products Report'}</CardTitle>
                                <Arrow className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    {language === 'ar' ? 'عرض قائمة بجميع المنتجات وأسعارها وحالاتها.' : 'View a list of all products, their prices, and stock status.'}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/reports/staff">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">{language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'}</CardTitle>
                                <Arrow className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">
                                    {language === 'ar' ? 'عرض ملخص أداء الوسطاء والمندوبين.' : 'View a performance summary for moderators and couriers.'}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
