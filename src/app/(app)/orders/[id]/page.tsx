
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer, Search, Edit, History, Share2, Loader2, MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, Commission, ReceiptSettings, OrderEditHistoryItem, OrderStatusConfig, OrderItem } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatCurrency } from "@/lib/utils";
import { useDatabase, useUser as useAuthUser } from "@/firebase";
import { ref, update, runTransaction, get, push, child, set } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useCachedDoc } from "@/hooks/use-cached-doc";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import { Logo } from "@/components/icons/logo";
import { idbPut } from "@/lib/db";
import { syncEvents } from "@/lib/sync-events";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderForm } from "../new/order-form";
import { OrderEditHistory } from "../components/order-edit-history";
import { PendingOrdersList } from "../components/pending-orders-list";
import { ReceiptView } from "../components/receipt-view";


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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  const isMobile = useIsMobile();
  
  const { data: order, isLoading: isLoadingOrder, refetch } = useCachedDoc<Order>( 'orders', id );
  const { data: users, isLoading: isLoadingUsers } = useRealtimeCachedCollection<User>('users');
  const { data: receiptSettingsCollection, isLoading: isLoadingSettings } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');
  const { data: orderStatuses, isLoading: isLoadingStatuses } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  const [courierSearch, setCourierSearch] = React.useState("");
  const [selectedCourierId, setSelectedCourierId] = React.useState<string | null>(null);
  const [searchOrderId, setSearchOrderId] = React.useState("");
  const [isSharing, setIsSharing] = React.useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchOrderId.trim() && searchOrderId.trim() !== id) {
        router.push(`/orders/${searchOrderId.trim()}`);
    }
  };

  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier') || [], [users]);
  
  const receiptSettings = React.useMemo(() => {
    if (!receiptSettingsCollection || receiptSettingsCollection.length === 0) return null;
    return receiptSettingsCollection[0];
  }, [receiptSettingsCollection]);
  
  const canEditStatus = (authUser?.permissions?.orders?.editStatus) || authUser?.role === 'Admin';
  
  const isLoading = isLoadingOrder || isLoadingUsers || isLoadingSettings || isLoadingStatuses;

  const availableStatuses = React.useMemo(() => {
    if (!order || !canEditStatus || !orderStatuses?.length) return [];

    const currentStatusConfig = orderStatuses.find(s => s.name === order.status);
    if (!currentStatusConfig) return [];
    
    const available: Set<OrderStatus> = new Set();
    const nextLevel = currentStatusConfig.level + 1;
    
    orderStatuses.forEach(s => {
      if (s.level === nextLevel) {
        available.add(s.name as OrderStatus);
      }
      if (s.isGeneral) {
         if (s.name === 'ملغي') {
             const isCompleted = order.status === 'مكتمل';
             const canCancelCompleted = authUser?.permissions?.orders?.cancelCompleted || authUser?.role === 'Admin';
             const isAlreadyCancelled = order.status === 'ملغي';

             if (!isAlreadyCancelled) {
                 if (!isCompleted || canCancelCompleted) {
                     available.add(s.name as OrderStatus);
                 }
             }
         } else {
             const canBeMoved = !['مكتمل', 'ملغي'].includes(order.status);
             if (canBeMoved) {
                 available.add(s.name as OrderStatus);
             }
         }
      }
    });

    if (order.status === 'تم الشحن' || order.status === 'معلق') {
        const onHold = orderStatuses.find(s => s.name === 'معلق');
        const completed = orderStatuses.find(s => s.name === 'مكتمل');
        const shipped = orderStatuses.find(s => s.name === 'تم الشحن');

        if(order.status === 'تم الشحن' && onHold) available.add(onHold.name as OrderStatus);
        if(order.status === 'معلق' && shipped) available.add(shipped.name as OrderStatus);
        if (completed) available.add(completed.name as OrderStatus);
    }
    
    const uniqueStatuses = Array.from(available);
    uniqueStatuses.sort((a, b) => {
        const levelA = orderStatuses.find(s => s.name === a)?.level || 99;
        const levelB = orderStatuses.find(s => s.name === b)?.level || 99;
        return levelA - levelB;
    });

    return uniqueStatuses;
  }, [order, canEditStatus, orderStatuses, authUser]);
  
  const orderItems: OrderItem[] = order?.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal: number = orderItems.reduce((acc: number, item: OrderItem) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const totalItems: number = orderItems.reduce((acc: number, item: OrderItem) => acc + Number(item.quantity), 0);
  const totalWeight: number = orderItems.reduce((acc: number, item: OrderItem) => acc + ((Number(item.weight) || 0) * Number(item.quantity)), 0);
  const grandTotal = itemsSubtotal + Number(order?.shippingCost || 0);
  const formatCurrencyLocal = (value: number) => formatCurrency(value, language);

  if (isLoading && !order) return <OrderDetailsSkeleton />;
  if (!order && !isLoading) return <div className="p-8">Order Not Found</div>;
  if (!order) return <OrderDetailsSkeleton />;

  const isEditable = (order.status === 'تم التسجيل' || order.status === 'قيد التجهيز');
  const canEditOrder = isEditable && (authUser?.role === 'Admin' || authUser?.permissions?.orders?.edit);

  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(courierSearch.toLowerCase()) || 
    (c.phone1 && c.phone1.includes(courierSearch))
  );

  const handleStatusChangeRequest = (newStatus: OrderStatus) => {
    if (order && newStatus !== order.status) {
      setSelectedStatus(newStatus);
      if (newStatus === "تم الشحن") {
        setSelectedCourierId(order.courierId || null);
        setIsCourierModalOpen(true);
      } else {
        setIsNoteModalOpen(true);
      }
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus, noteText: string, courierId?: string | null) => {
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
                let finalNote = noteText;
                if (newStatus === "تم الشحن" && courierId) {
                    const selectedCourier = couriers.find(c => c.id === courierId);
                    if (selectedCourier) {
                        currentOrder.courierId = selectedCourier.id;
                        currentOrder.courierName = selectedCourier.name;
                        finalNote = noteText ? `${selectedCourier.name} - ${noteText}` : selectedCourier.name;
                    }
                }
                if (newHistoryKey) {
                    currentOrder.statusHistory[newHistoryKey] = { status: newStatus, notes: finalNote, createdAt: now, userName: currentUser, userId: authUser.id };
                }
                currentOrder.status = newStatus;
                currentOrder.updatedAt = now;
                if (commissionAmount !== 0) currentOrder.totalCommission = (currentOrder.totalCommission || 0) + commissionAmount;
            }
            return currentOrder;
        });
        refetch();
        setIsNoteModalOpen(false);
        setIsCourierModalOpen(false);
    } catch (e) { console.error(e); }
  }

  const handlePrint = () => { typeof window !== 'undefined' && window.print(); };

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

  return (
    <>
      <div className="print-hidden">
        <PageHeader title={`${language === 'ar' ? 'طلب' : 'Order'} ${order.id}`}>
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <Input placeholder={language === 'ar' ? 'ابحث عن طلب آخر' : 'Find another order'} value={searchOrderId} onChange={(e) => setSearchOrderId(e.target.value)} className="h-9 w-48" />
            <Button type="submit" variant="outline" size="icon" className="h-9 w-9"><Search className="h-4 w-4" /></Button>
          </form>
          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
          <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)} className="justify-start"><History className="me-2 h-4 w-4" />{language === 'ar' ? 'سجل التعديلات' : 'Edit History'}</Button>
          {canEditOrder && (
            <Button onClick={() => setIsEditModalOpen(true)}><Edit className="me-2 h-4 w-4" />{language === 'ar' ? 'تعديل' : 'Edit'}</Button>
          )}
          <Button variant="outline" onClick={() => setIsSharePreviewOpen(true)}><Share2 className="me-2 h-4 w-4" />{language === 'ar' ? 'مشاركة' : 'Share'}</Button>
          <Button onClick={handlePrint}><Printer className="me-2 h-4 w-4" />{language === 'ar' ? 'طباعة' : 'Print'}</Button>
        </PageHeader>

        <PendingOrdersList />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
             <Card>
                <CardHeader><CardTitle>{language === 'ar' ? 'منتجات الطلب' : 'Order Items'}</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                                <TableHead className="text-end">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-end">{formatCurrencyLocal(item.price)}</TableCell>
                                    <TableCell className="text-end">{formatCurrencyLocal(item.price * item.quantity)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrencyLocal(itemsSubtotal)}</span></div>
                        <div className="flex justify-between"><span>Shipping</span><span>{formatCurrencyLocal(order.shippingCost || 0)}</span></div>
                        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrencyLocal(grandTotal)}</span></div>
                    </div>
                </CardContent>
            </Card>
             <StatusHistoryTimeline history={order.statusHistory} />
          </div>
          <div className="space-y-8">
              <Card>
                  <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <StatusBadge status={order.status} />
                       <Select onValueChange={(val: OrderStatus) => handleStatusChangeRequest(val)} disabled={availableStatuses.length === 0}>
                          <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                          <SelectContent>{availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                      <p className="font-bold">{order.customerName}</p>
                      <p>{order.customerPhone1}</p>
                      <p className="opacity-70">{order.customerAddress}</p>
                  </CardContent>
              </Card>
          </div>
        </div>
        
        <Dialog open={isSharePreviewOpen} onOpenChange={setIsSharePreviewOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2"><DialogTitle>Receipt Preview</DialogTitle><DialogDescription>Verify before sharing.</DialogDescription></DialogHeader>
                <ScrollArea className="flex-1 px-6 bg-muted/30">
                    <div className="py-6 flex justify-center"><div ref={receiptRef} className="inline-block shadow-lg border bg-white scale-95 origin-top"><ReceiptView order={order} language={language} settings={receiptSettings} /></div></div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t bg-background">
                    <Button variant="outline" onClick={() => setIsSharePreviewOpen(false)}>Cancel</Button>
                    <Button onClick={executeSharing} disabled={isSharing}>{isSharing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}Confirm & Send</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}><DialogContent><DialogHeader><DialogTitle>Add Note</DialogTitle><DialogDescription>Add context to status change.</DialogDescription></DialogHeader><Textarea value={note} onChange={e => setNote(e.target.value)} /><DialogFooter><Button onClick={() => handleStatusUpdate(selectedStatus!, note)}>Save</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Edit Order</DialogTitle></DialogHeader><OrderForm orderToEdit={order} onSuccess={() => {setIsEditModalOpen(false); refetch();}} /></DialogContent></Dialog>
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit History</DialogTitle></DialogHeader><OrderEditHistory history={order.editHistory} /></DialogContent></Dialog>
      </div>
      <div className="receipt-container" aria-hidden="true"><div className="inline-block bg-white"><ReceiptView order={order} language={language} settings={receiptSettings} /></div></div>
    </>
  );
}
