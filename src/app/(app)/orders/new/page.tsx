"use client";

import { PageHeader } from "@/components/page-header";
import { OrderForm } from "./order-form";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export default function NewOrderPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const handleSuccess = () => {
    // This will be called after the success modal is closed
    // You could redirect or do something else here.
    // For now, it just resets the form, allowing for another entry.
  };

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'إنشاء طلب جديد' : 'Create New Order'} />
      <Card>
        <CardContent className="pt-6">
            <OrderForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
