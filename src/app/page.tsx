
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Rocket } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

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

const formSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
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
    try {
      const isEmergencyAdmin = values.username.toLowerCase() === 'admin' && values.password === 'admin304050';
      const email = isEmergencyAdmin ? 'emergency.admin@elezz.com' : `${values.username}@elezz.com`;
      const password = values.password;
      
      await signInWithEmailAndPassword(auth, email, password);

      toast({
        title: language === 'ar' ? "تم تسجيل الدخول" : "Logged In",
        description: language === 'ar' ? "تم تسجيل دخولك بنجاح." : "You have been successfully logged in.",
      });
      // Redirection is handled by the useEffect hook
    } catch (error: any) {
      const isEmergencyAdmin = values.username.toLowerCase() === 'admin' && values.password === 'admin304050';
      
      // If sign-in fails for the emergency admin, try creating the account.
      // This is a one-time setup for the emergency user.
      if (isEmergencyAdmin && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found')) {
        try {
          await createUserWithEmailAndPassword(auth, 'emergency.admin@elezz.com', 'admin304050');
          toast({
            title: language === 'ar' ? "تم إعداد حساب المسؤول" : "Admin Account Set Up",
            description: language === 'ar' ? "تم إنشاء حساب الطوارئ بنجاح. يتم الآن تسجيل دخولك." : "Emergency account created. Signing you in.",
          });
          // After creation, Firebase automatically signs the user in, so the useEffect will handle redirection.
        } catch (creationError: any) {
          // This might happen if the email exists but password was wrong initially during sign-in attempt
          if (creationError.code === 'auth/email-already-in-use') {
             toast({
                variant: "destructive",
                title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
                description: language === 'ar' ? "كلمة المرور لحساب المسؤول غير صحيحة." : "Incorrect password for admin account.",
            });
          } else {
            console.error("Emergency admin creation failed:", creationError);
            toast({
                variant: "destructive",
                title: language === 'ar' ? "فشل إنشاء المسؤول" : "Admin Creation Failed",
                description: language === 'ar' ? "لم نتمكن من إعداد حساب الطوارئ. يرجى مراجعة وحدة التحكم." : "Could not set up the emergency account. Please check the console.",
            });
          }
        }
      } else {
        console.error("Login failed:", error);
        toast({
            variant: "destructive",
            title: language === 'ar' ? "فشل تسجيل الدخول" : "Login Failed",
            description: language === 'ar' ? "اسم المستخدم أو كلمة المرور غير صحيحة." : "Incorrect username or password.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isUserLoading || user) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Rocket className="h-12 w-12 animate-pulse text-primary" />
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
                    <Rocket className="h-8 w-8" />
                </div>
            </div>
          <CardTitle>{language === 'ar' ? 'سوق العز' : 'ElEzz Market'}</CardTitle>
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
