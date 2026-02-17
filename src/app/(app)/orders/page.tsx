"use client";

import * as React from "react";
import { mockOrders } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { OrdersClient } from "./components/client";
import { columns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderForm } from "./new/order-form";
import { useLanguage } from "@/components/language-provider";

export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);
  const { language } = useLanguage();

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'الطلبات' : 'Orders'}>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'طلب جديد' : 'New Order'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء طلب جديد' : 'Create New Order'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' ? 'املأ التفاصيل أدناه لإنشاء طلب جديد.' : 'Fill in the details below to create a new order.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <OrderForm onSuccess={() => setIsNewOrderOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <OrdersClient data={mockOrders} columns={columns} />
    </div>
  );
}
