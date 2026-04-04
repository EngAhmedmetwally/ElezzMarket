
"use client";

import * as React from "react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, ReceiptSettings, OrderStatusConfig, OrderItem, OrderEditHistoryItem } from "@/lib/types";
import { useDatabase, useUser as useAuthUser } from "@/firebase";
import { ref, update, runTransaction, get, push, child, set } from "firebase/database";
import { useCachedDoc } from "@/hooks/use-cached-doc";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { formatCurrency, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Printer, Share2, Loader2, MessageSquare, History, Edit, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { idbPut } from "@/lib/db";
import { syncEvents } from "@/lib/sync-events";
import { OrderEditHistory } from "./order-edit-history";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Logo } from "@/components/icons/logo";

interface OrderQuickViewProps {
  orderId: string;
  onClose: () => void;
}

function StatusHistoryTimeline({ history }: { history?: Record<string, StatusHistoryItem> }) {
    const { language } = useLanguage();
    const sortedHistory = React.useMemo(() => {
        if (!history) return [];
        return Object.entries(history)
            .map(([id, item]) => ({ ...item, id }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [history]);
    
    return (
        <Card className="border-none shadow-none bg-muted/30">
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'سجل الحالات' : 'Status History'}</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0">
                 {sortedHistory.length > 0 ? (
                    <div className="space-y-4">
                        {sortedHistory.map((item, index) => (
                            <div key={item.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-primary mt-1"></div>
                                    {index < sortedHistory.length - 1 && <div className="flex-1 w-px bg-border"></div>}
                                </div>
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
                                    {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{item.notes}</p>}
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

export function OrderQuickView({ orderId, onClose }: OrderQuickViewProps) {
  const { language } = useLanguage();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  const { data: order, isLoading: isLoadingOrder, refetch } = useCachedDoc<Order>('orders', orderId);
  const { data: users } = useRealtimeCachedCollection<User>('users');
  const { data: orderStatuses } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');
  const { data: receiptSettingsCollection } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  const [note, setNote] = React.useState("");
  const [isSharing, setIsSharing] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier') || [], [users]);
  const canEditStatus = (authUser?.permissions?.orders?.editStatus) || authUser?.role === 'Admin';
  const receiptSettings = receiptSettingsCollection?.[0] || null;

  const availableStatuses = React.useMemo(() => {
    if (!order || !canEditStatus || !orderStatuses?.length) return [];
    const currentStatusConfig = orderStatuses.find(s => s.name === order.status);
    if (!currentStatusConfig) return [];
    
    const available: Set<OrderStatus> = new Set();
    const nextLevel = currentStatusConfig.level + 1;
    
    orderStatuses.forEach(s => {
      if (s.level === nextLevel) available.add(s.name as OrderStatus);
      if (s.isGeneral) {
         if (s.name === 'ملغي') {
             const isCompleted = order.status === 'مكتمل';
             const canCancelCompleted = authUser?.permissions?.orders?.cancelCompleted || authUser?.role === 'Admin';
             if (order.status !== 'ملغي' && (!isCompleted || canCancelCompleted)) available.add(s.name as OrderStatus);
         } else if (!['مكتمل', 'ملغي'].includes(order.status)) {
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

  const handleStatusUpdate = async (newStatus: OrderStatus, noteText: string) => {
    if (!order || !database || !authUser) return;
    const orderRef = ref(database, order.path || `orders/${order.id}`);
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
            }
            return currentOrder;
        });
        refetch();
        setIsNoteModalOpen(false);
        setNote("");
    } catch (e) { console.error(e); }
  };

  const handlePrint = () => {
    // Hidden mechanism to trigger print from dialog
    window.print();
  };

  if (isLoadingOrder || !order) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const orderItems: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 pb-2 border-b flex justify-between items-center bg-muted/10">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                #{order.id}
                <StatusBadge status={order.status} className="ms-2" />
            </h2>
            <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "PPP p")}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsHistoryOpen(true)} title={language === 'ar' ? 'سجل التعديلات' : 'Edit History'}><History className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">✕</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Details */}
            <div className="md:col-span-8 space-y-6">
                <Card>
                    <CardHeader className="p-4 border-b bg-muted/20"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'الأصناف' : 'Items'}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-4 h-9 text-xs">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-end">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                                    <TableHead className="px-4 h-9 text-xs text-end">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderItems.map((item, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="px-4 py-2 text-sm">{item.productName}</TableCell>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{language === 'ar' ? 'بيانات العميل' : 'Customer'}</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 space-y-1.5 text-sm">
                            <p className="font-bold text-base">{order.customerName}</p>
                            {order.facebookName && <p className="text-xs flex items-center gap-1"><span className="opacity-70">FB:</span> {order.facebookName}</p>}
                            <p className="font-medium">{order.customerPhone1}</p>
                            <p className="text-xs opacity-80">{order.customerAddress}</p>
                            <p className="text-xs font-bold text-primary inline-block px-2 py-0.5 bg-primary/10 rounded mt-1">{order.zoning}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{language === 'ar' ? 'الموظفون' : 'Staff'}</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-sm">
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
                            <div className="text-xs pt-2">
                                <p className="opacity-70">Payment Method:</p>
                                <p className="font-medium">{order.paymentMethod}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right Column: Actions & Timeline */}
            <div className="md:col-span-4 space-y-6">
                <Card className="border-primary/20">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'تغيير الحالة' : 'Change Status'}</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Select onValueChange={(val: OrderStatus) => { setSelectedStatus(val); setIsNoteModalOpen(true); }} disabled={availableStatuses.length === 0}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={language === 'ar' ? "اختر حالة جديدة" : "Update status"} /></SelectTrigger>
                            <SelectContent>
                                {availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <StatusHistoryTimeline history={order.statusHistory} />

                {order.notes && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1 text-yellow-700 dark:text-yellow-400">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs font-bold">{language === 'ar' ? 'ملاحظات' : 'Notes'}</span>
                        </div>
                        <p className="text-xs italic">{order.notes}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}</DialogTitle></DialogHeader>
          <div className="py-4"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write note...'} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={() => selectedStatus && handleStatusUpdate(selectedStatus, note)}>{language === 'ar' ? 'تأكيد' : 'Confirm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجل تعديلات الطلب' : 'Edit History'}</DialogTitle>
            <DialogDescription>#{order.id}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <OrderEditHistory history={order.editHistory} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
