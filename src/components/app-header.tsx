import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:block font-bold text-lg">ElEzz Market</div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
      <div className="h-px w-full bg-border" />
    </header>
  );
}
