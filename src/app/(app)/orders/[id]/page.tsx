
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
import { ref, update, runTransaction, get, push } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    "تم التسجيل": ["قيد التجهيز", "ملغي"],
    "قيد التجهيز": ["تم الشحن", "ملغي"],
    "تم الشحن": ["مكتمل", "ملغي"],
    "مكتمل": [],
    "ملغي": [],
};

function StatusHistoryTimeline({ history }: { history?: StatusHistoryItem[] }) {
    const { language } = useLanguage();
    const sortedHistory = React.useMemo(() => {
        if (!history) return [];
        const historyArray = Array.isArray(history) ? history : Object.values(history);
        return historyArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
                            <div key={index} className="flex gap-4">
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

function ReceiptView({ order, language, settings }: { order: Order; language: "ar" | "en"; settings: ReceiptSettings | null }) {
  if (!order) return null;

  const orderItems = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Set default settings if none are found in DB
  const s = settings || {
      showLogo: true, headerText: language === 'ar' ? 'سوق العز' : 'ElEzz Market',
      showOrderId: true, showDate: true, showCustomerName: true, showCustomerPhone: true, showCustomerAddress: true,
      showItemWeight: false, showItemPrice: true, showItemSubtotal: true,
      showItemsSubtotal: true, showShippingCost: true, showGrandTotal: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      showCourierName: false,
  };


  return (
    <div className="receipt">
      {s.showLogo && (
        <div className="text-center mb-4">
          <Rocket className="h-8 w-8 mx-auto text-black" />
          {s.headerText && <h2 className="font-bold text-lg mt-2">{s.headerText}</h2>}
        </div>
      )}
      {s.showOrderId && <p>{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} {order.id}</p>}
      {s.showDate && <p>{language === 'ar' ? 'التاريخ:' : 'Date:'} {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>}
      
      {(s.showOrderId || s.showDate) && (s.showCustomerName || s.showCustomerPhone || s.showCustomerAddress || s.showCourierName) && <hr />}
      
      {s.showCustomerName && <p><strong>{language === 'ar' ? 'العميل:' : 'Customer:'}</strong> {order.customerName}</p>}
      {s.showCustomerPhone && <p><strong>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</strong> {order.customerPhone1}</p>}
      {s.showCustomerAddress && order.customerAddress && <p><strong>{language === 'ar' ? 'العنوان:' : 'Address:'}</strong> {order.customerAddress}</p>}
      
      {s.showCourierName && order.courierName && <p><strong>{language === 'ar' ? 'المندوب:' : 'Courier:'}</strong> {order.courierName}</p>}

      {(s.showCustomerName || s.showCustomerPhone || s.showCustomerAddress || s.showCourierName) && <hr />}
      
      <table>
        <thead>
          <tr>
            <th>{language === 'ar' ? 'الصنف' : 'Item'}</th>
            {s.showItemWeight && <th className="text-center">{language === 'ar' ? 'وزن' : 'Wt.'}</th>}
            <th className="text-center">{language === 'ar' ? 'كمية' : 'Qty'}</th>
            {s.showItemPrice && <th className="text-right">{language === 'ar' ? 'سعر' : 'Price'}</th>}
            {s.showItemSubtotal && <th className="text-right">{language === 'ar' ? 'إجمالي' : 'Total'}</th>}
          </tr>
        </thead>
        <tbody>
          {orderItems.map((item, index) => (
            <tr key={index}>
              <td>{item.productName}</td>
              {s.showItemWeight && <td className="text-center">{item.weight ? `${item.weight * item.quantity}kg` : '-'}</td>}
              <td className="text-center">{item.quantity}</td>
              {s.showItemPrice && <td className="text-right">{item.price.toFixed(2)}</td>}
              {s.showItemSubtotal && <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div className="summary space-y-1">
        {s.showItemsSubtotal && <div><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{itemsSubtotal.toFixed(2)}</span></div>}
        {s.showShippingCost && <div><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{(order.shippingCost || 0).toFixed(2)}</span></div>}
        {s.showGrandTotal && <div className="font-bold text-base"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span> <span>{order.total.toFixed(2)}</span></div>}
      </div>
      {(s.showItemsSubtotal || s.showShippingCost || s.showGrandTotal) && <hr />}
      {s.footerText && <p className="text-center">{s.footerText}</p>}
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

  const [orderPath, setOrderPath] = React.useState<string | null>(null);

  React.useEffect(() => {
      if (!database || !id) return;
      const lookupRef = ref(database, `order-lookup/${id}`);
      get(lookupRef).then(snapshot => {
          if (snapshot.exists()) {
              const { path } = snapshot.val();
              setOrderPath(`orders/${path}/${id}`);
          } else {
              console.error(`No path found for order ${id}`);
              setOrderPath(null);
          }
      });
  }, [database, id]);
  
  const orderRef = useMemoFirebase(() => (database && orderPath) ? ref(database, orderPath) : null, [database, orderPath]);
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

  const filteredCouriers = couriers.filter(c => c.name.toLowerCase().includes(courierSearch.toLowerCase()));

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
    
    let updates: any = {};
    const now = new Date().toISOString();
    
    // 1. Handle Commission
    const commissionRulesSnap = await get(ref(database, 'commission-rules'));
    const commissionRules = commissionRulesSnap.val();
    const commissionAmount = commissionRules?.[newStatus]?.amount || 0;

    if (commissionAmount > 0) {
        let recipientId: string | undefined;
        if (["تم التسجيل", "قيد التجهيز"].includes(newStatus)) {
            recipientId = order.moderatorId;
        } else if (["تم الشحن", "مكتمل"].includes(newStatus)) {
            recipientId = courierId || order.courierId;
        }

        if (recipientId) {
            const newCommissionRef = push(ref(database, 'commissions'));
            const newCommission: Commission = {
                id: newCommissionRef.key!,
                orderId: order.id,
                userId: recipientId,
                orderStatus: newStatus,
                amount: commissionAmount,
                calculationDate: now,
                paymentStatus: 'Calculated',
            };
            updates[`/commissions/${newCommission.id}`] = newCommission;
            updates[`/${orderRef.path}/totalCommission`] = (order.totalCommission || 0) + commissionAmount;
        }
    }

    // 2. Handle Product Sales Count for Cancellation
    if (newStatus === 'ملغي' && order.status !== 'ملغي') {
        const productSaleUpdatePromises = (order.items || []).map(item => {
            if (!item.productId) return Promise.resolve();
            const productSalesRef = ref(database, `products/${item.productId}/salesCount`);
            return runTransaction(productSalesRef, (currentCount) => (currentCount || 0) - item.quantity);
        });
        await Promise.all(productSaleUpdatePromises).catch(err => console.error("Failed to decrement sales count", err));
    }

    // 3. Prepare Order Update
    const newHistoryItem: StatusHistoryItem = {
        status: newStatus,
        notes: noteText,
        createdAt: now,
        userName: authUser.name || authUser.email || "مستخدم مسؤول",
    };
    
    updates[`/${orderRef.path}/status`] = newStatus;
    updates[`/${orderRef.path}/updatedAt`] = now;

    const newHistoryRef = push(ref(database, `${orderRef.path}/statusHistory`));
    updates[`/${orderRef.path}/statusHistory/${newHistoryRef.key}`] = newHistoryItem;

    if (courierId) {
      const selectedCourier = couriers.find(c => c.id === courierId);
      if(selectedCourier) {
        updates[`/${orderRef.path}/courierId`] = selectedCourier.id;
        updates[`/${orderRef.path}/courierName`] = selectedCourier.name;
      }
    }
    
    // 4. Execute all updates
    await update(ref(database), updates);

    toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: `${language === 'ar' ? 'تم تحديث حالة الطلب إلى' : 'Order status updated to'} ${newStatus}.`,
    });

    // 5. Reset state
    setIsNoteModalOpen(false);
    setIsCourierModalOpen(false);
    setNote("");
    setSelectedStatus(null);
    setSelectedCourierId(null);
    setCourierSearch("");
  }


  const handlePrint = () => {
    typeof window !== 'undefined' && window.print()
  }

  const isLoading = isLoadingOrder || isLoadingUsers;

  if (isLoading && !order) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <div className="print-hidden">
        <PageHeader title={language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على الطلب المطلوب.' : 'The requested order could not be found.'}</p>
        {orderError && <p className="text-destructive">{orderError.message}</p>}
      </div>
    );
  }

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
                                        <p className="text-xs text-muted-foreground">{courier.email}</p>
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
