
"use client";

import * as React from "react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, ReceiptSettings, OrderStatusConfig, OrderItem } from "@/lib/types";
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
import { Search, Printer, Share2, Loader2, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { idbPut } from "@/lib/db";
import { syncEvents } from "@/lib/sync-events";

interface OrderQuickViewProps {
  orderId: string;
  onClose: () => void;
}

export function OrderQuickView({ orderId, onClose }: OrderQuickViewProps) {
  const { language } = useLanguage();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  const { data: order, isLoading: isLoadingOrder, refetch } = useCachedDoc<Order>('orders', orderId);
  const { data: users } = useRealtimeCachedCollection<User>('users');
  const { data: orderStatuses } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  const [note, setNote] = React.useState("");

  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier') || [], [users]);
  const canEditStatus = (authUser?.permissions?.orders?.editStatus) || authUser?.role === 'Admin';

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

  if (isLoadingOrder || !order) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const orderItems: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});

  return (
    <ScrollArea className="max-h-[80vh] px-1">
      <div className="space-y-6 py-4">
        <div className="flex justify-between items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">#{order.id}</h2>
            <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "PPP p")}</p>
          </div>
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="p-4"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'بيانات العميل' : 'Customer'}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-1 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">{order.customerPhone1}</p>
                <p className="text-muted-foreground">{order.customerAddress}</p>
                <p className="text-xs text-primary font-bold mt-2">{order.zoning}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'تغيير الحالة' : 'Update Status'}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                <Select onValueChange={(val: OrderStatus) => { setSelectedStatus(val); setIsNoteModalOpen(true); }} disabled={availableStatuses.length === 0}>
                  <SelectTrigger><SelectValue placeholder={language === 'ar' ? "اختر حالة جديدة" : "Update status"} /></SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="p-4"><CardTitle className="text-sm font-bold">{language === 'ar' ? 'الأصناف' : 'Items'}</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {orderItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-dashed pb-1 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price, language)}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(item.price * item.quantity, language)}</p>
                </div>
              ))}
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-sm"><span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span><span>{formatCurrency(order.shippingCost || 0, language)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-1"><span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span><span className="text-primary">{formatCurrency(order.total, language)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {order.notes && (
          <div className="p-3 bg-muted rounded-lg border-l-4 border-primary flex gap-2">
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm italic">{order.notes}</p>
          </div>
        )}

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
      </div>
    </ScrollArea>
  );
}
