
"use client";

import * as React from "react";
import { mockOrders } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const orderStatuses: OrderStatus[] = ["قيد الانتظار", "مؤكد", "قيد المعالجة", "تم الشحن", "تم التوصيل", "ملغي", "مرتجع", "لم يرد"];

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const orderData = mockOrders.find(o => o.id.toLowerCase() === params.id.toLowerCase());
  
  const [order, setOrder] = React.useState<Order | undefined>(orderData);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (order) {
      setOrder({ ...order, status: newStatus });
      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: `${language === 'ar' ? 'تم تحديث حالة الطلب إلى' : 'Order status updated to'} ${newStatus}.`,
      });
    }
  };

  if (!order) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على الطلب المطلوب.' : 'The requested order could not be found.'}</p>
      </div>
    );
  }

  return (
    <div className="print:p-8">
      <PageHeader title={`${language === 'ar' ? 'طلب' : 'Order'} ${order.id}`} className="print:hidden">
        <Button onClick={() => typeof window !== 'undefined' && window.print()}>
          <Printer className="me-2 h-4 w-4" />
          {language === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
           <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'منتجات الطلب' : 'Order Items'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-end">EGP {item.price.toLocaleString()}</TableCell>
                                    <TableCell className="text-end">EGP {(item.price * item.quantity).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Separator className="my-4" />
                    <div className="flex justify-end font-bold text-lg">
                        <p>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</p>
                        <p className={language === 'ar' ? 'mr-8' : 'ml-8'}>EGP {order.total.toLocaleString()}</p>
                    </div>
                </CardContent>
           </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'حالة الطلب' : 'Order Status'}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <StatusBadge status={order.status} className="text-base w-fit" />
                     <Select value={order.status} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? "تغيير الحالة" : "Change status"} />
                        </SelectTrigger>
                        <SelectContent>
                            {orderStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                     <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنطقة:' : 'Zoning:'} {order.zoning}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'الموظفون' : 'Staff'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm"><span className="font-medium">{language === 'ar' ? 'الوسيط:' : 'Moderator:'}</span> {order.moderatorName}</p>
                    {order.courierName && <p className="text-sm"><span className="font-medium">{language === 'ar' ? 'المندوب:' : 'Courier:'}</span> {order.courierName}</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
