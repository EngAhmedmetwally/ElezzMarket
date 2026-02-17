"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

const permissionsSchema = z.object({
  view: z.boolean().default(false),
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Operations", "Moderator", "Courier"]),
  permissions: z.object({
    dashboard: permissionsSchema.pick({ view: true }),
    orders: permissionsSchema,
    users: permissionsSchema,
    returns: permissionsSchema.pick({ view: true }),
    commissions: permissionsSchema,
    reports: permissionsSchema.pick({ view: true }),
  }).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const screensConfig = [
  { id: 'dashboard', name: 'Dashboard', arName: 'لوحة التحكم', perms: ['view'] },
  { id: 'orders', name: 'Orders', arName: 'الطلبات', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'users', name: 'Users', arName: 'المستخدمون', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'returns', name: 'Returns', arName: 'المرتجعات', perms: ['view'] },
  { id: 'commissions', name: 'Commissions', arName: 'العمولات', perms: ['view', 'add', 'edit', 'delete'] },
  { id: 'reports', name: 'Reports', arName: 'التقارير', perms: ['view'] }
] as const;

const permLabels = {
    view: { en: 'View', ar: 'عرض' },
    add: { en: 'Add', ar: 'إضافة' },
    edit: { en: 'Edit', ar: 'تعديل' },
    delete: { en: 'Delete', ar: 'حذف' },
};
const allPerms: (keyof typeof permLabels)[] = ['view', 'add', 'edit', 'delete'];

interface AddUserFormProps {
  onSuccess?: () => void;
}

export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Moderator",
      permissions: {
        dashboard: { view: true },
        orders: { view: true, add: true, edit: false, delete: false },
        users: { view: false, add: false, edit: false, delete: false },
        returns: { view: true },
        commissions: { view: true, add: false, edit: false, delete: false },
        reports: { view: true },
      }
    },
  });

  function onSubmit(data: UserFormValues) {
    console.log(data);
    toast({
      title: language === 'ar' ? 'تم إنشاء المستخدم' : "User Created",
      description: `${language === 'ar' ? 'تم إنشاء المستخدم' : 'User'} ${data.name} ${language === 'ar' ? 'بنجاح.' : 'has been successfully created.'}`,
    });
    onSuccess?.();
    form.reset();
  }

  const roles = {
    Admin: language === 'ar' ? 'مدير' : 'Admin',
    Operations: language === 'ar' ? 'عمليات' : 'Operations',
    Moderator: language === 'ar' ? 'وسيط' : 'Moderator',
    Courier: language === 'ar' ? 'مندوب' : 'Courier',
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ar' ? 'مثال: علي حسن' : 'e.g. Ali Hassan'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={language === 'ar' ? 'مثال: ali@example.com' : 'e.g. ali@example.com'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'الدور' : 'Role'}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر دورًا' : 'Select a role'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Admin">{roles.Admin}</SelectItem>
                  <SelectItem value="Operations">{roles.Operations}</SelectItem>
                  <SelectItem value="Moderator">{roles.Moderator}</SelectItem>
                  <SelectItem value="Courier">{roles.Courier}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="permissions">
            <AccordionTrigger>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-5 gap-y-2 items-center">
                <div className="font-medium text-muted-foreground">{language === 'ar' ? 'الشاشة' : 'Screen'}</div>
                {allPerms.map(perm => (
                  <div key={perm} className="font-medium text-muted-foreground text-center">{language === 'ar' ? permLabels[perm].ar : permLabels[perm].en}</div>
                ))}

                {screensConfig.map((screen) => (
                  <React.Fragment key={screen.id}>
                    <div className="font-medium">{language === 'ar' ? screen.arName : screen.name}</div>
                    {allPerms.map(perm => (
                      <div key={perm} className="flex justify-center">
                        {screen.perms.includes(perm) ? (
                          <FormField
                            control={form.control}
                            name={`permissions.${screen.id}.${perm}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ) : <span className="text-muted-foreground">-</span>}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end">
          <Button type="submit">{language === 'ar' ? 'إضافة مستخدم' : 'Add User'}</Button>
        </div>
      </form>
    </Form>
  );
}
