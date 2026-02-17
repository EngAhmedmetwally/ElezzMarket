import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrders } from "@/lib/data";
import { OrdersClient } from "../orders/components/client";
import { columns } from "../orders/components/columns";

export default function ReturnsPage() {
  const returnOrders = mockOrders.filter(o => o.status === 'Returned' || o.status === 'No Answer');
  return (
    <div>
      <PageHeader title="Returns & No Answers" />
      <OrdersClient data={returnOrders} columns={columns} />
    </div>
  );
}
