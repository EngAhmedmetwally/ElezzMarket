"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/language-provider"
import { mockCommissionRules } from "@/lib/data"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const commissionFormSchema = z.object({
  sale: z.object({
    amount: z.coerce.number({invalid_type_error: "Please enter a number."}).min(0),
    dateRange: z.object({
      from: z.date({ required_error: "A from date is required." }),
      to: z.date({ required_error: "A to date is required." }),
    }),
  }),
  delivery: z.object({
    amount: z.coerce.number({invalid_type_error: "Please enter a number."}).min(0),
    dateRange: z.object({
      from: z.date({ required_error: "A from date is required." }),
      to: z.date({ required_error: "A to date is required." }),
    }),
  }),
  return: z.object({
    amount: z.coerce.number({invalid_type_error: "Please enter a number."}).min(0),
    dateRange: z.object({
      from: z.date({ required_error: "A from date is required." }),
      to: z.date({ required_error: "A to date is required." }),
    }),
  }),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

function DatePickerWithRange({
  field,
  className,
}: {
  field: any
  className?: string
}) {
  const { language } = useLanguage();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: field.value?.from,
    to: field.value?.to,
  })

  React.useEffect(() => {
    field.onChange(date)
  }, [date, field])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full md:w-[300px] justify-start text-left font-normal",
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
        <PopoverContent className="w-auto p-0" align="start">
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
    </div>
  )
}

function CommissionSection({ form, type, title, titleAr }: { form: any, type: "sale" | "delivery" | "return", title: string, titleAr: string }) {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="font-semibold">{language === 'ar' ? titleAr : title}</h4>
       <div className="grid md:grid-cols-2 gap-4 items-start">
        <FormField
          control={form.control}
          name={`${type}.amount`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'المبلغ' : 'Amount'}</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${type}.dateRange`}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{language === 'ar' ? 'من تاريخ إلى تاريخ' : 'From Date to Date'}</FormLabel>
               <DatePickerWithRange field={field} />
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
              <CommissionSection form={form} type="return" title="Return Commission" titleAr="عمولة الإرجاع" />

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
                <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead>{language === 'ar' ? 'من تاريخ' : 'From Date'}</TableHead>
                <TableHead>{language === 'ar' ? 'إلى تاريخ' : 'To Date'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCommissionRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{language === 'ar' ? (rule.type === 'Sale' ? 'بيع' : rule.type === 'Delivery' ? 'تسليم' : 'إرجاع') : rule.type}</TableCell>
                  <TableCell>{rule.amount}</TableCell>
                  <TableCell>{format(new Date(rule.fromDate), "PPP")}</TableCell>
                  <TableCell>{format(new Date(rule.toDate), "PPP")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
