
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { Printer, Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { Order, OrderStatus, StatusHistoryItem, User, CommissionRule } from "@/lib/types";
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
import { ref, update, runTransaction, get } from "firebase/database";
import { Skeleton } from "@/components/ui/skeleton";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    "تم الحجز": ["تم الارسال", "ملغي"],
    "تم الارسال": ["تم التسليم", "ملغي"],
    "تم التسليم": [],
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
  const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderRef);

  const usersRef = useMemoFirebase(() => database ? ref(database, `users`) : null, [database]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersRef);
  
  const rulesRef = useMemoFirebase(() => database ? ref(database, `commission-rules`) : null, [database]);
  const { data: commissionRules, isLoading: isLoadingRules } = useCollection<CommissionRule>(rulesRef);

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
      if (newStatus === "تم الارسال") {
        setIsCourierModalOpen(true);
      } else {
        setIsNoteModalOpen(true);
      }
    }
  };

  const handleSaveStatusChange = async () => {
    if (order && selectedStatus && database && authUser && orderRef) {

      if (selectedStatus === 'ملغي' && order.status !== 'ملغي') {
          const productSaleUpdatePromises = (order.items || []).map(item => {
              if (!item.productId) {
                  console.warn(`Cannot update sales count for item without a productId: ${item.productName}`);
                  return Promise.resolve();
              }
              const productSalesRef = ref(database, `products/${item.productId}/salesCount`);
              return runTransaction(productSalesRef, (currentCount) => {
                  const newCount = (currentCount || 0) - item.quantity;
                  return newCount < 0 ? 0 : newCount; // Prevent negative counts
              });
          });

          try {
              await Promise.all(productSaleUpdatePromises);
          } catch (error) {
              console.error("Failed to decrement product sales counts", error);
              toast({
                  variant: "destructive",
                  title: language === 'ar' ? 'خطأ في التحديث' : "Update Error",
                  description: language === 'ar' ? 'فشل تحديث إحصائيات مبيعات المنتج أثناء الإلغاء.' : "Failed to update product sales counts during cancellation.",
              });
          }
      }

      const newHistoryItem: StatusHistoryItem = {
        status: selectedStatus,
        notes: note,
        createdAt: new Date().toISOString(),
        userName: authUser.name || "مستخدم مسؤول",
      };
      
      let salesComm = order.salesCommission || 0;
      let deliveryComm = order.deliveryCommission || 0;

      if (selectedStatus === 'تم التسليم' && commissionRules) {
          const deliveryCommissionRule = commissionRules.find(r => r.id === 'delivery');
          deliveryComm = deliveryCommissionRule?.amount || 0;
      } else if (selectedStatus === 'ملغي') {
          salesComm = 0;
          deliveryComm = 0;
      }
      
      const currentHistory = order.statusHistory ? (Array.isArray(order.statusHistory) ? order.statusHistory : Object.values(order.statusHistory)) : [];

      const updates: Partial<Order> = {
        status: selectedStatus,
        salesCommission: salesComm,
        deliveryCommission: deliveryComm,
        statusHistory: [...currentHistory, newHistoryItem],
        updatedAt: new Date().toISOString(),
      };
      
      await update(orderRef, updates);

      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: `${language === 'ar' ? 'تم تحديث حالة الطلب إلى' : 'Order status updated to'} ${selectedStatus}.`,
      });
      
      setIsNoteModalOpen(false);
      setNote("");
      setSelectedStatus(null);
    }
  };

  const handleAssignCourierAndSave = async () => {
    const selectedCourier = couriers.find(c => c.id === selectedCourierId);
    if (order && selectedStatus && selectedCourier && database && authUser && orderRef) {
      const newHistoryItem: StatusHistoryItem = {
        status: selectedStatus,
        notes: note,
        createdAt: new Date().toISOString(),
        userName: authUser.name || "مستخدم مسؤول",
      };

      let salesComm = order.salesCommission || 0;

      if (selectedStatus === 'تم الارسال' && commissionRules) {
        const salesCommissionRule = commissionRules.find(r => r.id === 'sale');
        salesComm = salesCommissionRule?.amount || 0;
      }
      
      const currentHistory = order.statusHistory ? (Array.isArray(order.statusHistory) ? order.statusHistory : Object.values(order.statusHistory)) : [];

      const updates: Partial<Order> = {
        status: selectedStatus,
        courierId: selectedCourier.id,
        courierName: selectedCourier.name,
        salesCommission: salesComm,
        statusHistory: [...currentHistory, newHistoryItem],
        updatedAt: new Date().toISOString(),
      };

      await update(orderRef, updates);

      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: `${language === 'ar' ? `تم إسناد الطلب إلى المندوب ${selectedCourier.name}` : `Order assigned to courier ${selectedCourier.name}`}.`,
      });
      
      setIsCourierModalOpen(false);
      setNote("");
      setSelectedStatus(null);
      setSelectedCourierId(null);
      setCourierSearch("");
    } else {
       toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? `يرجى اختيار مندوب.` : `Please select a courier.`,
      });
    }
  }
  
  const isLoading = isLoadingOrder || isLoadingUsers || isLoadingRules;

  if (isLoading && !order) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <div>
        <PageHeader title={language === 'ar' ? 'الطلب غير موجود' : 'Order Not Found'} />
        <p>{language === 'ar' ? 'لم نتمكن من العثور على الطلب المطلوب.' : 'The requested order could not be found.'}</p>
      </div>
    );
  }

  const availableStatuses = allowedTransitions[order.status] || [];
  const orderItems = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];


  return (
    <>
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
                                  <TableHead className="text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                                  <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                                  <TableHead className="text-end">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                                  <TableHead className="text-end">{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {orderItems.map((item, index) => (
                                  <TableRow key={index}>
                                      <TableCell className="font-medium text-start">{item.productName}</TableCell>
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
                <Button onClick={handleSaveStatusChange}>{language === 'ar' ? 'حفظ التغيير' : 'Save Change'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isCourierModalOpen} onOpenChange={setIsCourierModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إسناد مندوب' : 'Assign Courier'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? 'اختر مندوبًا لإرسال هذا الطلب.' : 'Select a courier to ship this order.'}</DialogDescription>
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
                <Button onClick={handleAssignCourierAndSave}>{language === 'ar' ? 'تأكيد وحفظ' : 'Confirm & Save'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
