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

export default function OrdersPage() {
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false);

  return (
    <div>
      <PageHeader title="Orders">
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new order.
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
