
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser, useAuthActions, useDatabase } from "@/firebase";
import { ref, query, orderByChild, equalTo, get } from "firebase/database";
import type { User } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/icons/logo";

const formSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { login } = useAuthActions();
  const database = useDatabase();
  const { toast } = useToast();
  const { language } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === 'emergency.admin@elezz.com') {
        router.replace("/dashboard");
      } else {
        router.replace("/home");
      }
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // 1. Handle emergency admin
    if (values.username.toLowerCase() === 'admin' && values.password === 'admin304050') {
        const adminUser: User = {
            id: 'emergency-admin',
            username: 'admin',
            name: 'Emergency Admin',
            email: 'emergency.admin@elezz.com',
            role: 'Admin',
            avatarUrl: '/avatars/01.png',
            status: 'نشط',
            createdAt: new Date().toISOString(),
            orderVisibility: 'all'
        };
        login(adminUser);
        toast({
            title: language === 'ar' ? "تم تسجيل الدخول" : "Logged In",
            description: language === 'ar' ? "تم تسجيل الدخول كمسؤول طوارئ." : "Logged in as emergency admin.",
        });
        setIsSubmitting(false);
        return;
    }

    // 2. Handle regular user login
    try {
        const usersRef = ref(database, 'users');
        const userQuery = query(usersRef, orderByChild('username'), equalTo(values.username));
        const snapshot = await get(userQuery);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const userId = Object.keys(usersData)[0];
            const userFromDb: User = usersData[userId];

            if (userFromDb.password === values.password) {
                login(userFromDb);
                toast({
                    title: language === 'ar' ? "تم تسجيل الدخول" : "Logged In",
                    description: language === 'ar' ? "تم تسجيل دخولك بنجاح." : "You have been successfully logged in.",
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
                    description: language === 'ar' ? "كلمة المرور غير صحيحة." : "Incorrect password.",
                });
            }
        } else {
            toast({
                variant: "destructive",
                title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
                description: language === 'ar' ? "اسم المستخدم غير موجود." : "Username does not exist.",
            });
        }
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: "destructive",
            title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
            description: language === 'ar' ? "حدث خطأ أثناء تسجيل الدخول." : "An error occurred during login.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (isUserLoading || user) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">
             {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Logo className="h-8 w-8" />
                </div>
            </div>
          <CardTitle>العز ماركت</CardTitle>
          <CardDescription>{language === 'ar' ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
                    <FormControl>
                      <Input placeholder={language === 'ar' ? 'ادخل اسم المستخدم' : 'Enter username'} {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
