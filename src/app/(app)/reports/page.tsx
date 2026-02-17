"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const commissionReportData = [
  { moderator: 'Ali Hassan', sales: 'EGP 50,000', salesCommission: 'EGP 2,500', deliveries: 100, deliveryCommission: 'EGP 1,000', returns: 5, returnCommission: '- EGP 250', totalCommission: 'EGP 3,250' },
  { moderator: 'Fatima Ahmed', sales: 'EGP 45,000', salesCommission: 'EGP 2,250', deliveries: 90, deliveryCommission: 'EGP 900', returns: 2, returnCommission: '- EGP 100', totalCommission: 'EGP 3,050' },
  { moderator: 'Another Moderator', sales: 'EGP 60,000', salesCommission: 'EGP 3,000', deliveries: 120, deliveryCommission: 'EGP 1,200', returns: 8, returnCommission: '- EGP 400', totalCommission: 'EGP 3,800' },
];


export default function ReportsPage() {
  const { language } = useLanguage();
    const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  })

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
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y")} -{" "}
                                {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                            ) : (
                            <span>{language === 'ar' ? 'اختر تاريخ' : 'Pick a date'}</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button>{language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}</Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المبيعات' : 'Sales'}</TableHead>
                  <TableHead>{language === 'ar' ? 'عمولة البيع' : 'Sales Commission'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التسليمات' : 'Deliveries'}</TableHead>
                  <TableHead>{language === 'ar' ? 'عمولة التسليم' : 'Delivery Commission'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المرتجعات' : 'Returns'}</TableHead>
                  <TableHead>{language === 'ar' ? 'عمولة الإرجاع' : 'Return Commission'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'إجمالي العمولة' : 'Total Commission'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionReportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.moderator}</TableCell>
                    <TableCell>{row.sales}</TableCell>
                    <TableCell>{row.salesCommission}</TableCell>
                    <TableCell>{row.deliveries}</TableCell>
                    <TableCell>{row.deliveryCommission}</TableCell>
                    <TableCell>{row.returns}</TableCell>
                    <TableCell className="text-destructive">{row.returnCommission}</TableCell>
                    <TableCell className="text-right font-medium">{row.totalCommission}</TableCell>
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
