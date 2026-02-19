
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase";
import { ref, set, push, update, remove } from "firebase/database";
import type { ShippingZone } from "@/lib/types";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const zoneFormSchema = z.object({
  name: z.string().min(1, "اسم المنطقة مطلوب"),
  cost: z.coerce.number().min(0, "التكلفة يجب أن تكون رقمًا موجبًا"),
});
type ZoneFormValues = z.infer<typeof zoneFormSchema>;

export default function ShippingPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const [version, setVersion] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [selectedZone, setSelectedZone] = React.useState<ShippingZone | null>(null);

  const zonesQuery = useMemoFirebase(() => database ? ref(database, 'shipping-zones') : null, [database, version]);
  const { data: zones, isLoading } = useCollection<ShippingZone>(zonesQuery);

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: { name: "", cost: 0 },
  });

  React.useEffect(() => {
    if (selectedZone) {
      form.reset(selectedZone);
    } else {
      form.reset({ name: "", cost: 0 });
    }
  }, [selectedZone, form]);

  const handleDialogOpen = (zone: ShippingZone | null) => {
    setSelectedZone(zone);
    setDialogOpen(true);
  };
  
  const handleDeleteAlertOpen = (zone: ShippingZone) => {
    setSelectedZone(zone);
    setDeleteAlertOpen(true);
  };

  const onSubmit = async (data: ZoneFormValues) => {
    if (!database) return;
    try {
      if (selectedZone) {
        // Edit
        await update(ref(database, `shipping-zones/${selectedZone.id}`), data);
        toast({ title: language === 'ar' ? 'تم تحديث المنطقة' : 'Zone Updated' });
      } else {
        // Add
        const newZoneRef = push(ref(database, 'shipping-zones'));
        await set(newZoneRef, data);
        toast({ title: language === 'ar' ? 'تمت إضافة المنطقة' : 'Zone Added' });
      }
      setVersion(v => v + 1);
      setDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  };

  const onDelete = async () => {
    if (!database || !selectedZone) return;
    try {
      await remove(ref(database, `shipping-zones/${selectedZone.id}`));
      toast({ title: language === 'ar' ? 'تم حذف المنطقة' : 'Zone Deleted' });
      setVersion(v => v + 1);
      setDeleteAlertOpen(false);
    } catch (error) {
       toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: (error as Error).message });
    }
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'مناطق الشحن' : 'Shipping Zones'}>
        <Button onClick={() => handleDialogOpen(null)}>
          <PlusCircle className="me-2 h-4 w-4" />
          {language === 'ar' ? 'إضافة منطقة' : 'Add Zone'}
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة المناطق' : 'Zones List'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableHead>
                  <TableHead className="text-end">{language === 'ar' ? 'التكلفة' : 'Cost'}</TableHead>
                  <TableHead className="text-center w-24">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones?.map(zone => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell className="text-end">{formatCurrency(zone.cost)}</TableCell>
                    <TableCell className="text-center">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDialogOpen(zone)}>
                              <Edit className="me-2 h-4 w-4" />
                              <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAlertOpen(zone)}>
                              <Trash2 className="me-2 h-4 w-4" />
                              <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedZone ? (language === 'ar' ? 'تعديل منطقة' : 'Edit Zone') : (language === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Zone')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'اسم المنطقة' : 'Zone Name'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button></DialogClose>
                  <Button type="submit">{language === 'ar' ? 'حفظ' : 'Save'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنطقة بشكل دائم.' : 'This action cannot be undone. This will permanently delete the shipping zone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">{language === 'ar' ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
