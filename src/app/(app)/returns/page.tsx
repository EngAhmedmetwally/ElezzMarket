"use client";

import { PageHeader } from "@/components/page-header";
import { mockOrders } from "@/lib/data";
import { OrdersClient } from "../orders/components/client";
import { columns } from "../orders/components/columns";
import { useLanguage } from "@/components/language-provider";

export default function ReturnsPage() {
  const { language } = useLanguage();
  const returnOrders = mockOrders.filter(o => o.status === 'مرتجع' || o.status === 'لم يرد');
  return (
    <div>
      <PageHeader title={language === 'ar' ? 'المرتجعات و لم يرد' : 'Returns & No Answers'} />
      <OrdersClient data={returnOrders} columns={columns} />
    </div>
  );
}
