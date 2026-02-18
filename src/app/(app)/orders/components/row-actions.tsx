
"use client";

import * as React from "react";
import { MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus, User, StatusHistoryItem, CommissionRule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ref, update, runTransaction } from "firebase/database";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDatabase, useCollection, useMemoFirebase, useUser as useAuthUser } from "@/firebase";

interface RowActionsProps {
  order: Order;
  onUpdate: () => void;
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    "تم الحجز": ["تم الارسال", "ملغي"],
    "تم الارسال": ["تم التسليم", "ملغي"],
    "تم التسليم": [],
    "ملغي": [],
};

export function RowActions({ order, onUpdate }: RowActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const database = useDatabase();
  const { user: authUser } = useAuthUser();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | undefined>(undefined);
  const [note, setNote] = React.useState("");
  const [courierSearch, setCourierSearch] = React.useState("");
  const [selectedCourierId, setSelectedCourierId] = React.useState<string | null>(order.courierId ?? null);
  
  const usersRef = useMemoFirebase(() => database ? ref(database, `users`) : null, [database]);
  const { data: users } = useCollection<User>(usersRef);
  
  const rulesRef = useMemoFirebase(() => database ? ref(database, `commission-rules`) : null, [database]);
  const { data: commissionRules } = useCollection<CommissionRule>(rulesRef);

  const couriers = React.useMemo(() => users?.filter(u => u.role === 'Courier') || [], [users]);
  const filteredCouriers = couriers.filter(c => c.name.toLowerCase().includes(courierSearch.toLowerCase()));
  
  const availableStatuses = (order && order.status && allowedTransitions[order.status]) ? allowedTransitions[order.status] : [];

  const handleOpenModal = () => {
    setSelectedStatus(undefined);
    setSelectedCourierId(order.courierId ?? null);
    setNote("");
    setCourierSearch("");
    setIsModalOpen(true);
  };
  
  const handleSaveStatusChange = async () => {
    if (!database || !authUser || !order.id) {
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'بيانات الطلب أو المستخدم غير مكتملة.' : 'Order or user data is incomplete.',
        });
        return;
    }

    if (!selectedStatus) {
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى اختيار حالة جديدة.' : 'Please select a new status.',
        });
        return;
    }
    
    if (!order.path) {
        console.error("Order path is missing, cannot update status.", order);
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ في التحديث' : "Update Error",
            description: language === 'ar' ? 'مسار الطلب مفقود، لا يمكن تحديث الحالة.' : "Order path is missing, cannot update status.",
        });
        return;
    }
    
    if (selectedStatus === 'ملغي' && order.status !== 'ملغي') {
        const productSaleUpdatePromises = (order.items || []).map(item => {
            if (!item.productId) {
                console.warn(`Cannot update sales count for item without a productId: ${item.productName}`);
                return Promise.resolve();
            }
            const productSalesRef = ref(database, `products/${item.productId}/salesCount`);
            return runTransaction(productSalesRef, (currentCount) => {
                const newCount = (currentCount || 0) - item.quantity;
                return newCount < 0 ? 0 : newCount;
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

    const orderRef = ref(database, `orders/${order.path}/${order.id}`);

    const selectedCourier = couriers.find(c => c.id === selectedCourierId);

    if (selectedStatus === "تم الارسال" && !selectedCourier) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار مندوب.' : 'Please select a courier.',
      });
      return;
    }
    
    let salesComm = order.salesCommission || 0;
    let deliveryComm = order.deliveryCommission || 0;

    if (selectedStatus === 'تم الارسال' && commissionRules) {
        const salesCommissionRule = commissionRules.find(r => r.id === 'sale');
        salesComm = salesCommissionRule?.amount || 0;
    } else if (selectedStatus === 'تم التسليم' && commissionRules) {
        const deliveryCommissionRule = commissionRules.find(r => r.id === 'delivery');
        deliveryComm = deliveryCommissionRule?.amount || 0;
    } else if (selectedStatus === 'ملغي') {
        salesComm = 0;
        deliveryComm = 0;
    }
    
    const currentHistory = (order.statusHistory && (Array.isArray(order.statusHistory) ? order.statusHistory : Object.values(order.statusHistory))) || [];

    const newHistoryItem: StatusHistoryItem = {
        status: selectedStatus,
        notes: note,
        createdAt: new Date().toISOString(),
        userName: authUser.name || "مستخدم مسؤول",
    };

    const updates: Partial<Order> = {
        status: selectedStatus,
        courierId: selectedCourier?.id ?? order.courierId,
        courierName: selectedCourier?.name ?? order.courierName,
        salesCommission: salesComm,
        deliveryCommission: deliveryComm,
        statusHistory: [...currentHistory, newHistoryItem],
        updatedAt: new Date().toISOString(),
    };
    
    await update(orderRef, updates);
    onUpdate();
    
    toast({
      title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
      description: `${language === 'ar' ? 'تم تحديث حالة الطلب إلى' : 'Order status updated to'} ${selectedStatus}.`,
    });
    
    setIsModalOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={!order.id}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{language === 'ar' ? 'الإجراءات' : 'Actions'}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
            {language === 'ar' ? 'نسخ رقم الطلب' : 'Copy Order ID'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>{language === 'ar' ? 'عرض التفاصيل' : 'View details'}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenModal} disabled={availableStatuses.length === 0}>
            {language === 'ar' ? 'تحديث الحالة' : 'Update status'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
            {language === 'ar' ? 'حذف الطلب' : 'Delete order'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تحديث حالة الطلب' : 'Update Order Status'}</DialogTitle>
                <DialogDescription>{language === 'ar' ? `تغيير حالة الطلب رقم ${order.id}` : `Change status for order ${order.id}`}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <Select value={selectedStatus} onValueChange={(val: OrderStatus) => setSelectedStatus(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? "اختر الحالة الجديدة" : "Select new status"} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedStatus === "تم الارسال" && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <h4 className="font-semibold text-sm">{language === 'ar' ? 'إسناد مندوب' : 'Assign Courier'}</h4>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder={language === 'ar' ? 'ابحث عن مندوب...' : 'Search for courier...'} 
                                className="pl-9"
                                value={courierSearch}
                                onChange={(e) => setCourierSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-32">
                            <div className="space-y-2 pr-2">
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
                                            <AvatarImage src={courier.avatarUrl} alt={courier.name} data-ai-hint="avatar" />
                                            <AvatarFallback>{courier.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm">
                                            <p className="font-medium">{courier.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
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
                <Button onClick={handleSaveStatusChange}>{language === 'ar' ? 'حفظ التغيير' : 'Save Change'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
