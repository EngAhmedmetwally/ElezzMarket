
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Users, ArrowRight } from "lucide-react";

export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-8 p-4">
      <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            الشاشة الرئيسية
          </h1>
          <p className="mt-2 text-muted-foreground">
            اختر وجهتك
          </p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          <Link href="/orders" passHref>
              <Button variant="outline" className="w-full h-32 text-2xl flex-col gap-2">
                  <Package className="h-8 w-8" />
                  <span>الطلبات</span>
              </Button>
          </Link>
          <Link href="/users" passHref>
              <Button variant="outline" className="w-full h-32 text-2xl flex-col gap-2">
                  <Users className="h-8 w-8" />
                  <span>العملاء</span>
              </Button>
          </Link>
      </div>
    </div>
  );
}
