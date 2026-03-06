
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { useDatabase, useUser as useAuthUser } from "@/firebase";
import { ref, push, set, remove } from "firebase/database";
import type { Adjustment, AdjustmentType, User } from "@/lib/types";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { DatePicker } from "@/components/ui/datepicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const adjustmentFormSchema = z.object({
  userId: z.string().min(1, "يجب اختيار الموظف"),
  type: z.enum(["bonus", "discount"]),
  category: z.string().min(1, "البند مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  date: z.string().min(1, "التاريخ مطلوب"),
  notes: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export default function AdjustmentsPage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  const [isAddDialogOpen, setIsAddUserOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
  const { data: adjustments, isLoading: isLoadingAdjustments } = useRealtimeCachedCollection<Adjustment>('adjustments');

  const staff = React.useMemo(() => users?.filter(u => u.role !== 'Admin') || [], [users]);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      userId: "",
      type: "bonus",
      category: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  async function onSubmit(data: AdjustmentFormValues) {
    if (!database || !authUser) return;

    const selectedStaff = staff.find(s => s.id === data.userId);
    if (!selectedStaff) return;

    try {
      const newAdjRef = push(ref(database, 'adjustments'));
      const newAdjustment: Adjustment = {
        id: newAdjRef.key!,
        userId: data.userId,
        userName: selectedStaff.name,
        type: data.type,
        category: data.category,
        amount: data.amount,
        date: data.date,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        createdBy: authUser.name || authUser.email || 'System',
      };

      await set(newAdjRef, newAdjustment);
      
      toast({
        title: language === 'ar' ? 'تمت الإضافة' : "Adjustment Added",
        description: language === 'ar' ? 'تم تسجيل البند بنجاح.' : "Adjustment has been recorded successfully.",
      });
      setIsAddUserOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  const handleDelete = async () => {
    if (!database || !deleteId) return;
    try {
      await remove(ref(database, `adjustments/${deleteId}`));
      toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted successfully' });
      setDeleteId(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const sortedAdjustments = React.useMemo(() => {
    return [...(adjustments || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [adjustments]);

  const isLoading = isLoadingUsers || isLoadingAdjustments;

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'الخصومات والمكافآت' : 'Bonuses & Discounts'}>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'إضافة بند جديد' : 'Add New Item'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'تسجيل مكافأة أو خصم' : 'Record Bonus or Discount'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'اختر الموظف ونوع البند والمبلغ.' : 'Select staff, type and amount.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الموظف' : 'Staff Member'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر الموظف' : 'Select staff'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'النوع' : 'Type'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bonus">{language === 'ar' ? 'مكافأة' : 'Bonus'}</SelectItem>
                          <SelectItem value="discount">{language === 'ar' ? 'خصم' : 'Discount'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'المبلغ' : 'Amount'}</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'بند التسوية' : 'Category'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر البند' : 'Select category'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="تميز أداء">{language === 'ar' ? 'تميز أداء' : 'Performance'}</SelectItem>
                        <SelectItem value="سلفة موظف">{language === 'ar' ? 'سلفة موظف' : 'Advance'}</SelectItem>
                        <SelectItem value="عجز تسليم">{language === 'ar' ? 'عجز تسليم' : 'Delivery Deficit'}</SelectItem>
                        <SelectItem value="خطأ إداري">{language === 'ar' ? 'خطأ إداري' : 'Admin Error'}</SelectItem>
                        <SelectItem value="أخرى">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'التاريخ' : 'Date'}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'ملاحظات إضافية' : 'Notes'}</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button></DialogClose>
                  <Button type="submit" disabled={form.formState.isSubmitting}>{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الموظف' : 'Staff'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'البند' : 'Category'}</TableHead>
                  <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                  <TableHead className="text-center w-20">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAdjustments.map(adj => (
                  <TableRow key={adj.id}>
                    <TableCell>
                      <div className="font-medium">{adj.userName}</div>
                      <div className="text-xs text-muted-foreground">{adj.createdBy}</div>
                    </TableCell>
                    <TableCell>{adj.date}</TableCell>
                    <TableCell>
                      <div>{adj.category}</div>
                      {adj.notes && <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={adj.notes}>{adj.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={adj.type === 'bonus' ? 'default' : 'destructive'} className={adj.type === 'bonus' ? 'bg-green-600' : ''}>
                        {adj.type === 'bonus' ? (language === 'ar' ? 'مكافأة' : 'Bonus') : (language === 'ar' ? 'خصم' : 'Discount')}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-end font-bold ${adj.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.type === 'bonus' ? '+' : '-'}{formatCurrency(adj.amount, language)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteId(adj.id)}>
                            <Trash2 className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedAdjustments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">{language === 'ar' ? 'لا توجد تسويات مسجلة.' : 'No adjustments recorded.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDesc>{language === 'ar' ? 'سيتم حذف هذا البند نهائياً من سجلات الموظف.' : 'This item will be permanently deleted from staff records.'}</AlertDialogDesc>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{language === 'ar' ? 'حذف نهائي' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
