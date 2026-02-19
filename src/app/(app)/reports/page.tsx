
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
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase";
import type { Order, User, Commission } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ref, get } from "firebase/database";


function ReportsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[350px] w-full" />
      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-80" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Skeleton className="h-10 w-full sm:w-40" />
                  <Skeleton className="h-10 w-full sm:w-40" />
                  <Skeleton className="h-10 w-full sm:w-28" />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
       <Card>
          <CardHeader>
              <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-36" />
                  <Skeleton className="h-36" />
              </div>
          </CardContent>
      </Card>
    </div>
  )
}

export default function ReportsPage() {
    const { language, isRTL } = useLanguage();
    const isMobile = useIsMobile();
    const database = useDatabase();
    const [version, setVersion] = React.useState(0);
    const [fromDate, setFromDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    const [toDate, setToDate] = React.useState<Date | undefined>(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    );
    const Arrow = isRTL ? ArrowLeft : ArrowRight;

    const usersQuery = useMemoFirebase(() => database ? ref(database, "users") : null, [database, version]);
    const { data: usersData, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const commissionsQuery = useMemoFirebase(() => database ? ref(database, "commissions") : null, [database, version]);
    const { data: commissionsData, isLoading: isLoadingCommissions } = useCollection<Commission>(commissionsQuery);

    const commissionReportData = React.useMemo(() => {
        if (!commissionsData || !usersData) return [];

        const filteredCommissions = commissionsData.filter(commission => {
            if (!commission.calculationDate) return false;
            const commissionDate = new Date(commission.calculationDate);
            if (fromDate) {
                const fromDateStart = new Date(fromDate);
                fromDateStart.setHours(0, 0, 0, 0);
                if (commissionDate < fromDateStart) return false;
            }
            if (toDate) {
                const toDateEnd = new Date(toDate);
                toDateEnd.setHours(23, 59, 59, 999);
                if (commissionDate > toDateEnd) return false;
            }
            return true;
        });

        const reportMap = new Map<string, { moderator: string; totalCommission: number; details: Map<string, number> }>();

        usersData.forEach(user => {
            if (user.role === 'Moderator' || user.role === 'Courier') {
                reportMap.set(user.id, {
                    moderator: user.name,
                    totalCommission: 0,
                    details: new Map(),
                });
            }
        });

        filteredCommissions.forEach(commission => {
            const userReport = reportMap.get(commission.userId);
            if (userReport) {
                userReport.totalCommission += commission.amount;
                const statusAmount = userReport.details.get(commission.orderStatus) || 0;
                userReport.details.set(commission.orderStatus, statusAmount + commission.amount);
            }
        });
        
        return Array.from(reportMap.values()).filter(d => d.totalCommission > 0);
    }, [commissionsData, usersData, fromDate, toDate]);


    const chartData = commissionReportData.map(d => ({ moderator: d.moderator, totalCommission: d.totalCommission }));
    const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);
    
    const isLoading = isLoadingUsers || isLoadingCommissions;

    if (isLoading) {
      return (
        <div>
          <PageHeader title={language === 'ar' ? 'التقارير' : 'Reports'} />
          <ReportsSkeleton />
        </div>
      )
    }

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
                    <CardDescription>{language === 'ar' ? 'ملخص عمولات الموظفين حسب النطاق الزمني' : 'Staff commissions summary by date range'}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'} />
                    <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'} />
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
                                {Array.from(row.details.entries()).map(([status, amount]) => (
                                    <div className="flex justify-between" key={status}><span>{language === 'ar' ? 'عمولة' : 'Commission'}: {status}</span> <span>{formatCurrency(amount)}</span></div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="text-start">{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة التسجيل' : 'Registration Comm.'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة التجهيز' : 'Processing Comm.'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة تسليم للمندوب' : 'Courier Handover Comm.'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'عمولة تسليم للعميل' : 'Customer Delivery Comm.'}</TableHead>
                    <TableHead className="text-end">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {commissionReportData.map((row, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium text-start">{row.moderator}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.details.get('تم التسجيل') || 0)}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.details.get('قيد التجهيز') || 0)}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.details.get('تم التسليم للمندوب') || 0)}</TableCell>
                        <TableCell className="text-end">{formatCurrency(row.details.get('تم التسليم للعميل') || 0)}</TableCell>
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
