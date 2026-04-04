
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer, Search, Edit, History, Share2, Loader2, MessageSquare, Phone, Facebook, MapPin } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, ReceiptSettings, OrderStatusConfig, OrderItem } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { useDatabase, useUser as useAuthUser } from "@/firebase";
import { ref, runTransaction, get, push, child } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useCachedDoc } from "@/hooks/use-cached-doc";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
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

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();
  
  const { data: order, isLoading: isLoadingOrder, refetch } = useCachedDoc<Order>( 'orders', id );
  const { data: users } = useRealtimeCachedCollection<User>('users');
  const { data: receiptSettingsCollection } = useRealtimeCachedCollection<ReceiptSettings>('receipt-settings');
  const { data: orderStatuses } = useRealtimeCachedCollection<OrderStatusConfig>('order-statuses');

  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const receiptSettings = receiptSettingsCollection?.[0] || null;
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
             const canCancelCompleted = authUser?.permissions?.orders?.cancelCompleted || authUser?.role === 'Admin';
             if (order.status !== 'ملغي' && (order.status !== 'مكتمل' || canCancelCompleted)) available.add(s.name as OrderStatus);
         } else if (order.status !== 'مكتمل' && order.status !== 'ملغي') available.add(s.name as OrderStatus);
      }
    });
    return Array.from(available).sort((a,b) => (orderStatuses.find(s=>s.name===a)?.level||0) - (orderStatuses.find(s=>s.name===b)?.level||0));
  }, [order, canEditStatus, orderStatuses, authUser]);
  
  if (isLoadingOrder || !order) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const orderItems: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
  const itemsSubtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const canEditOrder = (order.status === 'تم التسجيل' || order.status === 'قيد التجهيز') && (authUser?.role === 'Admin' || authUser?.permissions?.orders?.edit);

  const handleStatusUpdate = async (newStatus: OrderStatus, noteText: string) => {
    if (!order || !database || !authUser) return;
    const orderRef = ref(database, order.path || `orders/${order.id}`);
    try {
        const now = new Date().toISOString();
        const commissionRulesSnap = await get(ref(database, 'commission-rules'));
        const commissionAmount = commissionRulesSnap.val()?.[newStatus]?.amount || 0;
        await runTransaction(orderRef, (current) => {
            if (current) {
                if (!current.statusHistory) current.statusHistory = {};
                const key = push(child(orderRef, 'statusHistory')).key;
                if (key) current.statusHistory[key] = { status: newStatus, notes: noteText, createdAt: now, userName: authUser.name || authUser.email || "System", userId: authUser.id };
                current.status = newStatus;
                current.updatedAt = now;
                if (commissionAmount !== 0) current.totalCommission = (current.totalCommission || 0) + commissionAmount;
            }
            return current;
        });
        refetch();
        setIsNoteModalOpen(false);
    } catch (e) { console.error(e); }
  }

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
      <div className="print-hidden space-y-8">
        <PageHeader title={`${language === 'ar' ? 'طلب' : 'Order'} ${order.id}`} />

        <PendingOrdersList />

        {/* Notes Section - Prominent */}
        {order.notes && (
            <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3 text-yellow-800 dark:text-yellow-400">
                        <MessageSquare className="h-6 w-6" />
                        <h3 className="text-lg font-bold">{language === 'ar' ? 'ملاحظات الطلب الهامة' : 'Important Order Notes'}</h3>
                    </div>
                    <p className="text-base font-medium leading-relaxed text-start">{order.notes}</p>
                </CardContent>
            </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
             <Card>
                <CardHeader><CardTitle>{language === 'ar' ? 'بيانات العميل بالكامل' : 'Full Customer Details'}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                            <p className="text-xl font-bold">{order.customerName}</p>
                        </div>
                        {order.facebookName && (
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'رابط/اسم فيسبوك' : 'Facebook'}</label>
                                <p className="flex items-center gap-2 font-medium text-blue-600">
                                    <Facebook className="h-4 w-4" /> {order.facebookName}
                                </p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'رقم الهاتف 1' : 'Phone 1'}</label>
                            <p className="flex items-center gap-2 text-lg font-bold">
                                <Phone className="h-4 w-4 text-green-600" /> {order.customerPhone1}
                            </p>
                        </div>
                        {order.customerPhone2 && (
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'رقم الهاتف 2' : 'Phone 2'}</label>
                                <p className="flex items-center gap-2 text-lg font-bold">
                                    <Phone className="h-4 w-4 text-green-600" /> {order.customerPhone2}
                                </p>
                            </div>
                        )}
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'العنوان بالتفصيل' : 'Address'}</label>
                            <p className="flex items-start gap-2 text-base font-medium bg-muted/30 p-3 rounded-lg border text-start">
                                <MapPin className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                                {order.customerAddress}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'المنطقة (Zoning)' : 'Zone'}</label>
                            <p className="inline-block px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-sm">
                                {order.zoning}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</label>
                            <p className="text-base font-bold">{order.paymentMethod}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                    <TableCell className="text-end">{formatCurrency(item.price, language)}</TableCell>
                                    <TableCell className="text-end">{formatCurrency(item.price * item.quantity, language)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span><span>{formatCurrency(itemsSubtotal, language)}</span></div>
                        <div className="flex justify-between"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span><span>{formatCurrency(order.shippingCost || 0, language)}</span></div>
                        <div className="flex justify-between font-bold text-lg text-primary border-t pt-2"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span><span>{formatCurrency(order.total, language)}</span></div>
                    </div>
                </CardContent>
            </Card>
             <StatusHistoryTimeline history={order.statusHistory} />
          </div>
          <div className="space-y-8">
              {/* Vertical Action Buttons */}
              <Card className="border-primary/20 bg-primary/5">
                  <CardHeader><CardTitle>{language === 'ar' ? 'الإجراءات' : 'Actions'}</CardTitle></CardHeader>
                  <CardContent className="flex flex-col gap-3">
                      <Button variant="outline" className="w-full justify-start h-11" onClick={() => setIsHistoryModalOpen(true)}>
                          <History className="me-2 h-4 w-4" />
                          {language === 'ar' ? 'سجل التعديلات' : 'Edit History'}
                      </Button>
                      {canEditOrder && (
                          <Button variant="outline" className="w-full justify-start h-11" onClick={() => setIsEditModalOpen(true)}>
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

              <Card>
                  <CardHeader><CardTitle>{language === 'ar' ? 'تغيير الحالة' : 'Change Status'}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <StatusBadge status={order.status} className="w-full text-center py-2" />
                       <Select onValueChange={(val: OrderStatus) => { setSelectedStatus(val); setIsNoteModalOpen(true); }} disabled={availableStatuses.length === 0}>
                          <SelectTrigger className="h-11"><SelectValue placeholder={language === 'ar' ? "اختر حالة جديدة" : "Update status"} /></SelectTrigger>
                          <SelectContent>{availableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>{language === 'ar' ? 'المسؤولين' : 'Personnel'}</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <div>
                          <p className="text-muted-foreground mb-1">{language === 'ar' ? 'الوسيط (Moderator)' : 'Moderator'}</p>
                          <p className="font-bold">{order.moderatorName}</p>
                      </div>
                      {order.courierName && (
                          <div>
                              <p className="text-muted-foreground mb-1">{language === 'ar' ? 'المندوب (Courier)' : 'Courier'}</p>
                              <p className="font-bold">{order.courierName}</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
        </div>
        
        <Dialog open={isSharePreviewOpen} onOpenChange={setIsSharePreviewOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2"><DialogTitle>{language === 'ar' ? 'معاينة الإيصال' : 'Receipt Preview'}</DialogTitle></DialogHeader>
                <ScrollArea className="flex-1 px-6 bg-muted/30">
                    <div className="py-6 flex justify-center"><div ref={receiptRef} className="inline-block shadow-lg border bg-white scale-95 origin-top"><ReceiptView order={order} language={language} settings={receiptSettings} /></div></div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t bg-background">
                    <Button variant="outline" onClick={() => setIsSharePreviewOpen(false)}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    <Button onClick={executeSharing} disabled={isSharing}>{isSharing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}{language === 'ar' ? 'تأكيد وإرسال' : 'Confirm & Send'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}><DialogContent><DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader><Textarea value={note} onChange={e => setNote(e.target.value)} /><DialogFooter><Button onClick={() => handleStatusUpdate(selectedStatus!, note)}>Save</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Edit Order</DialogTitle></DialogHeader><OrderForm orderToEdit={order} onSuccess={() => {setIsEditModalOpen(false); refetch();}} /></DialogContent></Dialog>
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit History</DialogTitle></DialogHeader><OrderEditHistory history={order.editHistory} /></DialogContent></Dialog>
      </div>
      <div className="receipt-container" aria-hidden="true"><div className="inline-block bg-white"><ReceiptView order={order} language={language} settings={receiptSettings} /></div></div>
    </>
  );
}
