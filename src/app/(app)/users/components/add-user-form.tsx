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
import type { UserRole } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Operations", "Moderator", "Courier"]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

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
        <div className="flex justify-end">
          <Button type="submit">{language === 'ar' ? 'إضافة مستخدم' : 'Add User'}</Button>
        </div>
      </form>
    </Form>
  );
}
