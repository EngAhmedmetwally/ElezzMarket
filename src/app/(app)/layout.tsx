

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
} from "@/components/ui/sidebar";
import AppHeader from "@/components/app-header";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingBag,
  RotateCcw,
  BadgePercent,
  Rocket,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", arLabel: "لوحة التحكم" },
  { href: "/orders", icon: Package, label: "Orders", arLabel: "الطلبات" },
  { href: "/users", icon: Users, label: "Users", arLabel: "المستخدمون" },
  { href: "/commissions", icon: BadgePercent, label: "Commissions", arLabel: "العمولات" },
  {
    label: "Reports",
    arLabel: "التقارير",
    icon: FileText,
    href: "/reports",
    children: [
      { href: "/reports", label: "Commissions", arLabel: "العمولات" },
      { href: "/reports/products", label: "Products", arLabel: "المنتجات" },
      { href: "/reports/staff", label: "Staff", arLabel: "الموظفون" },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { language, isRTL } = useLanguage();
  const side = isRTL ? 'right' : 'left';

  return (
    <SidebarProvider side={side}>
      <Sidebar side={side} collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Rocket className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg">{language === 'ar' ? 'سوق العز' : 'ElEzz Market'}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href || item.label}>
                {item.children ? (
                  <>
                     <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href) && !item.children.some(child => pathname === child.href && child.href !== item.href)}
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
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
