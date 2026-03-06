
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "./language-provider";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
  showBackButton?: boolean;
};

export function PageHeader({ title, children, showBackButton = true }: PageHeaderProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label={language === 'ar' ? 'رجوع' : 'Go back'}>
            <BackIcon className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      {children && <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">{children}</div>}
    </div>
  );
}
