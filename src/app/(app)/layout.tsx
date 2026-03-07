
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/app-header";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingBag,
  BadgePercent,
  Users2,
  Truck,
  Settings,
  Clock,
  CircleDollarSign,
} from "lucide-react";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { useUser } from "@/firebase";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", arLabel: "متابعه الاعمال", id: "dashboard" },
  { href: "/orders", icon: Package, label: "Orders", arLabel: "الطلبات", id: "orders" },
  { href: "/customers", icon: Users2, label: "Customers", arLabel: "العملاء", id: "customers" },
  { href: "/products", icon: ShoppingBag, label: "Products", arLabel: "المنتجات", id: "products" },
  { href: "/users", icon: Users, label: "Users", arLabel: "المستخدمون", id: "users" },
  { href: "/shipping", icon: Truck, label: "Shipping", arLabel: "الشحن", id: "shipping" },
  { href: "/on-hold-orders", icon: Clock, label: "On Hold Orders", arLabel: "الطلبات المعلقة", id: "onHoldOrders" },
  { href: "/commissions", icon: BadgePercent, label: "Commissions", arLabel: "العمولات", id: "commissions" },
  { href: "/adjustments", icon: CircleDollarSign, label: "Adjustments", arLabel: "الخصومات والمكافآت", id: "adjustments" },
  { href: "/settings", icon: Settings, label: "Settings", arLabel: "الإعدادات", id: "settings" },
  {
    label: "Reports",
    arLabel: "التقارير",
    icon: FileText,
    href: "/reports",
    id: "reports",
    children: [
      { href: "/reports", label: "Commissions", arLabel: "العمولات", id: "commissions" },
      { href: "/reports/adjustments", label: "Bonuses & Discounts", arLabel: "الخصومات والمكافآت", id: "adjustments" },
      { href: "/reports/products", label: "Products", arLabel: "المنتجات", id: "products" },
      { href: "/reports/staff", label: "Staff", arLabel: "الموظفون", id: "staff" },
      { href: "/reports/daily", label: "Daily", arLabel: "اليومية", id: "daily" },
      { href: "/reports/courier-collection", label: "Courier Collection", arLabel: "تحصيل المناديب", id: "courierCollection" },
      { href: "/reports/shipping", label: "Shipping", arLabel: "الشحن", id: "shipping" },
      { href: "/reports/preparation-time", label: "Preparation Time", arLabel: "وقت التجهيز", id: "preparationTime" },
      { href: "/reports/cancelled", label: "Cancelled Orders", arLabel: "الطلبات الملغاة", id: "cancelled" },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';
  
  const { user, isUserLoading } = useUser();
  const isHomePage = pathname === '/home';
  const isAdmin = user?.email === 'emergency.admin@elezz.com';
  const showSidebar = isAdmin || !isHomePage;

  // AGGRESSIVE CLEANUP: Global MutationObserver to unlock screen and remove aria-hidden blocking
  useEffect(() => {
    const cleanup = () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      const blockedElements = document.querySelectorAll('[aria-hidden="true"], [data-aria-hidden="true"]');
      blockedElements.forEach(el => {
        // We specifically target elements that Radix might leave blocked
        if (el === document.body || el.tagName === 'MAIN' || el.classList.contains('group/sidebar-wrapper')) {
          el.removeAttribute('aria-hidden');
          el.removeAttribute('data-aria-hidden');
        }
      });
    };

    const observer = new MutationObserver((mutations) => {
      const hasStructuralChange = mutations.some(m => 
        m.type === 'childList' || (m.type === 'attributes' && (m.attributeName === 'aria-hidden' || m.attributeName === 'style'))
      );
      if (hasStructuralChange) {
        // Debounce slightly to allow Radix to finish its cycles
        setTimeout(cleanup, 100);
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['aria-hidden', 'style'] 
    });
    
    cleanup();
    return () => observer.disconnect();
  }, [pathname]);

  const visibleNavItems = React.useMemo(() => {
    if (isAdmin) return navItems;
    if (!user?.permissions) return [];

    const permissions = user.permissions as any;

    return navItems.map(item => {
        if (item.id === 'reports' && item.children) {
            if (!permissions.reports) return null;
            const visibleChildren = item.children.filter(child => 
                permissions.reports[child.id]?.view === true
            );
            if (visibleChildren.length > 0) {
                return { ...item, children: visibleChildren, href: visibleChildren[0].href };
            }
            return null;
        }
        if (item.id && permissions[item.id]) {
            if (permissions[item.id].view) return item;
        }
        return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

  }, [user, isAdmin]);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-muted-foreground">
            {language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider side={side}>
      {showSidebar && (
        <Sidebar side={side} collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/home" className="flex items-center gap-2 text-primary">
              <Logo className="h-10 w-auto" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.href || item.label}>
                  {item.children ? (
                    <>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={language === 'ar' ? item.arLabel : item.label}
                      >
                        <Link href={item.href!}>
                          <item.icon />
                          <span>{language === 'ar' ? item.arLabel : item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                                <Link href={child.href}>{language === 'ar' ? child.arLabel : child.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href!)}
                      tooltip={language === 'ar' ? item.arLabel : item.label}
                    >
                      <Link href={item.href!}>
                        <item.icon />
                        <span>{language === 'ar' ? item.arLabel : item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-2 md:hidden">
            <div className="flex items-center justify-around rounded-lg bg-muted p-2">
              <LanguageToggle />
              <ThemeToggle />
              <UserNav />
            </div>
          </SidebarFooter>
        </Sidebar>
      )}
      <SidebarInset>
        <div className="flex h-full flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
