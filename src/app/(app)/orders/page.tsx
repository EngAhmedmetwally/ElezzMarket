import { mockOrders } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { OrdersClient } from "./components/client";
import { columns } from "./components/columns";
import Link from "next/link";

export default function OrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" >
        <Button asChild>
          <Link href="/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </PageHeader>
      <OrdersClient data={mockOrders} columns={columns} />
    </div>
  );
}
