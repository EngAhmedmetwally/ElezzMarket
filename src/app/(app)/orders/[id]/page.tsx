
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer, Search, Edit, History, Share2, Loader2 } from "lucide-react";
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

  const orderItems: OrderItem[] = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal = orderItems.reduce((acc: number, item: OrderItem) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const totalItems = orderItems.reduce((acc: number, item: OrderItem) => acc + Number(item.quantity), 0);
  const totalWeight = orderItems.reduce((acc: number, item: OrderItem) => acc + ((Number(item.weight) || 0) * Number(item.quantity)), 0);
  const grandTotal = itemsSubtotal + Number(order.shippingCost || 0);

  const s = settings || {
      showLogo: true, headerText: language === 'ar' ? 'سوق العز' : 'ElEzz Market',
      showOrderId: true, showDate: true, showCustomerName: true, showFacebookName: true, showCustomerPhone: true, showCustomerAddress: true, showPaymentMethod: true,
      showItemWeight: false, showItemPrice: true, showItemSubtotal: true,
      showItemsSubtotal: true, showShippingCost: true, showGrandTotal: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      mandatoryFooterText: '',
      showCourierName: true,
      showModeratorName: false,
      showModeratorUsername: false,
      showTotalItems: true,
      showTotalWeight: true,
      logoSize: 100,
  };
  
  const formatCurrencyLocal = (value: any) => formatCurrency(value, language);
  const logoSize = s.logoSize || 100;

  return (
    <div className="receipt-thermal" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {s.showLogo && (
            <div className="receipt-thermal-header">
                <div className="mx-auto mb-2" style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
                    <Logo inverted />
                </div>
                {s.headerText && <h1 className="mt-2">{s.headerText}</h1>}
            </div>
        )}
        
        <div className="receipt-thermal-info">
             {s.showOrderId && <div className="info-item"><span>{language === 'ar' ? 'رقم الطلب' : 'Order'}:</span><span>{order.id}</span></div>}
             {s.showDate && <div className="info-item"><span>{language === 'ar' ? 'التاريخ' : 'Date'}:</span><span>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</span></div>}
        </div>

        <Hr />

        <div className="receipt-thermal-info">
             {s.showCustomerName && <div className="info-item"><span>{language === 'ar' ? 'العميل' : 'Cust'}:</span><span>{order.customerName}</span></div>}
             {s.showFacebookName && order.facebookName && <div className="info-item"><span>{language === 'ar' ? 'فيسبوك' : 'FB'}:</span><span>{order.facebookName}</span></div>}
             {s.showCustomerPhone && <div className="info-item"><span>{language === 'ar' ? 'الهاتف' : 'Phone'}:</span><span>{order.customerPhone1}</span></div>}
             {s.showPaymentMethod && order.paymentMethod && <div className="info-item"><span>{language === 'ar' ? 'الدفع' : 'Payment'}:</span><span>{order.paymentMethod}</span></div>}
             {s.showCustomerAddress && order.customerAddress && <p className="text-xs break-words pt-1 text-start">{order.customerAddress}</p>}
        </div>

        {(s.showCourierName && order.courierName || s.showModeratorName && order.moderatorName || s.showModeratorUsername && order.moderatorUsername) && (
            <>
                <Hr />
                <div className="receipt-thermal-info space-y-0.5">
                    {s.showModeratorName && order.moderatorName && <div className="info-item"><span>{language === 'ar' ? 'الوسيط' : 'Moderator'}:</span><span>{order.moderatorName}</span></div>}
                    {s.showModeratorUsername && order.moderatorUsername && <div className="info-item"><span>{language === 'ar' ? 'اسم الدخول' : 'Username'}:</span><span>{order.moderatorUsername}</span></div>}
                    {s.showCourierName && order.courierName && <div className="info-item"><span>{language === 'ar' ? 'المندوب' : 'Courier'}:</span><span>{order.courierName}</span></div>}
                </div>
            </>
        )}

        <table className="receipt-thermal-table">
            <thead>
                <tr>
                    <th className="item-name">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                    <th className="text-center">{language === 'ar' ? 'كمية' : 'Qty'}</th>
                    {s.showItemPrice && <th className="text-end">{language === 'ar' ? 'سعر' : 'Price'}</th>}
                    {s.showItemSubtotal && <th className="text-end">{language === 'ar' ? 'إجمالي' : 'Total'}</th>}
                </tr>
            </thead>
            <tbody>
                {orderItems.map((item: OrderItem, index) => (
                    <tr key={index}>
                        <td className="item-name">{item.productName}{s.showItemWeight && item.weight ? ` (${item.weight * item.quantity}kg)` : ''}</td>
                        <td className="text-center">{item.quantity}</td>
                        {s.showItemPrice && <td className="text-end">{formatCurrencyLocal(item.price)}</td>}
                        {s.showItemSubtotal && <td className="text-end">{formatCurrencyLocal(item.price * item.quantity)}</td>}
                    </tr>
                ))}
            </tbody>
        </table>

        <Hr />

        <div className="receipt-thermal-summary space-y-1">
            {s.showItemsSubtotal && <div className="summary-item"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{formatCurrencyLocal(itemsSubtotal)}</span></div>}
            {s.showShippingCost && <div className="summary-item"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{formatCurrencyLocal(order.shippingCost || 0)}</span></div>}
            
            {(s.showTotalItems || s.showTotalWeight) && (s.showItemsSubtotal || s.showShippingCost) && <Hr />}

            {s.showTotalItems && <div className="summary-item total"><span>{language === 'ar' ? 'إجمالي القطع' : 'Total Items'}</span> <span>{totalItems}</span></div>}
            {s.showTotalWeight && <div className="summary-item total"><span>{language === 'ar' ? 'إجمالي الوزن' : 'Total Weight'}</span> <span>{totalWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}</span></div>}

            {s.showGrandTotal && (s.showTotalItems || s.showTotalWeight) && <Hr />}
            
            {s.showGrandTotal && <div className="summary-item total"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span> <span>{formatCurrencyLocal(grandTotal)}</span></div>}
        </div>
        
        {s.footerText && (
            <>
                <Hr />
                <div className="receipt-thermal-footer">
                    <p>{s.footerText}</p>
                </div>
            </>
        )}
        {s.mandatoryFooterText && (
             <>
                <Hr />
                <div className="receipt-thermal-footer">
                    <p className="font-bold">{s.mandatoryFooterText}</p>
                </div>
            </>
        )}
    </div>
  );
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
      // Forward transitions
      if (s.level === nextLevel) {
        available.add(s.name as OrderStatus);
      }
      // General transitions (like Cancelled / ملغي)
      if (s.isGeneral) {
         if (s.name === 'ملغي') {
             // Logic for cancelling
             const isCompleted = order.status === 'مكتمل';
             const canCancelCompleted = authUser?.permissions?.orders?.cancelCompleted || authUser?.role === 'Admin';
             const isAlreadyCancelled = order.status === 'ملغي';

             if (!isAlreadyCancelled) {
                 if (!isCompleted || canCancelCompleted) {
                     available.add(s.name as OrderStatus);
                 }
             }
         } else {
             // Other general statuses
             const canBeMoved = !['مكتمل', 'ملغي'].includes(order.status);
             if (canBeMoved) {
                 available.add(s.name as OrderStatus);
             }
         }
      }
    });

    // Special cases for 'تم الشحن' and 'معلق' to allow moving between them and to 'مكتمل'
    if (order.status === 'تم الشحن' || order.status === 'معلق') {
        const onHold = orderStatuses.find(s => s.name === 'معلق');
        const completed = orderStatuses.find(s => s.name === 'مكتمل');
        const shipped = orderStatuses.find(s => s.name === 'تم الشحن');

        if(order.status === 'تم الشحن'){
            if (onHold) available.add(onHold.name as OrderStatus);
        }
        if(order.status === 'معلق'){
            if (shipped) available.add(shipped.name as OrderStatus);
        }
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

  if (isLoading && !order) {
    return <OrderDetailsSkeleton />;
  }

  if (!order && !isLoading) {
    return (
      <div className="print-hidden">
        <PageHeader title={language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على الطلب المطلوب.' : 'The requested order could not be found.'}</p>
      </div>
    );
  }

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
      // Always ask for a courier when moving to "Shipped", as it might change
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
        const currentUser = authUser.name || authUser.email || "مستخدم مسؤول";

        const commissionRulesSnap = await get(ref(database, 'commission-rules'));
        const commissionRules = commissionRulesSnap.val();
        const commissionAmount = commissionRules?.[newStatus]?.amount || 0;

        const transactionResult = await runTransaction(orderRef, (currentOrder) => {
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
                        userId: authUser.id,
                    };
                }

                currentOrder.status = newStatus;
                currentOrder.updatedAt = now;

                if (commissionAmount !== 0) {
                     currentOrder.totalCommission = (currentOrder.totalCommission || 0) + commissionAmount;
                }
            }
            return currentOrder;
        });

        if (transactionResult.committed) {
            const updatedOrder = transactionResult.snapshot.val();
           if (updatedOrder) {
               const orderToStore = { ...updatedOrder, path: order.path, id: order.id };
               await idbPut('orders', orderToStore);
               syncEvents.emit('synced', 'orders');
           }
       
           if (commissionAmount !== 0) {
               const latestOrder = transactionResult.snapshot.val();
               
               if (latestOrder && latestOrder.moderatorId) {
                   const recipientId = latestOrder.moderatorId;

                   const newCommission: Omit<Commission, 'id'> = {
                       orderId: order.id,
                       userId: recipientId,
                       orderStatus: newStatus,
                       amount: commissionAmount,
                       calculationDate: now,
                       paymentStatus: 'Calculated',
                   };
                   await set(push(ref(database, 'commissions')), newCommission);
               }
           }
           
           // Correctly handle sales count and weight on product level
           if (newStatus === 'ملغي' && order.status !== 'ملغي') {
               const productSaleUpdatePromises = (order.items || []).map((item: OrderItem) => {
                   if (!item.productId) return Promise.resolve();
                   const productRef = ref(database, `products/${item.productId}`);
                   return runTransaction(productRef, (currentProduct) => {
                       if (currentProduct) {
                           currentProduct.salesCount = (currentProduct.salesCount || 0) - item.quantity;
                           currentProduct.soldWeight = (currentProduct.soldWeight || 0) - ((item.weight || 0) * item.quantity);
                       }
                       return currentProduct;
                   });
               });
               await Promise.all(productSaleUpdatePromises);
           } else if (newStatus !== 'ملغي' && order.status === 'ملغي') {
                const productSaleUpdatePromises = (order.items || []).map((item: OrderItem) => {
                    if (!item.productId) return Promise.resolve();
                    const productRef = ref(database, `products/${item.productId}`);
                    return runTransaction(productRef, (currentProduct) => {
                        if (currentProduct) {
                            currentProduct.salesCount = (currentProduct.salesCount || 0) + item.quantity;
                            currentProduct.soldWeight = (currentProduct.soldWeight || 0) + ((item.weight || 0) * item.quantity);
                        }
                        return currentProduct;
                    });
                });
                await Promise.all(productSaleUpdatePromises);
           }

           toast({
               title: language === 'ar' ? 'تم تحديث الطلب' : 'Order Updated',
               description: language === 'ar' ? `تم تحديث حالة الطلب رقم ${order.id} إلى ${newStatus}.` : `Order #${order.id} status updated to ${newStatus}.`,
           });
       } else {
            toast({
               variant: "destructive",
               title: language === 'ar' ? 'فشل التحديث' : 'Update Failed',
               description: language === 'ar' ? 'لم يتم تحديث الطلب، ربما تم تعديله من قبل مستخدم آخر.' : 'The order was not updated, it may have been modified by another user.',
           });
       }

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

  const executeSharing = async () => {
    if (!receiptRef.current || !order) return;
    
    setIsSharing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Canvas to Blob failed");

      const file = new File([blob], `receipt-${order.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: language === 'ar' ? `إيصال طلب #${order.id}` : `Receipt for order #${order.id}`,
          text: language === 'ar' ? `إيصال طلب رقم ${order.id} من العز ماركت` : `Receipt for order #${order.id} from ElEzz Market`,
        });
      } else {
        const { saveAs } = await import('file-saver');
        saveAs(blob, `receipt-${order.id}.png`);
        toast({
          title: language === 'ar' ? 'تم حفظ الصورة' : 'Image Saved',
          description: language === 'ar' ? 'يمكنك الآن إرسالها يدوياً عبر واتساب.' : 'You can now send it manually via WhatsApp.',
        });
      }
      setIsSharePreviewOpen(false);
    } catch (error) {
      console.error('Error sharing receipt image:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ في المشاركة' : 'Sharing Error',
        description: language === 'ar' ? 'حدث خطأ أثناء إنشاء صورة الإيصال. يرجى المحاولة مرة أخرى.' : 'An error occurred while generating the receipt image. Please try again.',
      });
    } finally {
      setIsSharing(false);
    }
  }

  const handleShareClick = () => {
    setIsSharePreviewOpen(true);
  };

  return (
    <>
      <div className="print-hidden">
        <PageHeader title={`${language === 'ar' ? 'طلب' : 'Order'} ${order.id}`}>
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <Input
              placeholder={language === 'ar' ? 'ابحث عن طلب آخر' : 'Find another order'}
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              className="h-9 w-48"
            />
            <Button type="submit" variant="outline" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />
          <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)} className="w-full md:w-auto justify-start md:justify-center">
            <History className="me-2 h-4 w-4" />
            {language === 'ar' ? 'سجل التعديلات' : 'Edit History'}
          </Button>
          {canEditOrder && (
            <Button onClick={() => setIsEditModalOpen(true)} className="w-full md:w-auto justify-start md:justify-center">
              <Edit className="me-2 h-4 w-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
          )}
          <Button variant="outline" onClick={handleShareClick} className="w-full md:w-auto justify-start md:justify-center">
            <Share2 className="me-2 h-4 w-4" />
            {language === 'ar' ? 'مشاركة صورة' : 'Share Image'}
          </Button>
          <Button onClick={handlePrint} className="w-full md:w-auto justify-start md:justify-center">
            <Printer className="me-2 h-4 w-4" />
            {language === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
          </Button>
        </PageHeader>

        <PendingOrdersList />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'منتجات الطلب' : 'Order Items'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-4">
                            {orderItems.map((item: OrderItem, index: number) => (
                                <div key={index} className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium break-words text-start">{item.productName}</p>
                                        <p className="text-sm text-muted-foreground text-start">
                                            {formatCurrencyLocal(item.price)} x {item.quantity}
                                            {item.weight ? ` (${(item.weight * item.quantity).toFixed(2)} ${language === 'ar' ? 'كجم' : 'kg'})` : ''}
                                        </p>
                                    </div>
                                    <p className="font-medium text-end">{formatCurrencyLocal(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                    <TableHead className="text-center">{language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}</TableHead>
                                    <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                                    <TableHead className="text-end">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                                    <TableHead className="text-end">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderItems.map((item: OrderItem, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium text-start">{item.productName}</TableCell>
                                        <TableCell className="text-center">{item.weight ? (item.weight * item.quantity).toFixed(2) : '-'}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-end">{formatCurrencyLocal(item.price)}</TableCell>
                                        <TableCell className="text-end">{formatCurrencyLocal(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    <Separator className="my-4" />
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p>{language === 'ar' ? 'مجموع المنتجات' : 'Items Subtotal'}</p>
                            <p>{formatCurrencyLocal(itemsSubtotal)}</p>
                        </div>
                        <div className="flex justify-between">
                            <p>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping Cost'}</p>
                            <p>{formatCurrencyLocal(order.shippingCost || 0)}</p>
                        </div>
                         <div className="flex justify-between">
                            <p>{language === 'ar' ? 'إجمالي عدد القطع' : 'Total Items Count'}</p>
                            <p className="font-bold">{totalItems}</p>
                        </div>
                        <div className="flex justify-between">
                            <p>{language === 'ar' ? 'إجمالي الوزن (كجم)' : 'Total Weight (kg)'}</p>
                            <p className="font-bold">{totalWeight.toFixed(2)}</p>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                            <p>{language === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</p>
                            <p>{formatCurrencyLocal(grandTotal)}</p>
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
                          disabled={availableStatuses.length === 0}
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
                  <CardContent className="space-y-2 text-start">
                      <p className="font-medium">{order.customerName}</p>
                      {order.facebookName && <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'فيسبوك:' : 'Facebook:'}</span> {order.facebookName}</p>}
                      <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'موبايل 1:' : 'Phone 1:'}</span> {order.customerPhone1}</p>
                      {order.customerPhone2 && <p className="text-sm text-muted-foreground"><span className="font-medium">{language === 'ar' ? 'موبايل 2:' : 'Phone 2:'}</span> {order.customerPhone2}</p>}
                      <p className="text-sm text-muted-foreground">{order.customerAddress}</p>
                       <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المنطقة:' : 'Zoning:'} {order.zoning}</p>
                        {order.paymentMethod && <p className="text-sm font-medium">{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'} <span className="font-normal text-muted-foreground">{order.paymentMethod}</span></p>}
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle>{language === 'ar' ? 'الموظفون' : 'Staff'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-start">
                      <p className="text-sm"><span className="font-medium">{language === 'ar' ? 'الوسيط:' : 'Moderator:'}</span> {order.moderatorName}</p>
                      {order.courierName && <p className="text-sm"><span className="font-medium">{language === 'ar' ? 'المندوب:' : 'Courier:'}</span> {order.courierName}</p>}
                  </CardContent>
              </Card>
          </div>
        </div>
        
        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
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
            <DialogContent 
                className="sm:max-w-md"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
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
                                    <div className="text-start">
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
         <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent 
                className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'تعديل الطلب رقم' : 'Edit Order #'} {order.id}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <OrderForm 
                        orderToEdit={order} 
                        onSuccess={() => {
                            setIsEditModalOpen(false);
                            refetch();
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
            <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'سجل تعديلات الطلب' : 'Order Edit History'}</DialogTitle>
                    <DialogDescription>#{order.id}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <OrderEditHistory history={order.editHistory} />
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isSharePreviewOpen} onOpenChange={setIsSharePreviewOpen}>
            <DialogContent 
                className="sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{language === 'ar' ? 'معاينة الإيصال قبل المشاركة' : 'Receipt Preview before Sharing'}</DialogTitle>
                    <DialogDescription>{language === 'ar' ? 'تأكد من البيانات قبل إرسال الصورة.' : 'Verify the data before sending the image.'}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6 bg-muted/30">
                    <div className="py-6 flex justify-center">
                        <div ref={receiptRef} className="inline-block shadow-lg border bg-white scale-95 origin-top">
                            {order && <ReceiptView order={order} language={language} settings={receiptSettings} />}
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 border-t bg-background">
                    <DialogClose asChild>
                        <Button variant="outline">{language === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                    </DialogClose>
                    <Button onClick={executeSharing} disabled={isSharing}>
                        {isSharing ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Share2 className="me-2 h-4 w-4" />
                        )}
                        {language === 'ar' ? 'تأكيد وإرسال' : 'Confirm & Send'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="receipt-container" aria-hidden="true">
        <div className="inline-block bg-white">
            {order && <ReceiptView order={order} language={language} settings={receiptSettings} />}
        </div>
      </div>
    </>
  );
}
