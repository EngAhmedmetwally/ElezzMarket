
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer, Search, Rocket } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, Commission, CommissionRule, ReceiptSettings } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useDoc, useCollection, useDatabase, useMemoFirebase, useUser as useAuthUser } from "@/firebase";
import { ref, update, runTransaction, get, push, child, set } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    "تم التسجيل": ["قيد التجهيز", "ملغي"],
    "قيد التجهيز": ["تم الشحن", "ملغي"],
    "تم الشحن": ["مكتمل", "ملغي"],
    "مكتمل": [],
    "ملغي": [],
};

function StatusHistoryTimeline({ history }: { history?: Record<string, StatusHistoryItem> }) {
    const { language } = useLanguage();
    const sortedHistory = React.useMemo(() => {
        if (!history) return [];
        return Object.entries(history)
            .map(([id, item]) => ({ ...item, id }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [history]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'سجل حالات الطلب' : 'Order Status History'}</CardTitle>
            </CardHeader>
            <CardContent>
                 {sortedHistory.length > 0 ? (
                    <div className="space-y-4">
                        {sortedHistory.map((item, index) => (
                            <div key={item.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 rounded-full bg-primary mt-1"></div>
                                    {index < sortedHistory.length - 1 && <div className="flex-1 w-0.5 bg-border"></div>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <StatusBadge status={item.status} />
                                        <span className="font-medium">{item.userName}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.createdAt ? format(new Date(item.createdAt), "PPP p") : ''}
                                        </span>
                                    </div>
                                    {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا يوجد سجل لعرضه.' : 'No history to display.'}</p>
                )}
            </CardContent>
        </Card>
    )
}

function OrderDetailsSkeleton() {
    return (
        <div>
            <PageHeader title="..." />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-48" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </div>
    )
}

const Hr = () => <hr className="receipt-thermal-hr" />;

function ReceiptView({ order, language, settings }: { order: Order; language: "ar" | "en"; settings: ReceiptSettings | null }) {
  if (!order) return null;

  const orderItems = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const s = settings || {
      showLogo: true, headerText: language === 'ar' ? 'سوق العز' : 'ElEzz Market',
      showOrderId: true, showDate: true, showCustomerName: true, showCustomerPhone: true, showCustomerAddress: true,
      showItemWeight: false, showItemPrice: true, showItemSubtotal: true,
      showItemsSubtotal: true, showShippingCost: true, showGrandTotal: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      showCourierName: true,
  };
  
  const formatCurrency = (value: number) => value.toFixed(2);

  return (
    <div className="receipt-thermal">
        {s.showLogo && (
            <div className="receipt-thermal-header">
                <Rocket className="h-10 w-10 mx-auto" />
                {s.headerText && <h1>{s.headerText}</h1>}
            </div>
        )}
        
        <div className="receipt-thermal-info">
             {s.showOrderId && <div className="info-item"><span>{language === 'ar' ? 'رقم الطلب' : 'Order'}:</span><span>{order.id}</span></div>}
             {s.showDate && <div className="info-item"><span>{language === 'ar' ? 'التاريخ' : 'Date'}:</span><span>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</span></div>}
        </div>

        <Hr />

        <div className="receipt-thermal-info">
             {s.showCustomerName && <div className="info-item"><span>{language === 'ar' ? 'العميل' : 'Cust'}:</span><span>{order.customerName}</span></div>}
             {s.showCustomerPhone && <div className="info-item"><span>{language === 'ar' ? 'الهاتف' : 'Phone'}:</span><span>{order.customerPhone1}</span></div>}
             {s.showCustomerAddress && order.customerAddress && <p className="text-xs break-words pt-1 text-right">{order.customerAddress}</p>}
        </div>

        {s.showCourierName && order.courierName && (
            <>
                <Hr />
                <div className="receipt-thermal-info">
                    <div className="info-item"><span>{language === 'ar' ? 'المندوب' : 'Courier'}:</span><span>{order.courierName}</span></div>
                </div>
            </>
        )}

        <table className="receipt-thermal-table">
            <thead>
                <tr>
                    <th className="item-name">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                    <th className="text-center">{language === 'ar' ? 'كمية' : 'Qty'}</th>
                    {s.showItemPrice && <th className="text-right">{language === 'ar' ? 'سعر' : 'Price'}</th>}
                    {s.showItemSubtotal && <th className="text-right">{language === 'ar' ? 'إجمالي' : 'Total'}</th>}
                </tr>
            </thead>
            <tbody>
                {orderItems.map((item, index) => (
                    <tr key={index}>
                        <td className="item-name">{item.productName}{s.showItemWeight && item.weight ? ` (${item.weight}kg)` : ''}</td>
                        <td className="text-center">{item.quantity}</td>
                        {s.showItemPrice && <td className="text-right">{formatCurrency(item.price)}</td>}
                        {s.showItemSubtotal && <td className="text-right">{formatCurrency(item.price * item.quantity)}</td>}
                    </tr>
                ))}
            </tbody>
        </table>

        <Hr />

        <div className="receipt-thermal-summary space-y-1">
            {s.showItemsSubtotal && <div className="summary-item"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{formatCurrency(itemsSubtotal)}</span></div>}
            {s.showShippingCost && <div className="summary-item"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{formatCurrency(order.shippingCost || 0)}</span></div>}
            {s.showGrandTotal && <div className="summary-item total"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span> <span>{formatCurrency(order.total)}</span></div>}
        </div>
        
        {s.footerText && (
            <>
                <Hr />
                <div className="receipt-thermal-footer">
                    <p>{s.footerText}</p>
                </div>
            </>
        )}
    </div>
  );
}


export default function OrderDetailsPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  
  const orderRef = useMemoFirebase(() => database ? ref(database, `orders/${id}`) : null, [database, id]);
  const { data: order, isLoading: isLoadingOrder, error: orderError } = useDoc<Order>(orderRef);

  const usersRef = useMemoFirebase(() => database ? ref(database, `users`) : null, [database]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersRef);
  
  const settingsRef = useMemoFirebase(() => database ? ref(database, 'receipt-settings') : null, [database]);
  const { data: receiptSettings } = useDoc<ReceiptSettings>(settingsRef);

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = React.useState(false);

  const [note, setNote] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  
  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier') || [], [users]);
  const [courierSearch, setCourierSearch] = React.useState("");
  const [selectedCourierId, setSelectedCourierId] = React.useState<string | null>(null);

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(courierSearch.toLowerCase()) || 
    (c.phone1 && c.phone1.includes(courierSearch))
  );

  const handleStatusChangeRequest = (newStatus: OrderStatus) => {
    if (order && newStatus !== order.status) {
      setSelectedStatus(newStatus);
      if (newStatus === "تم الشحن") {
        setIsCourierModalOpen(true);
      } else {
        setIsNoteModalOpen(true);
      }
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus, noteText: string, courierId?: string | null) => {
    if (!order || !database || !authUser || !orderRef) return;
    
    try {
        const now = new Date().toISOString();
        const currentUser = authUser.name || authUser.email || "مستخدم مسؤول";

        const commissionRulesSnap = await get(ref(database, 'commission-rules'));
        const commissionRules = commissionRulesSnap.val();
        const commissionAmount = commissionRules?.[newStatus]?.amount || 0;

        await runTransaction(orderRef, (currentOrder) => {
            if (currentOrder) {
                const newHistoryKey = push(child(orderRef, 'statusHistory')).key;
                if (!currentOrder.statusHistory) {
                    currentOrder.statusHistory = {};
                }

                let finalNote = noteText;
                if (newStatus === "تم الشحن" && courierId) {
                    const selectedCourier = couriers.find(c => c.id === courierId);
                    if (selectedCourier) {
                        currentOrder.courierId = selectedCourier.id;
                        currentOrder.courierName = selectedCourier.name;
                        const courierInfo = `${language === 'ar' ? 'بواسطة المندوب:' : 'By Courier:'} ${selectedCourier.name}${selectedCourier.phone1 ? ` (${selectedCourier.phone1})` : ''}`;
                        finalNote = noteText ? `${courierInfo} - ${noteText}` : courierInfo;
                    }
                }

                if (newHistoryKey) {
                    currentOrder.statusHistory[newHistoryKey] = {
                        status: newStatus,
                        notes: finalNote,
                        createdAt: now,
                        userName: currentUser,
                    };
                }

                currentOrder.status = newStatus;
                currentOrder.updatedAt = now;

                if (commissionAmount > 0) {
                    currentOrder.totalCommission = (currentOrder.totalCommission || 0) + commissionAmount;
                }
            }
            return currentOrder;
        });

        if (commissionAmount > 0) {
            const latestOrderSnap = await get(orderRef);
            const latestOrder = latestOrderSnap.val();
            
            if (latestOrder) {
                let recipientId: string | undefined;
                if (["تم التسجيل", "قيد التجهيز"].includes(newStatus)) {
                    recipientId = latestOrder.moderatorId;
                } else if (["تم الشحن", "مكتمل"].includes(newStatus)) {
                    recipientId = latestOrder.courierId;
                }

                if (recipientId) {
                    const newCommission: Omit<Commission, 'id'> = {
                        orderId: order.id,
                        userId: recipientId,
                        orderStatus: newStatus,
                        amount: commissionAmount,
                        calculationDate: now,
                        paymentStatus: 'Calculated',
                    };
                    const newCommRef = push(ref(database, 'commissions'));
                    await set(newCommRef, newCommission);
                }
            }
        }
        
        if (newStatus === 'ملغي' && order.status !== 'ملغي') {
            const productSaleUpdatePromises = (order.items || []).map(item => {
                if (!item.productId) return Promise.resolve();
                const productSalesRef = ref(database, `products/${item.productId}/salesCount`);
                return runTransaction(productSalesRef, (currentCount) => (currentCount || 0) - item.quantity);
            });
            await Promise.all(productSaleUpdatePromises);
        }

        toast({
            title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
            description: `${language === 'ar' ? 'تم تحديث حالة الطلب إلى' : 'Order status updated to'} ${newStatus}.`,
        });

        setIsNoteModalOpen(false);
        setIsCourierModalOpen(false);
        setNote("");
        setSelectedStatus(null);
        setSelectedCourierId(null);
        setCourierSearch("");
        
    } catch (e: any) {
        console.error("Status update failed:", e);
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'فشل تحديث الحالة' : 'Status Update Failed',
            description: e.message || (language === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'),
        });
    }
  }


  const handlePrint = () => {
    typeof window !== 'undefined' && window.print()
  }

  const isLoading = isLoadingOrder || isLoadingUsers;

  if (isLoading && !order) {
    return <OrderDetailsSkeleton />;
  }

  if (!order && !isLoading) {
    return (
      <div className="print-hidden">
        <PageHeader title={language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على الطلب المطلوب.' : 'The requested order could not be found.'}</p>
        {orderError && <p className="text-destructive">{orderError.message}</p>}
      </div>
    );
  }

  if (!order) return <OrderDetailsSkeleton />;


  const canEditStatus = authUser?.role === 'Admin' || authUser?.permissions?.orders?.editStatus;
  const canCancelOrder = authUser?.role === 'Admin' || authUser?.permissions?.orders?.cancel;

  let availableStatuses = allowedTransitions[order.status] || [];
  if (!canCancelOrder) {
      availableStatuses = availableStatuses.filter(s => s !== 'ملغي');
  }

  const orderItems = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', { style: 'currency', currency: 'EGP' }).format(value);


  return (
    <>
      <div className="print-hidden">
        <PageHeader title={`${language === 'ar' ? 'طلب' : 'Order'} ${order.id}`}>
          <Button onClick={handlePrint}>
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
                                  <TableHead className="text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                  <TableHead className="text-center">{language === 'ar' ? 'الوزن' : 'Weight'}</TableHead>
                                  <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                                  <TableHead className="text-end">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                                  <TableHead className="text-end">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {orderItems.map((item, index) => (
                                  <TableRow key={index}>
                                      <TableCell className="font-medium text-start">{item.productName}</TableCell>
                                      <TableCell className="text-center">{item.weight || '-'}</TableCell>
                                      <TableCell className="text-center">{item.quantity}</TableCell>
                                      <TableCell className="text-end">{formatCurrency(item.price)}</TableCell>
                                      <TableCell className="text-end">{formatCurrency(item.price * item.quantity)}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                      <Separator className="my-4" />
                       <div className="space-y-2">
                            <div className="flex justify-between">
                                <p>{language === 'ar' ? 'مجموع المنتجات' : 'Items Subtotal'}</p>
                                <p>{formatCurrency(itemsSubtotal)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</p>
                                <p>{formatCurrency(order.shippingCost || 0)}</p>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-lg">
                                <p>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</p>
                                <p>{formatCurrency(order.total)}</p>
                            </div>
                       </div>
                  </CardContent>
             </Card>
             <StatusHistoryTimeline history={order.statusHistory} />
          </div>
          <div className="space-y-8">
              <Card>
                  <CardHeader>
                      <CardTitle>{language === 'ar' ? 'حالة الطلب' : 'Order Status'}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                      <StatusBadge status={order.status} className="text-base w-fit" />
                       <Select 
                          onValueChange={(newStatus: OrderStatus) => handleStatusChangeRequest(newStatus)}
                          disabled={availableStatuses.length === 0 || !canEditStatus}
                        >
                          <SelectTrigger>
                              <SelectValue placeholder={language === 'ar' ? "تغيير الحالة" : "Change status"} />
                          </SelectTrigger>
                          <SelectContent>
                              {availableStatuses.map((status) => (
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
                      {order.facebookName && <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'فيسبوك:' : 'Facebook:'}</span> {order.facebookName}</p>}
                      <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'موبايل 1:' : 'Phone 1:'}</span> {order.customerPhone1}</p>
                      {order.customerPhone2 && <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'موبايل 2:' : 'Phone 2:'}</span> {order.customerPhone2}</p>}
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
        
        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? `إضافة ملاحظة لـ "${selectedStatus}"` : `Add note for "${selectedStatus}"`}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder={language === 'ar' ? 'أضف ملاحظتك هنا...' : 'Add your note here...'}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    </DialogClose>
                    <Button onClick={() => selectedStatus && handleStatusUpdate(selectedStatus, note)}>{language === 'ar' ? 'حفظ التغيير' : 'Save Change'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isCourierModalOpen} onOpenChange={setIsCourierModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'إسناد مندوب' : 'Assign Courier'}</DialogTitle>
                    <DialogDescription>{language === 'ar' ? 'اختر مندوبًا لتسليم هذا الطلب.' : 'Select a courier to deliver this order.'}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={language === 'ar' ? 'ابحث عن مندوب...' : 'Search for courier...'} 
                            className="pl-9"
                            value={courierSearch}
                            onChange={(e) => setCourierSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-48">
                        <div className="space-y-2">
                            {filteredCouriers.map(courier => (
                                <div 
                                    key={courier.id}
                                    onClick={() => setSelectedCourierId(courier.id)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md p-2 cursor-pointer transition-colors",
                                        selectedCourierId === courier.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                    )}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={courier.avatarUrl} alt={courier.name} />
                                        <AvatarFallback>{courier.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{courier.name}</p>
                                        <p className="text-xs text-muted-foreground">{courier.phone1 || courier.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <Textarea
                        placeholder={language === 'ar' ? 'أضف ملاحظة (اختياري)...' : 'Add a note (optional)...'}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    </DialogClose>
                    <Button 
                    onClick={() => selectedStatus && handleStatusUpdate(selectedStatus, note, selectedCourierId)}
                    disabled={!selectedCourierId}
                    >
                    {language === 'ar' ? 'تأكيد وحفظ' : 'Confirm & Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="receipt-container">
        {order && <ReceiptView order={order} language={language} settings={receiptSettings} />}
      </div>
    </>
  );
}
