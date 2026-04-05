
"use client";

import * as React from "react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, ReceiptSettings, OrderStatusConfig, OrderItem } from "@/lib/types";
import { useDatabase, useUser as useAuthUser } from "@/firebase";
import { ref, runTransaction, get, push, child } from "firebase/database";
import { useCachedDoc } from "@/hooks/use-cached-doc";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Printer, Share2, Loader2, MessageSquare, History, Edit, Truck, Phone, Facebook, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderEditHistory } from "./order-edit-history";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReceiptView } from "./receipt-view";
import { OrderForm } from "../new/order-form";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

function StatusHistoryTimeline({ history }: { history?: Record<string, StatusHistoryItem> }) {
    const { language } = useLanguage();
    const sortedHistory = React.useMemo(() => {
        if (!history) return [];
        return Object.entries(history)
            .map(([id, item]) => ({ ...item, id }))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [history]);
    
    return (
        <Card className="border-none shadow-none bg-muted/30">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'سجل الحالات' : 'Status History'}</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
                 {sortedHistory.length > 0 ? (
                    <div className="relative space-y-4 before:absolute before:inset-y-0 before:left-1 before:w-0.5 before:bg-border rtl:before:left-auto rtl:before:right-1">
                        {sortedHistory.map((item, index) => (
                            <div key={item.id} className="relative ps-6 rtl:ps-0 rtl:pe-6">
                                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-primary z-10 rtl:left-auto rtl:right-0"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={item.status} className="h-5 text-[10px]" />
                                            <span className="text-xs font-medium truncate max-w-[100px]">{item.userName}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {format(new Date(item.createdAt), "dd/MM HH:mm")}
                                        </span>
                                    </div>
                                    {item.notes && <p className="text-[11px] text-muted-foreground mt-1 italic bg-white/50 p-1.5 rounded border border-dashed text-start">{item.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'لا يوجد سجل.' : 'No history.'}</p>
                )}
            </CardContent>
        </Card>
    )
}

export function OrderQuickView({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  const { data: order, isLoading: isLoadingOrder, refetch } = useCachedDoc<Order>('orders', orderId);
  const { data: users } = useRealtimeCachedCollection<User>('users');
  const { data: orderStatuses } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');
  const { data: receiptSettingsCollection } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  const [selectedCourierId, setSelectedCourierId] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [isSharing, setIsSharing] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = React.useState(false);
  
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier' && u.status === 'نشط') || [], [users]);
  const canEditStatus = (authUser?.permissions?.orders?.editStatus) || authUser?.role === 'Admin';
  const receiptSettings = receiptSettingsCollection?.[0] || null;

  const availableStatuses = React.useMemo(() => {
    if (!order || !canEditStatus || !orderStatuses?.length) return [];
    const currentStatusConfig = orderStatuses.find(s => s.name === order.status);
    if (!currentStatusConfig) return [];
    
    const available: Set<OrderStatus> = new Set();
    const currentLevel = currentStatusConfig.level;
    
    orderStatuses.forEach(s => {
      if (s.level > currentLevel) {
          available.add(s.name as OrderStatus);
      }
      
      if (s.isGeneral && s.name !== order.status) {
         if (s.name === 'ملغي') {
             const canCancelCompleted = authUser?.permissions?.orders?.cancelCompleted || authUser?.role === 'Admin';
             if (order.status !== 'مكتمل' || canCancelCompleted) {
                 available.add(s.name as OrderStatus);
             }
         } else {
             available.add(s.name as OrderStatus);
         }
      }
    });
    
    return Array.from(available).sort((a, b) => {
        const levelA = orderStatuses.find(s => s.name === a)?.level || 99;
        const levelB = orderStatuses.find(s => s.name === b)?.level || 99;
        return levelA - levelB;
    });
  }, [order, canEditStatus, orderStatuses, authUser]);

  const handleStatusUpdate = async (newStatus: OrderStatus, noteText: string, courierId?: string) => {
    if (!order || !database || !authUser) return;

    if (newStatus === 'تم الشحن' && !courierId) {
        toast({ variant: 'destructive', title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'يجب اختيار المندوب' : 'Courier required' });
        return;
    }

    const orderRef = ref(database, order.path || `orders/${order.id}`);
    const selectedCourier = courierId ? couriers.find(c => c.id === courierId) : null;

    try {
        const now = new Date().toISOString();
        const currentUser = authUser.name || authUser.email || "System";
        const commissionRulesSnap = await get(ref(database, 'commission-rules'));
        const commissionAmount = commissionRulesSnap.val()?.[newStatus]?.amount || 0;

        await runTransaction(orderRef, (currentOrder) => {
            if (currentOrder) {
                if (!currentOrder.statusHistory) currentOrder.statusHistory = {};
                const newHistoryKey = push(child(orderRef, 'statusHistory')).key;
                if (newHistoryKey) {
                    currentOrder.statusHistory[newHistoryKey] = {
                        status: newStatus,
                        notes: noteText,
                        createdAt: now,
                        userName: currentUser,
                        userId: authUser.id,
                    };
                }
                currentOrder.status = newStatus;
                currentOrder.updatedAt = now;
                if (commissionAmount !== 0) currentOrder.totalCommission = (currentOrder.totalCommission || 0) + commissionAmount;
                
                if (newStatus === 'تم الشحن' && selectedCourier) {
                    currentOrder.courierId = selectedCourier.id;
                    currentOrder.courierName = selectedCourier.name;
                }
            }
            return currentOrder;
        });
        
        toast({ title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated' });
        refetch();
        setIsNoteModalOpen(false);
        setNote("");
        setSelectedCourierId("");
    } catch (e: any) { 
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const executeSharing = async () => {
    if (!receiptRef.current || !order) return;
    setIsSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], `receipt-${order.id}.png`, { type: 'image/png' });
        if (navigator.share) await navigator.share({ files: [file] });
        else { const { saveAs } = await import('file-saver'); saveAs(blob, `receipt-${order.id}.png`); }
      }
      setIsSharePreviewOpen(false);
    } catch (error) { console.error(error); } finally { setIsSharing(false); }
  }

  if (isLoadingOrder || !order) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const orderItems: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
  
  const canEditOrder = (order.status !== 'مكتمل' && order.status !== 'ملغي') && (authUser?.role === 'Admin' || authUser?.permissions?.orders?.edit);

  return (
    <div className="flex flex-col h-[90vh] bg-background relative overflow-hidden">
      <div className="p-6 pb-4 border-b flex justify-between items-center bg-muted/10 shrink-0">
        <div className="text-start">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                #{order.id}
                <StatusBadge status={order.status} className="ms-2" />
            </h2>
            <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "PPP p")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">✕</Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {order.notes && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 rounded-lg shadow-sm text-start">
                <div className="flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-400">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-bold text-sm">{language === 'ar' ? 'ملاحظات الطلب الهامة:' : 'Important Order Notes:'}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{order.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-6">
                <Card>
                    <CardHeader className="p-4 border-b bg-muted/20"><CardTitle className="text-sm font-bold text-start">{language === 'ar' ? 'بيانات العميل بالكامل' : 'Full Customer Details'}</CardTitle></CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-1 text-start">
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</p>
                                <p className="font-bold text-lg">{order.customerName}</p>
                            </div>
                            {order.facebookName && (
                                <div className="space-y-1 text-start">
                                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'حساب فيسبوك' : 'Facebook Name'}</p>
                                    <p className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                                        <Facebook className="h-4 w-4" />
                                        {order.facebookName}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-1 text-start">
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الهاتف 1' : 'Phone 1'}</p>
                                <p className="flex items-center gap-2 font-bold text-base">
                                    <Phone className="h-4 w-4 text-green-600" />
                                    {order.customerPhone1}
                                </p>
                            </div>
                            {order.customerPhone2 && (
                                <div className="space-y-1 text-start">
                                    <p className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الهاتف 2' : 'Phone 2'}</p>
                                    <p className="flex items-center gap-2 font-bold text-base">
                                        <Phone className="h-4 w-4 text-green-600" />
                                        {order.customerPhone2}
                                    </p>
                                </div>
                            )}
                            <div className="sm:col-span-2 space-y-1 text-start">
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'العنوان التفصيلي' : 'Full Address'}</p>
                                <p className="flex items-start gap-2 font-medium bg-muted/50 p-2 rounded border">
                                    <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
                                    {order.customerAddress}
                                </p>
                            </div>
                            <div className="space-y-1 text-start">
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المنطقة' : 'Zoning'}</p>
                                <p className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                                    {order.zoning}
                                </p>
                            </div>
                            <div className="space-y-1 text-start">
                                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</p>
                                <p className="font-bold">{order.paymentMethod}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 border-b bg-muted/20"><CardTitle className="text-sm font-bold text-start">{language === 'ar' ? 'الأصناف' : 'Items'}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-4 h-9 text-xs text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-end">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderItems.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="px-4 py-2 text-sm text-start">{item.productName}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm text-center">{item.quantity}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm text-end">{formatCurrency(item.price, language)}</TableCell>
                                        <TableCell className="px-4 py-2 text-sm text-end font-medium">{formatCurrency(item.price * item.quantity, language)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 bg-muted/5 space-y-2 text-sm border-t">
                            <div className="flex justify-between"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span><span>{formatCurrency(orderItems.reduce((a, b) => a + (b.price * b.quantity), 0), language)}</span></div>
                            <div className="flex justify-between"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span><span>{formatCurrency(order.shippingCost || 0, language)}</span></div>
                            <Separator className="my-1" />
                            <div className="flex justify-between font-bold text-lg text-primary">
                                <span>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</span>
                                <span>{formatCurrency(order.total, language)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-4 space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-bold text-start">{language === 'ar' ? 'الإجراءات' : 'Actions'}</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2 flex flex-col gap-3">
                        <Button variant="outline" className="w-full justify-start h-11" onClick={() => setIsHistoryOpen(true)}>
                            <History className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'سجل التعديلات' : 'Edit History'}
                        </Button>
                        {canEditOrder && (
                            <Button variant="outline" className="w-full justify-start h-11" onClick={() => setIsEditOpen(true)}>
                                <Edit className="me-2 h-4 w-4" />
                                {language === 'ar' ? 'تعديل البيانات' : 'Edit Order'}
                            </Button>
                        )}
                        <Button variant="outline" className="w-full justify-start h-11" onClick={() => setIsSharePreviewOpen(true)}>
                            <Share2 className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'مشاركة كصورة' : 'Share Image'}
                        </Button>
                        <Button variant="default" className="w-full justify-start h-11" onClick={() => window.print()}>
                            <Printer className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'طباعة الفاتورة' : 'Print Receipt'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/20">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-bold text-start">{language === 'ar' ? 'تغيير الحالة' : 'Change Status'}</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Select onValueChange={(val: OrderStatus) => { setSelectedStatus(val); setIsNoteModalOpen(true); }} disabled={availableStatuses.length === 0}>
                            <SelectTrigger className="w-full h-11"><SelectValue placeholder={language === 'ar' ? "اختر حالة جديدة" : "Update status"} /></SelectTrigger>
                            <SelectContent>
                                {availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-start">{language === 'ar' ? 'الموظفون' : 'Staff'}</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3 text-sm text-start">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarFallback>{order.moderatorName.charAt(0)}</AvatarFallback></Avatar>
                            <span className="text-xs">Moderator: <span className="font-bold">{order.moderatorName}</span></span>
                        </div>
                        {order.courierName && (
                            <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-primary" />
                                <span className="text-xs">Courier: <span className="font-bold">{order.courierName}</span></span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <StatusHistoryTimeline history={order.statusHistory} />
            </div>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تحديث حالة الطلب' : 'Update Status'}</DialogTitle>
            <DialogDescription>
                {language === 'ar' ? `تغيير الحالة إلى: ${selectedStatus}` : `Changing status to: ${selectedStatus}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStatus === 'تم الشحن' && (
                <div className="space-y-2 text-start">
                    <Label>{language === 'ar' ? 'اختر المندوب' : 'Select Courier'}</Label>
                    <Select onValueChange={setSelectedCourierId} value={selectedCourierId}>
                        <SelectTrigger>
                            <SelectValue placeholder={language === 'ar' ? 'اختر المندوب المسؤول' : 'Choose a courier'} />
                        </SelectTrigger>
                        <SelectContent>
                            {couriers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-2 text-start">
                <Label>{language === 'ar' ? 'ملاحظة (اختياري)' : 'Note (Optional)'}</Label>
                <Textarea 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                    placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write note...'} 
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsNoteModalOpen(false); setNote(""); setSelectedCourierId(""); }}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button 
                disabled={selectedStatus === 'تم الشحن' && !selectedCourierId} 
                onClick={() => selectedStatus && handleStatusUpdate(selectedStatus, note, selectedCourierId)}
            >
                {language === 'ar' ? 'تأكيد وحفظ' : 'Confirm & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجل تعديلات الطلب' : 'Edit History'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <OrderEditHistory history={order.editHistory} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الطلب' : 'Edit Order'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <OrderForm orderToEdit={order} onSuccess={() => { setIsEditOpen(false); refetch(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSharePreviewOpen} onOpenChange={setIsSharePreviewOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{language === 'ar' ? 'معاينة الإيصال' : 'Receipt Preview'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6 bg-muted/30">
                    <div className="py-6 flex justify-center">
                        <div ref={receiptRef} className="inline-block shadow-lg border bg-white scale-95 origin-top">
                            <ReceiptView order={order} language={language} settings={receiptSettings} />
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t bg-background">
                    <Button variant="outline" onClick={() => setIsSharePreviewOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    <Button onClick={executeSharing} disabled={isSharing}>
                        {isSharing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Share2 className="me-2 h-4 w-4" />}
                        {language === 'ar' ? 'تأكيد وإرسال' : 'Confirm & Send'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="receipt-container" aria-hidden="true">
        <div className="inline-block bg-white">
            <ReceiptView order={order} language={language} settings={receiptSettings} />
        </div>
      </div>
    </div>
  );
}
