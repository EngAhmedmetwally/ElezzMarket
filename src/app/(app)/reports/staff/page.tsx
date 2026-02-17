
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { mockOrders, mockUsers } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffPerformanceChart } from "../components/staff-performance-chart";

export default function StaffReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

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
  
  const moderatorsChartData = moderatorsReport.map(m => ({ name: m.name, value: m.processedOrders }));
  const couriersChartData = couriersReport.map(c => ({ name: c.name, value: c.completionRate }));


  return (
    <div>
      <PageHeader title={language === 'ar' ? 'تقرير الموظفين' : 'Staff Report'} />
      <div className="space-y-8">
        <StaffPerformanceChart 
            data={moderatorsChartData} 
            title={language === 'ar' ? 'الطلبات المعالجة لكل وسيط' : 'Orders Processed per Moderator'}
            barDataKey="orders"
            barLabel={language === 'ar' ? 'الطلبات' : 'Orders'}
        />
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أداء الوسطاء' : 'Moderators Performance'}</CardTitle>
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

        <StaffPerformanceChart 
            data={couriersChartData} 
            title={language === 'ar' ? 'نسبة إنجاز المناديب' : 'Courier Completion Rate'}
            barDataKey="rate"
            barLabel={language === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}
            formatter={(value) => `${value.toFixed(0)}%`}
        />

         <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'أداء المناديب' : 'Couriers Performance'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'ملخص أداء المناديب' : 'Performance summary for couriers'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isMobile ? (
                <div className="space-y-4">
                    {couriersReport.map(cour => (
                        <Card key={cour.id}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={cour.avatarUrl} alt={cour.name} data-ai-hint="avatar" />
                                        <AvatarFallback>{cour.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{cour.name}</CardTitle>
                                        <CardDescription>{(cour.completionRate).toFixed(0)}% {language === 'ar' ? 'إنجاز' : 'completion'}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                             <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>{language === 'ar' ? 'إجمالي المسند' : 'Total Assigned'}</span> <span>{cour.assignedCount}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'تم التسليم' : 'Delivered'}</span> <span>{cour.delivered}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'مرتجع' : 'Returned'}</span> <span>{cour.returned}</span></div>
                                <div className="flex justify-between"><span>{language === 'ar' ? 'لم يرد' : 'No Answer'}</span> <span>{cour.noAnswer}</span></div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
