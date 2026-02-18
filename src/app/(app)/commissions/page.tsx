
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { ref, set } from "firebase/database"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/language-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/datepicker"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase"
import type { CommissionRule } from "@/lib/types"

const commissionFormSchema = z.object({
  sale: z.object({
    amount: z.coerce.number({invalid_type_error: "Please enter a number."}).min(0),
    fromDate: z.date({ required_error: "A from date is required." }),
    toDate: z.date({ required_error: "A to date is required." }),
  }),
  delivery: z.object({
    amount: z.coerce.number({invalid_type_error: "Please enter a number."}).min(0),
    fromDate: z.date({ required_error: "A from date is required." }),
    toDate: z.date({ required_error: "A to date is required." }),
  }),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

function CommissionSection({ form, type, title, titleAr }: { form: any, type: "sale" | "delivery", title: string, titleAr: string }) {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="font-semibold">{language === 'ar' ? titleAr : title}</h4>
       <div className="grid md:grid-cols-3 gap-4 items-start">
        <FormField
          control={form.control}
          name={`${type}.amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'المبلغ' : 'Amount'}</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.fromDate`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{language === 'ar' ? 'من تاريخ' : 'From Date'}</FormLabel>
               <DatePicker date={field.value} onDateChange={field.onChange} placeholder={language === 'ar' ? "اختر تاريخ البدء" : "Pick a start date"} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.toDate`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</FormLabel>
               <DatePicker date={field.value} onDateChange={field.onChange} placeholder={language === 'ar' ? "اختر تاريخ الانتهاء" : "Pick an end date"} />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default function CommissionsPage() {
  const { toast } = useToast()
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const database = useDatabase();

  const rulesQuery = useMemoFirebase(() => database ? ref(database, "commission-rules") : null, [database]);
  const { data: commissionRules } = useCollection<CommissionRule>(rulesQuery);
  
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
  });

  React.useEffect(() => {
    if (commissionRules) {
      const saleRule = commissionRules.find(r => r.id === 'sale');
      const deliveryRule = commissionRules.find(r => r.id === 'delivery');
      
      form.reset({
        sale: {
          amount: saleRule?.amount || 0,
          fromDate: saleRule?.fromDate ? new Date(saleRule.fromDate) : new Date(),
          toDate: saleRule?.toDate ? new Date(saleRule.toDate) : new Date(),
        },
        delivery: {
          amount: deliveryRule?.amount || 0,
          fromDate: deliveryRule?.fromDate ? new Date(deliveryRule.fromDate) : new Date(),
          toDate: deliveryRule?.toDate ? new Date(deliveryRule.toDate) : new Date(),
        },
      });
    }
  }, [commissionRules, form]);

  async function onSubmit(data: CommissionFormValues) {
    if (!database) return;

    try {
        const saleRuleRef = ref(database, 'commission-rules/sale');
        const deliveryRuleRef = ref(database, 'commission-rules/delivery');

        const newSaleRule: Omit<CommissionRule, 'id'> = {
          type: 'بيع',
          amount: data.sale.amount,
          fromDate: data.sale.fromDate.toISOString(),
          toDate: data.sale.toDate.toISOString(),
        };
        const newDeliveryRule: Omit<CommissionRule, 'id'> = {
          type: 'تسليم',
          amount: data.delivery.amount,
          fromDate: data.delivery.fromDate.toISOString(),
          toDate: data.delivery.toDate.toISOString(),
        };
        
        await set(saleRuleRef, newSaleRule);
        await set(deliveryRuleRef, newDeliveryRule);
        
        toast({
          title: language === 'ar' ? 'تم تحديث العمولات' : "Commissions Updated",
          description: language === 'ar' ? 'تم حفظ قواعد العمولات بنجاح.' : "Commission rules have been saved successfully.",
        })
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ' : "Error",
            description: language === 'ar' ? 'فشل حفظ العمولات.' : "Failed to save commissions.",
        });
        console.error("Commission save error:", e);
    }
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'العمولات' : 'Commissions'} />
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إدارة نظام العمولات' : 'Commission System Management'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'قم بتعيين مبالغ العمولات ونطاقاتها الزمنية لأنواع الإجراءات المختلفة.' : 'Set commission amounts and their date ranges for different action types.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CommissionSection form={form} type="sale" title="Sale Commission" titleAr="عمولة البيع" />
              <CommissionSection form={form} type="delivery" title="Delivery Commission" titleAr="عمولة التسليم" />

              <div className="flex justify-end">
                <Button type="submit">{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قواعد العمولات المسجلة' : 'Registered Commission Rules'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'قائمة بقواعد العمولات الحالية.' : 'List of current commission rules.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile ? (
             <div className="space-y-4">
                {commissionRules?.map((rule) => (
                    <Card key={rule.id}>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg">{rule.type}</CardTitle>
                            <CardDescription>{language === 'ar' ? 'المبلغ:' : 'Amount:'} <span className="font-bold text-primary">{formatCurrency(rule.amount)}</span></CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'ar' ? 'من تاريخ:' : 'From:'}</span>
                                <span>{rule.fromDate ? format(new Date(rule.fromDate), "PPP") : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'ar' ? 'إلى تاريخ:' : 'To:'}</span>
                                <span>{rule.toDate ? format(new Date(rule.toDate), "PPP") : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead className="text-center">{language === 'ar' ? 'من تاريخ' : 'From Date'}</TableHead>
                  <TableHead className="text-center">{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionRules?.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-start">{rule.type}</TableCell>
                    <TableCell className="text-end">{formatCurrency(rule.amount)}</TableCell>
                    <TableCell className="text-center">{rule.fromDate ? format(new Date(rule.fromDate), "PPP") : '-'}</TableCell>
                    <TableCell className="text-center">{rule.toDate ? format(new Date(rule.toDate), "PPP") : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
