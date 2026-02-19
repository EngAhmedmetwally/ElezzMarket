
"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";
import { useUser } from "@/firebase";

export default function AppHeader() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const { user } = useUser();
  const isHomePage = pathname === '/home';
  const isAdmin = user?.email === 'emergency.admin@elezz.com';
  const showSidebarTrigger = isAdmin || !isHomePage;

  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm print-hidden">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-2">
            {showSidebarTrigger && <SidebarTrigger className="md:hidden" />}
            <div className="hidden md:block font-bold text-lg">{language === 'ar' ? 'سوق العز' : 'ElEzz Market'}</div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <LanguageToggle />
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
      <div className="h-px w-full bg-border" />
    </header>
  );
}
