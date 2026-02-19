
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
import { useDatabase } from "@/firebase";
import { ref, set, push, update } from "firebase/database";


const permissionsSchema = z.object({
  view: z.boolean().default(false),
  add: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

const orderPermissionsSchema = permissionsSchema.extend({
    editStatus: z.boolean().default(false),
    cancel: z.boolean().default(false),
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
    users: permissionsSchema,
    returns: permissionsSchema.pick({ view: true }),
    commissions: permissionsSchema,
    reports: permissionsSchema.pick({ view: true }),
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
  { id: 'orders', name: 'Orders', arName: 'الطلبات', perms: ['view', 'add', 'edit', 'delete', 'editStatus', 'cancel'] },
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
    editStatus: { en: 'Edit Status', ar: 'تعديل الحالة' },
    cancel: { en: 'Cancel', ar: 'إلغاء' }
};
const allPerms: (keyof typeof permLabels)[] = ['view', 'add', 'edit', 'delete', 'editStatus', 'cancel'];

interface AddUserFormProps {
  onSuccess?: () => void;
  userToEdit?: User;
}

export function AddUserForm({ onSuccess, userToEdit }: AddUserFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const database = useDatabase();
  const isEditMode = !!userToEdit;
  
  const formSchema = getUserFormSchema(isEditMode);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: userToEdit?.name || "",
      username: userToEdit?.username || "",
      password: "",
      role: userToEdit?.role || "Moderator",
      phone1: userToEdit?.phone1 || "",
      phone2: userToEdit?.phone2 || "",
      orderVisibility: userToEdit?.orderVisibility || "own",
      permissions: userToEdit?.permissions || {
        dashboard: { view: true },
        orders: { view: true, add: true, edit: false, delete: false, editStatus: true, cancel: false },
        users: { view: false, add: false, edit: false, delete: false },
        returns: { view: true },
        commissions: { view: true, add: false, edit: false, delete: false },
        reports: { view: true },
      }
    },
  });
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const role = form.watch("role");

  React.useEffect(() => {
    if (userToEdit) {
      form.reset({
        fullName: userToEdit.name,
        username: userToEdit.username,
        password: '',
        role: userToEdit.role,
        phone1: userToEdit.phone1 || "",
        phone2: userToEdit.phone2 || "",
        orderVisibility: userToEdit.orderVisibility,
        permissions: userToEdit.permissions
      })
    }
  }, [userToEdit, form])


  async function onSubmit(data: UserFormValues) {
    setIsSubmitting(true);
    if (!database) {
        toast({ variant: "destructive", title: "Database error" });
        setIsSubmitting(false);
        return;
    }
    
    if (isEditMode && userToEdit) {
        const userRef = ref(database, `users/${userToEdit.id}`);
        
        const username = data.role === 'Courier' ? userToEdit.username : data.username!;
        const email = data.role === 'Courier' ? userToEdit.email : `${username}@elezz.com`;
        
        const userDataToUpdate: Partial<User> = {
          name: data.fullName,
          username: username,
          email: email,
          role: data.role,
          phone1: data.phone1,
          phone2: data.phone2,
          orderVisibility: data.orderVisibility,
          permissions: data.permissions,
        };

        if(data.password) {
            userDataToUpdate.password = data.password;
        }

        await update(userRef, userDataToUpdate);

        toast({
            title: language === 'ar' ? 'تم تحديث المستخدم' : "User Updated",
            description: `${language === 'ar' ? 'تم تحديث المستخدم' : 'User'} ${data.fullName} ${language === 'ar' ? 'بنجاح.' : 'has been successfully updated.'}`,
        });
    } else {
        try {
          const newUserRef = push(ref(database, 'users'));
          const newUserId = newUserRef.key;

          if (!newUserId) {
            throw new Error("Could not generate a new user ID.");
          }

          let username = data.username;
          let password = data.password;
          
          if(data.role === 'Courier') {
              username = data.fullName.toLowerCase().replace(/\s+/g, '.') + '.' + Math.random().toString(36).substring(2, 5);
              password = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
          }
          
          if (!username || !password) {
             throw new Error("Username and password are required.");
          }


          const newUser: User = {
            id: newUserId,
            name: data.fullName,
            username: username,
            email: `${username}@elezz.com`,
            password: password,
            role: data.role,
            phone1: data.phone1,
            phone2: data.phone2,
            orderVisibility: data.orderVisibility || 'own',
            permissions: data.permissions,
            createdAt: new Date().toISOString(),
            status: "نشط",
            avatarUrl: `/avatars/0${(newUserId.charCodeAt(0) % 6) + 1}.png`
          };

          await set(newUserRef, newUser);
          
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
    if (!isEditMode) {
      form.reset();
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
              <FormControl>
                <Input placeholder={language === 'ar' ? 'مثال: علي حسن محمد' : 'e.g. Ali Hassan Mohamed'} {...field} />
              </FormControl>
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
                    <FormControl>
                        <Input placeholder={language === 'ar' ? 'مثال: ali.hassan' : 'e.g. ali.hassan'} {...field} value={field.value || ''} />
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
                        <Input type="password" placeholder={isEditMode ? (language === 'ar' ? 'اتركه فارغًا لعدم التغيير' : 'Leave blank to not change') : "********"} {...field} value={field.value || ''} />
                    </FormControl>
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

        {role === 'Courier' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'رقم الهاتف 1' : 'Phone 1'}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === 'ar' ? 'رقم الهاتف الأساسي' : 'Primary phone number'} {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'رقم الهاتف 2 (اختياري)' : 'Phone 2 (Optional)'}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === 'ar' ? 'رقم هاتف إضافي' : 'Additional phone number'} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
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
                <div className="overflow-x-auto pb-2">
                    <div className="grid grid-cols-7 gap-y-2 items-center min-w-[620px]">
                    <div className="font-medium text-muted-foreground">{language === 'ar' ? 'الشاشة' : 'Screen'}</div>
                    {allPerms.map(perm => (
                        <div key={perm} className="font-medium text-muted-foreground text-center text-xs sm:text-sm">{language === 'ar' ? permLabels[perm].ar : permLabels[perm].en}</div>
                    ))}

                    {screensConfig.map((screen) => (
                        <React.Fragment key={screen.id}>
                        <div className="font-medium">{language === 'ar' ? screen.arName : screen.name}</div>
                        {allPerms.map(perm => (
                            <div key={perm} className="flex justify-center">
                            {screen.perms.includes(perm as any) ? (
                                <FormField
                                control={form.control}
                                name={`permissions.${screen.id}.${perm as any}`}
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
                </div>
                </AccordionContent>
            </AccordionItem>
            </Accordion>
        </>
        )}


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
