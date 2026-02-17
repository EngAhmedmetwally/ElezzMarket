import { PageHeader } from "@/components/page-header";
import { OrderForm } from "./order-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewOrderPage() {
  return (
    <div>
      <PageHeader title="Create New Order" />
      <Card>
        <CardContent className="pt-6">
            <OrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
