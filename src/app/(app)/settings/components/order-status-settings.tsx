
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/firebase";
import { ref, set, update } from "firebase/database";
import type { OrderStatus, OrderStatusConfig } from "@/lib/types";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const statusFormSchema = z.object({
  level: z.coerce.number().int(),
  isGeneral: z.boolean(),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

const defaultStatuses: Omit<OrderStatusConfig, "id">[] = [
    { name: "تم التسجيل", level: 1, isGeneral: false },
    { name: "قيد التجهيز", level: 2, isGeneral: false },
    { name: "تم الشحن", level: 3, isGeneral: false },
    { name: "معلق", level: 4, isGeneral: false },
    { name: "مكتمل", level: 5, isGeneral: false },
    { name: "ملغي", level: 99, isGeneral: true },
];

export function OrderStatusSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatusConfig | null>(null);

  const { data: statuses, isLoading } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
  });

  // Initialize default statuses if they don't exist
  React.useEffect(() => {
    if (!isLoading && (!statuses || statuses.length === 0) && database) {
      const updates: { [key: string]: any } = {};
      defaultStatuses.forEach(status => {
        updates[`order-statuses/${status.name}`] = status;
      });
      update(ref(database), updates)
        .then(() => {
          toast({ title: language === 'ar' ? 'تم إعداد الحالات الافتراضية' : 'Default statuses initialized' });
        })
        .catch(err => {
          toast({ variant: 'destructive', title: language === 'ar' ? 'فشل الإعداد' : 'Initialization failed', description: err.message });
        });
    }
  }, [isLoading, statuses, database, toast, language]);

  const handleEditClick = (status: OrderStatusConfig) => {
    setSelectedStatus(status);
    form.reset({ level: status.level, isGeneral: status.isGeneral });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: StatusFormValues) => {
    if (!database || !selectedStatus) return;
    try {
      await update(ref(database, `order-statuses/${selectedStatus.id}`), {
        level: data.level,
        isGeneral: data.isGeneral,
      });
      toast({ title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated' });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  };
  
  const sortedStatuses = React.useMemo(() => {
    return [...(statuses || [])].sort((a,b) => a.level - b.level);
  }, [statuses]);

  if (isLoading) {
      return <Skeleton className="h-96 w-full" />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'إدارة حالات الطلب' : 'Manage Order Statuses'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'تحكم في ترتيب وتسلسل حالات الطلب. المستوى الأقل يسبق المستوى الأعلى.' : 'Control the order and flow of statuses. Lower levels come before higher levels.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                <TableHead>{language === 'ar' ? 'المستوى' : 'Level'}</TableHead>
                <TableHead>{language === 'ar' ? 'حالة عامة؟' : 'General?'}</TableHead>
                <TableHead className="text-end">{language === 'ar' ? 'إجراء' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStatuses.map(status => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">{status.name}</TableCell>
                  <TableCell>{status.level}</TableCell>
                  <TableCell>{status.isGeneral ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(status)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? `تعديل حالة: ${selectedStatus?.name}` : `Edit Status: ${selectedStatus?.name}`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'المستوى' : 'Level'}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isGeneral" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{language === 'ar' ? 'حالة عامة' : 'General Status'}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'الحالات العامة (مثل "ملغي") يمكن الوصول إليها من أي حالة أخرى.' : 'General statuses (like "Cancelled") can be reached from any other status.'}
                    </p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button></DialogClose>
                <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
