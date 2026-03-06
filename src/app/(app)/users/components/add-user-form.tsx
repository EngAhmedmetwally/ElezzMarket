
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { User, AppSettings, Permissions } from "@/lib/types";
import { useDatabase, useDoc, useMemoFirebase } from "@/firebase";
import { ref, set, push, update, get } from "firebase/database";


const permissionsSchema = z.object({
  view: z.boolean().default(false),
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const orderPermissionsSchema = permissionsSchema.extend({
    editStatus: z.boolean().default(false),
    cancel: z.boolean().default(false),
    cancelCompleted: z.boolean().default(false),
});

const reportPermissionsSchema = z.object({
  commissions: permissionsSchema.pick({ view: true }),
  products: permissionsSchema.pick({ view: true }),
  staff: permissionsSchema.pick({ view: true }),
  daily: permissionsSchema.pick({ view: true }),
  courierCollection: permissionsSchema.pick({ view: true }),
  shipping: permissionsSchema.pick({ view: true }),
  preparationTime: permissionsSchema.pick({ view: true }),
  cancelled: permissionsSchema.pick({ view: true }),
  adjustments: permissionsSchema.pick({ view: true }),
});


const getUserFormSchema = (isEditMode: boolean) => z.object({
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  username: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(["Admin", "Moderator", "Courier"]),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  orderVisibility: z.enum(["all", "own"]).default("own"),
  permissions: z.object({
    dashboard: permissionsSchema.pick({ view: true }),
    orders: orderPermissionsSchema,
    customers: permissionsSchema.pick({ view: true }),
    products: permissionsSchema,
    users: permissionsSchema,
    shipping: permissionsSchema,
    onHoldOrders: permissionsSchema.pick({ view: true }),
    commissions: permissionsSchema.pick({ view: true, edit: true }),
    adjustments: permissionsSchema,
    settings: permissionsSchema.pick({ view: true, edit: true }),
    reports: reportPermissionsSchema,
  }).optional(),
}).superRefine((data, ctx) => {
    if (data.role !== 'Courier') {
        if (!data.username || data.username.length < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "اسم المستخدم مطلوب",
                path: ['username'],
            });
        }
        if (!isEditMode && (!data.password || data.password.length < 6)) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "كلمة المرور يجب أن لا تقل عن 6 أحرف",
                path: ['password'],
            });
        }
        if (isEditMode && data.password && data.password.length > 0 && data.password.length < 6) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "كلمة المرور يجب أن لا تقل عن 6 أحرف",
                path: ['password'],
            });
        }
    }
});


type UserFormValues = z.infer<ReturnType<typeof getUserFormSchema>>;

const screensConfig = [
  { id: 'dashboard', name: 'Dashboard', arName: 'لوحة التحكم', perms: ['view'] },
  { id: 'orders', name: 'Orders', arName: 'الطلبات', perms: ['view', 'add', 'edit', 'delete', 'editStatus', 'cancel', 'cancelCompleted'] },
  { id: 'customers', name: 'Customers', arName: 'العملاء', perms: ['view'] },
  { id: 'products', name: 'Products', arName: 'المنتجات', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'users', name: 'Users', arName: 'المستخدمون', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'shipping', name: 'Shipping', arName: 'الشحن', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'onHoldOrders', name: 'On Hold Orders', arName: 'الطلبات المعلقة', perms: ['view'] },
  { id: 'commissions', name: 'Commissions', arName: 'العمولات', perms: ['view', 'edit'] },
  { id: 'adjustments', name: 'Adjustments', arName: 'الخصومات والمكافآت', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'settings', name: 'Settings', arName: 'الإعدادات', perms: ['view', 'edit'] },
] as const;

const reportScreensConfig = [
    { id: 'commissions', name: 'Commissions', arName: 'العمولات' },
    { id: 'adjustments', name: 'Bonuses & Discounts', arName: 'الخصومات والمكافآت' },
    { id: 'products', name: 'Products', arName: 'المنتجات' },
    { id: 'staff', name: 'Staff', arName: 'الموظفون' },
    { id: 'daily', name: 'Daily', arName: 'اليومي' },
    { id: 'courierCollection', name: 'Courier Collection', arName: 'تحصيل المناديب' },
    { id: 'shipping', name: 'Shipping', arName: 'الشحن' },
    { id: 'preparationTime', name: 'Preparation Time', arName: 'وقت التجهيز' },
    { id: 'cancelled', name: 'Cancelled Orders', arName: 'الطلبات الملغاة' },
] as const;


const permLabels = {
    view: { en: 'View', ar: 'عرض' },
    add: { en: 'Add', ar: 'إضافة' },
    edit: { en: 'Edit', ar: 'تعديل' },
    delete: { en: 'Delete', ar: 'حذف' },
    editStatus: { en: 'Edit Status', ar: 'تعديل الحالة' },
    cancel: { en: 'Cancel', ar: 'إلغاء' },
    cancelCompleted: { en: 'Cancel Completed', ar: 'إلغاء المكتمل' },
};
type Perm = keyof typeof permLabels;

interface AddUserFormProps {
  onSuccess?: () => void;
  userToEdit?: User;
}

const defaultPermissions: Permissions = {
    dashboard: { view: true },
    orders: { view: true, add: true, edit: false, delete: false, editStatus: true, cancel: false, cancelCompleted: false },
    customers: { view: true },
    products: { view: true, add: true, edit: true, delete: false },
    users: { view: false, add: false, edit: false, delete: false },
    shipping: { view: true, add: true, edit: true, delete: false },
    onHoldOrders: { view: true },
    commissions: { view: true, edit: true },
    adjustments: { view: true, add: true, edit: true, delete: false },
    settings: { view: false, edit: false },
    reports: {
        commissions: { view: true },
        adjustments: { view: true },
        products: { view: true },
        staff: { view: true },
        daily: { view: true },
        courierCollection: { view: true },
        shipping: { view: true },
        preparationTime: { view: true },
        cancelled: { view: true },
    },
};

export function AddUserForm({ onSuccess, userToEdit }: AddUserFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const database = useDatabase();
  const isEditMode = !!userToEdit;
  
  const formSchema = getUserFormSchema(isEditMode);
  
  const appSettingsRef = useMemoFirebase(() => database ? ref(database, 'app-settings/main') : null, [database]);
  const { data: appSettings } = useDoc<AppSettings>(appSettingsRef);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      username: "",
      password: "",
      role: "Moderator",
      phone1: "",
      phone2: "",
      orderVisibility: "own",
      permissions: defaultPermissions
    },
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const role = form.watch("role");

  React.useEffect(() => {
    if (userToEdit) {
      // Safely merge permissions
      const basePerms = userToEdit.permissions || defaultPermissions;
      const reportPerms = (userToEdit.permissions?.reports || defaultPermissions.reports) as any;

      const mergedPermissions = {
          ...defaultPermissions,
          ...basePerms,
          reports: {
              ...defaultPermissions.reports,
              ...reportPerms
          }
      };

      form.reset({
        fullName: userToEdit.name,
        username: userToEdit.username,
        password: '',
        role: userToEdit.role,
        phone1: userToEdit.phone1 || "",
        phone2: userToEdit.phone2 || "",
        orderVisibility: userToEdit.orderVisibility || 'own',
        permissions: mergedPermissions as any
      });
    }
  }, [userToEdit, form])


  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    if (!database) {
        toast({ variant: "destructive", title: "Database error" });
        setIsSubmitting(false);
        return;
    }
    
    let finalPermissions: any = data.permissions;
    if (data.role === 'Courier') {
        finalPermissions = defaultPermissions; // Basic courier set
    }

    try {
        if (isEditMode && userToEdit) {
            const userRef = ref(database, `users/${userToEdit.id}`);
            const username = data.role === 'Courier' ? userToEdit.username : (data.username || userToEdit.username);
            
            const userDataToUpdate: any = {
              name: data.fullName,
              username: username,
              email: `${username}@elezz.com`,
              role: data.role,
              phone1: data.phone1 || "",
              phone2: data.phone2 || "",
              orderVisibility: data.orderVisibility,
              permissions: finalPermissions,
            };

            if(data.password) userDataToUpdate.password = data.password;

            await update(userRef, userDataToUpdate);
            toast({ title: language === 'ar' ? 'تم التحديث' : "Updated" });
            onSuccess?.();
        } else {
            const newUserRef = push(ref(database, 'users'));
            const newUserId = newUserRef.key!;
            const username = data.username!;
            
            const newUser: User = {
                id: newUserId,
                name: data.fullName,
                username: username,
                email: `${username}@elezz.com`,
                password: data.password!,
                role: data.role,
                phone1: data.phone1 || "",
                phone2: data.phone2 || "",
                orderVisibility: data.orderVisibility,
                permissions: finalPermissions as any,
                createdAt: new Date().toISOString(),
                status: "نشط",
                avatarUrl: `/avatars/0${(Math.floor(Math.random() * 6)) + 1}.png`
            };

            await set(newUserRef, newUser);
            toast({ title: language === 'ar' ? 'تم الإنشاء' : "Created" });
            onSuccess?.();
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  const roles = {
    Admin: language === 'ar' ? 'مدير' : 'Admin',
    Moderator: language === 'ar' ? 'وسيط' : 'Moderator',
    Courier: language === 'ar' ? 'مندوب' : 'Courier',
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {role !== 'Courier' && (
            <>
                <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{language === 'ar' ? 'كلمة المرور' : 'Password'}</FormLabel>
                    <FormControl><Input type="password" placeholder={isEditMode ? "********" : ""} {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </>
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الدور' : 'Role'}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Admin">{roles.Admin}</SelectItem>
                  <SelectItem value="Moderator">{roles.Moderator}</SelectItem>
                  <SelectItem value="Courier">{roles.Courier}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === 'Courier' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'الهاتف 1' : 'Phone 1'}</FormLabel>
                  <FormControl><Input {...field} value={field.value || ''}/></FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {role !== 'Courier' && (
        <>
            <FormField
            control={form.control}
            name="orderVisibility"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>{language === 'ar' ? 'عرض الطلبات' : 'Visibility'}</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="own" /></FormControl><FormLabel>الخاصة فقط</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="all" /></FormControl><FormLabel>الكل</FormLabel></FormItem>
                    </RadioGroup>
                </FormControl>
                </FormItem>
            )}
            />
            
            <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="permissions">
                <AccordionTrigger>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        {screensConfig.map((screen) => (
                            <div key={screen.id} className="rounded-md border p-4">
                                <h4 className="font-medium mb-4">{language === 'ar' ? screen.arName : screen.name}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4">
                                    {(screen.perms as readonly Perm[]).map(perm => (
                                            <FormField
                                                key={perm}
                                                control={form.control}
                                                name={('permissions.' + screen.id + '.' + perm) as any}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 rtl:space-x-reverse">
                                                        <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl>
                                                        <FormLabel className="font-normal">{language === 'ar' ? permLabels[perm].ar : permLabels[perm].en}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                        
                        <div className="rounded-md border p-4">
                            <h4 className="font-medium mb-4">{language === 'ar' ? 'تقارير' : 'Reports'}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4">
                                {reportScreensConfig.map(report => (
                                    <FormField
                                        key={report.id}
                                        control={form.control}
                                        name={`permissions.reports.${report.id}.view` as any}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 rtl:space-x-reverse">
                                                <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange}/></FormControl>
                                                <FormLabel className="font-normal">{language === 'ar' ? report.arName : report.name}</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "..." : (isEditMode ? "حفظ" : "إضافة")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
