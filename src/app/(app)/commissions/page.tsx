"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/language-provider"
import { mockCommissionRules } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/datepicker"

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
                <Input type="number" placeholder="50" {...field} />
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
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
  });

  function onSubmit(data: CommissionFormValues) {
    console.log(data)
    toast({
      title: language === 'ar' ? 'تم تحديث العمولات' : "Commissions Updated",
      description: language === 'ar' ? 'تم حفظ قواعد العمولات بنجاح.' : "Commission rules have been saved successfully.",
    })
  }

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead className="text-center">{language === 'ar' ? 'من تاريخ' : 'From Date'}</TableHead>
                <TableHead className="text-center">{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCommissionRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-center">{rule.type}</TableCell>
                  <TableCell className="text-end">{rule.amount}</TableCell>
                  <TableCell className="text-center">{format(new Date(rule.fromDate), "PPP")}</TableCell>
                  <TableCell className="text-center">{format(new Date(rule.toDate), "PPP")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
