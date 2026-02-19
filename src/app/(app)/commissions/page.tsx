
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/components/language-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase"
import type { CommissionRule, OrderStatus } from "@/lib/types"
import { ref, set } from "firebase/database"

const commissionableStatuses: OrderStatus[] = ["تم التسجيل", "قيد التجهيز", "تم التسليم للمندوب", "تم التسليم للعميل"];

const commissionFormSchema = z.object({
  "تم التسجيل": z.coerce.number().min(0, "يجب أن يكون المبلغ 0 أو أكثر"),
  "قيد التجهيز": z.coerce.number().min(0, "يجب أن يكون المبلغ 0 أو أكثر"),
  "تم التسليم للمندوب": z.coerce.number().min(0, "يجب أن يكون المبلغ 0 أو أكثر"),
  "تم التسليم للعميل": z.coerce.number().min(0, "يجب أن يكون المبلغ 0 أو أكثر"),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;

export default function CommissionsPage() {
  const { toast } = useToast()
  const { language } = useLanguage();
  const database = useDatabase();

  const rulesRef = useMemoFirebase(() => database ? ref(database, "commission-rules") : null, [database]);
  const { data: commissionRulesData, isLoading } = useCollection<CommissionRule>(rulesRef);
  
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      "تم التسجيل": 0,
      "قيد التجهيز": 0,
      "تم التسليم للمندوب": 0,
      "تم التسليم للعميل": 0,
    }
  });

  const commissionRules = React.useMemo(() => {
    if (!commissionRulesData) return [];
    // The hook returns an array, but our data is an object.
    // Let's handle both cases for robustness.
    if (Array.isArray(commissionRulesData)) {
      return commissionRulesData;
    }
    return Object.entries(commissionRulesData).map(([id, value]) => ({ id, ...value as any }));
  }, [commissionRulesData]);


  React.useEffect(() => {
    if (commissionRulesData) {
      const initialValues: any = {};
      
      const rulesMap = new Map<string, number>();
      // Handle if data is array or object
      if(Array.isArray(commissionRulesData)) {
        commissionRulesData.forEach(rule => rulesMap.set(rule.id, rule.amount));
      } else if (typeof commissionRulesData === 'object' && commissionRulesData !== null) {
        Object.entries(commissionRulesData).forEach(([id, rule]: [string, any]) => {
          if(rule && typeof rule.amount === 'number') {
            rulesMap.set(id, rule.amount);
          }
        });
      }

      commissionableStatuses.forEach(status => {
        initialValues[status] = rulesMap.get(status) || 0;
      });

      form.reset(initialValues);
    }
  }, [commissionRulesData, form]);

  async function onSubmit(data: CommissionFormValues) {
    if (!database) return;

    try {
        const rulesToSave: { [key: string]: { amount: number } } = {};
        commissionableStatuses.forEach(status => {
            rulesToSave[status] = { amount: data[status] || 0 };
        });

        await set(ref(database, 'commission-rules'), rulesToSave);
        
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
            {language === 'ar' ? 'قم بتعيين مبالغ العمولات لكل حالة من حالات الطلب.' : 'Set commission amounts for each order status.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {commissionableStatuses.map(status => (
                  <FormField
                    key={status}
                    control={form.control}
                    name={status}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{status}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قواعد العمولات الحالية' : 'Current Commission Rules'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'قائمة بمبالغ العمولات الحالية لكل حالة.' : 'List of current commission amounts per status.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionableStatuses.map((status) => {
                  const rule = commissionRules.find(r => r.id === status);
                  return (
                    <TableRow key={status}>
                      <TableCell className="font-medium">{status}</TableCell>
                      <TableCell className="text-end">{formatCurrency(rule?.amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
