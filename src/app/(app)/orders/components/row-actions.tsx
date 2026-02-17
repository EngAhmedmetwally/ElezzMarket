
"use client";

import * as React from "react";
import { MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderStatus, User, StatusHistoryItem } from "@/lib/types";
import { mockUsers, mockOrders, mockCommissionRules } from "@/lib/data";
import { cn } from "@/lib/utils";

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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // State for the modal form
  const [selectedStatus, setSelectedStatus] = React.useState<OrderStatus | undefined>(undefined);
  const [note, setNote] = React.useState("");
  const [courierSearch, setCourierSearch] = React.useState("");
  const [selectedCourierId, setSelectedCourierId] = React.useState<string | null>(order.courierId ?? null);
  
  const [couriers] = React.useState<User[]>(() => mockUsers.filter(u => u.role === 'Courier'));
  const filteredCouriers = couriers.filter(c => c.name.toLowerCase().includes(courierSearch.toLowerCase()));
  
  const availableStatuses = allowedTransitions[order.status] || [];

  const handleOpenModal = () => {
    // Reset state when opening
    setSelectedStatus(undefined);
    setSelectedCourierId(order.courierId ?? null);
    setNote("");
    setCourierSearch("");
    setIsModalOpen(true);
  };
  
  const handleSaveStatusChange = () => {
    const orderIndex = mockOrders.findIndex(o => o.id === order.id);
    if (orderIndex === -1) {
        toast({ variant: "destructive", title: "Error", description: "Order not found." });
        return;
    }
    const currentOrder = mockOrders[orderIndex];

    const selectedCourier = couriers.find(c => c.id === selectedCourierId);

    if (!selectedStatus) {
        toast({
            variant: "destructive",
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' ? 'يرجى اختيار حالة جديدة.' : 'Please select a new status.',
        });
        return;
    }

    if (selectedStatus === "تم الارسال" && !selectedCourier) {
      toast({
        variant: "destructive",
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار مندوب.' : 'Please select a courier.',
      });
      return;
    }
    
    let salesComm = currentOrder.salesCommission || 0;
    let deliveryComm = currentOrder.deliveryCommission || 0;

    if (selectedStatus === 'تم الارسال') {
        const salesCommissionRule = mockCommissionRules.find(r => r.type === 'بيع');
        salesComm = salesCommissionRule?.amount || 0;
    } else if (selectedStatus === 'تم التسليم') {
        const deliveryCommissionRule = mockCommissionRules.find(r => r.type === 'تسليم');
        deliveryComm = deliveryCommissionRule?.amount || 0;
    } else if (selectedStatus === 'ملغي') {
        salesComm = 0;
        deliveryComm = 0;
    }

    const newHistoryItem: StatusHistoryItem = {
        status: selectedStatus,
        notes: note,
        createdAt: new Date().toISOString(),
        userName: "مستخدم مسؤول", // Hardcoded user
    };

    const updatedOrder: Order = {
        ...currentOrder,
        status: selectedStatus,
        courierId: selectedCourier?.id ?? currentOrder.courierId,
        courierName: selectedCourier?.name ?? currentOrder.courierName,
        salesCommission: salesComm,
        deliveryCommission: deliveryComm,
        statusHistory: [newHistoryItem, ...currentOrder.statusHistory],
        updatedAt: new Date().toISOString(),
    };
    
    mockOrders[orderIndex] = updatedOrder;
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
          <Button variant="ghost" className="h-8 w-8 p-0">
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
