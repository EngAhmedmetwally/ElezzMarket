
"use client";

import * as React from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { User } from "@/lib/types";
import { useAuth, useDatabase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";


const permissionsSchema = z.object({
  view: z.boolean().default(false),
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const userFormSchema = z.object({
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف"),
  role: z.enum(["Admin", "Moderator", "Courier"]),
  orderVisibility: z.enum(["all", "own"]).default("own"),
  permissions: z.object({
    dashboard: permissionsSchema.pick({ view: true }),
    orders: permissionsSchema,
    users: permissionsSchema,
    returns: permissionsSchema.pick({ view: true }),
    commissions: permissionsSchema,
    reports: permissionsSchema.pick({ view: true }),
  }).optional(),
});

const editUserFormSchema = userFormSchema.extend({
  password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف").optional().or(z.literal('')),
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
  userToEdit?: User;
}

export function AddUserForm({ onSuccess, userToEdit }: AddUserFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const auth = useAuth();
  const database = useDatabase();
  const isEditMode = !!userToEdit;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? editUserFormSchema : userFormSchema),
    defaultValues: {
      fullName: userToEdit?.name || "",
      username: (isEditMode && userToEdit) ? userToEdit.email.split('@')[0] : "",
      password: "",
      role: userToEdit?.role || "Moderator",
      orderVisibility: userToEdit?.orderVisibility || "own",
      // TODO: Map permissions if they are part of the user model. For now, using defaults.
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
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    if (isEditMode && userToEdit) {
        // In a real app, you would handle the update logic.
        // The password should only be updated if a new one is provided.
        const userRef = ref(database, `users/${userToEdit.id}`);
        const userDataToUpdate = {
          fullName: data.fullName,
          email: `${data.username}@elezz.com`,
          role: data.role,
          orderVisibility: data.orderVisibility,
          permissions: data.permissions,
        }
        await set(userRef, { ...userToEdit, ...userDataToUpdate });

        // TODO: Need an admin SDK to update user email and password
        
        toast({
            title: language === 'ar' ? 'تم تحديث المستخدم' : "User Updated",
            description: `${language === 'ar' ? 'تم تحديث المستخدم' : 'User'} ${data.fullName} ${language === 'ar' ? 'بنجاح.' : 'has been successfully updated.'}`,
        });
    } else {
        try {
          const email = `${data.username}@elezz.com`;
          const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);
          const user = userCredential.user;

          const userRef = ref(database, `users/${user.uid}`);
          await set(userRef, {
            id: user.uid,
            fullName: data.fullName,
            email: email,
            role: data.role,
            orderVisibility: data.orderVisibility,
            permissions: data.permissions,
            createdAt: serverTimestamp(),
            status: "نشط",
            avatarUrl: `/avatars/0${(user.uid.charCodeAt(0) % 6) + 1}.png`
          });
          
          toast({
            title: language === 'ar' ? 'تم إنشاء المستخدم' : "User Created",
            description: `${language === 'ar' ? 'تم إنشاء المستخدم' : 'User'} ${data.fullName} ${language === 'ar' ? 'بنجاح.' : 'has been successfully created.'}`,
          });

        } catch (error: any) {
           console.error("User creation error: ", error);
            toast({
              variant: "destructive",
              title: language === 'ar' ? 'فشل إنشاء المستخدم' : "User Creation Failed",
              description: error.message,
            });
        }
    }
    
    setIsSubmitting(false);
    onSuccess?.();
    form.reset();
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
              <FormControl>
                <Input placeholder={language === 'ar' ? 'مثال: علي حسن محمد' : 'e.g. Ali Hassan Mohamed'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
              <FormControl>
                <Input placeholder={language === 'ar' ? 'مثال: ali.hassan' : 'e.g. ali.hassan'} {...field} />
              </FormControl>
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
              <FormControl>
                <Input type="password" placeholder={isEditMode ? (language === 'ar' ? 'اتركه فارغًا لعدم التغيير' : 'Leave blank to not change') : "********"} {...field} />
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر دورًا' : 'Select a role'} />
                  </SelectTrigger>
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

        <FormField
          control={form.control}
          name="orderVisibility"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{language === 'ar' ? 'صلاحية عرض الطلبات' : 'Order Visibility'}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="own" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {language === 'ar' ? 'عرض طلباته فقط' : 'View Own Orders Only'}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {language === 'ar' ? 'عرض كل الطلبات' : 'View All Orders'}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
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
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                : (isEditMode ? (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (language === 'ar' ? 'إضافة مستخدم' : 'Add User'))
              }
          </Button>
        </div>
      </form>
    </Form>
  );
}
