
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { mockOrders, mockUsers } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function StaffReportPage() {
  const { language } = useLanguage();

  const moderatorsReport = React.useMemo(() => {
    const moderators = mockUsers.filter(u => u.role === "Moderator");
    return moderators.map(mod => {
      const processedOrders = mockOrders.filter(o => o.moderatorId === mod.id).length;
      return {
        ...mod,
        processedOrders,
      };
    });
  }, []);

  const couriersReport = React.useMemo(() => {
    const couriers = mockUsers.filter(u => u.role === "Courier");
    return couriers.map(cour => {
      const assignedOrders = mockOrders.filter(o => o.courierId === cour.id);
      const delivered = assignedOrders.filter(o => o.status === "تم التسليم").length;
      const returned = assignedOrders.filter(o => o.status === "مرتجع").length;
      const noAnswer = assignedOrders.filter(o => o.status === "لم يرد").length;
      const totalAttempted = delivered + returned + noAnswer;
      const completionRate = totalAttempted > 0 ? (delivered / totalAttempted) * 100 : 0;
      
      return {
        ...cour,
        assignedCount: assignedOrders.length,
        delivered,
        returned,
        noAnswer,
        completionRate,
      };
    });
  }, []);


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقرير الوسطاء' : 'Moderators Report'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص أداء الوسطاء' : 'Performance summary for moderators'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{language === 'ar' ? 'الوسيط' : 'Moderator'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'إجمالي الطلبات المعالجة' : 'Total Orders Processed'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moderatorsReport.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium text-start">
                       <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={mod.avatarUrl} alt={mod.name} data-ai-hint="avatar" />
                                <AvatarFallback>{mod.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{mod.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-end">{mod.processedOrders}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'تقرير المناديب' : 'Couriers Report'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص أداء المناديب' : 'Performance summary for couriers'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{language === 'ar' ? 'المندوب' : 'Courier'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'إجمالي المسند' : 'Total Assigned'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'مرتجع' : 'Returned'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'لم يرد' : 'No Answer'}</TableHead>
                  <TableHead className="w-[120px] text-end">{language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couriersReport.map((cour) => (
                  <TableRow key={cour.id}>
                    <TableCell className="font-medium text-start">
                       <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={cour.avatarUrl} alt={cour.name} data-ai-hint="avatar" />
                                <AvatarFallback>{cour.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{cour.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-end">{cour.assignedCount}</TableCell>
                    <TableCell className="text-end">{cour.delivered}</TableCell>
                    <TableCell className="text-end">{cour.returned}</TableCell>
                    <TableCell className="text-end">{cour.noAnswer}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">{cour.completionRate.toFixed(0)}%</span>
                        <Progress value={cour.completionRate} className="h-2 w-20" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

