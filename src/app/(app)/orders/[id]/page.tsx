import { mockOrders } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer } from "lucide-react";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const order = mockOrders.find(o => o.id.toLowerCase() === params.id.toLowerCase());

  if (!order) {
    return (
      <div>
        <PageHeader title="Order Not Found" />
        <p>The requested order could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Order ${order.id}`}>
        <Button onClick={() => typeof window !== 'undefined' && window.print()}>
          <Printer className="me-2 h-4 w-4" />
          Print Invoice
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="space-y-4">
                        {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                </div>
                                <p className="font-medium">EGP {(item.price * item.quantity).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold text-lg">
                        <p>Total</p>
                        <p>EGP {order.total.toLocaleString()}</p>
                    </div>
                </CardContent>
           </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatusBadge status={order.status} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                     <p className="text-sm text-muted-foreground">Zoning: {order.zoning}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Staff</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Moderator:</span> {order.moderatorName}</p>
                    {order.courierName && <p className="text-sm"><span className="font-medium">Courier:</span> {order.courierName}</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
