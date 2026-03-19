
"use client";

import * as React from "react";
import { Logo } from '@/components/icons/logo';
import { format } from "date-fns";
import { useLanguage } from "@/components/language-provider";
import type { ReceiptSettings } from "@/lib/types";

interface ReceiptPreviewProps {
  settings: Partial<ReceiptSettings>;
}

const mockOrder = {
  id: "12345",
  createdAt: new Date().toISOString(),
  customerName: "محمد علي",
  facebookName: "Mohamed Ali Profile",
  customerPhone1: "01234567890",
  customerAddress: "123 شارع المثال، القاهرة",
  paymentMethod: "نقدي عند الاستلام",
  courierName: "عمر إبراهيم",
  moderatorName: "علي حسن",
  moderatorUsername: "ali.hassan",
  notes: "يرجى الاتصال قبل الوصول بـ 15 دقيقة، والتأكد من تغليف الجبن جيداً.",
  items: [
    { productName: "منتج تجريبي 1", quantity: 2, price: 50.00, weight: 0.5 },
    { productName: "منتج آخر طويل جداً", quantity: 1, price: 120.50, weight: 1.2 },
    { productName: "صنف ثالث", quantity: 5, price: 10.00, weight: 0.1 },
  ],
  shippingCost: 30.00,
};

const Hr = () => <hr className="border-t border-dashed border-border my-2" />;

export function ReceiptPreview({ settings }: ReceiptPreviewProps) {
  const { language } = useLanguage();

  const itemsSubtotal = mockOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = itemsSubtotal + mockOrder.shippingCost;
  const totalItems = mockOrder.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalWeight = mockOrder.items.reduce((acc, item) => acc + ((item.weight || 0) * item.quantity), 0);

  const logoSize = settings.logoSize || 100;

  return (
    <div 
      className="bg-card p-4 rounded-lg shadow-inner w-full max-w-[302px] mx-auto font-mono text-card-foreground text-xs leading-relaxed"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
        {settings.showLogo && (
            <div className="text-center mb-2">
            <div className="mx-auto" style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
                <Logo inverted />
            </div>
            {settings.headerText && <h2 className="font-bold text-base mt-2 break-words">{settings.headerText}</h2>}
            </div>
        )}
        <div className="space-y-0.5">
            {settings.showOrderId && <p className="text-xs break-words">{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} {mockOrder.id}</p>}
            {settings.showDate && <p className="text-xs break-words">{language === 'ar' ? 'التاريخ:' : 'Date:'} {format(new Date(mockOrder.createdAt), "dd/MM/yyyy HH:mm")}</p>}
        </div>
        
        {(settings.showOrderId || settings.showDate) && (settings.showCustomerName || settings.showFacebookName || settings.showCustomerPhone || settings.showCustomerAddress || settings.showPaymentMethod || settings.showCourierName || settings.showModeratorName || settings.showModeratorUsername) && <Hr />}
        
        <div className="space-y-0.5">
            {settings.showCustomerName && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'العميل:' : 'Customer:'} {mockOrder.customerName}</p>}
            {settings.showFacebookName && <p className="text-xs break-words">{language === 'ar' ? 'فيسبوك:' : 'Facebook:'} {mockOrder.facebookName}</p>}
            {settings.showCustomerPhone && <p className="text-xs break-words">{language === 'ar' ? 'الهاتف:' : 'Phone:'} {mockOrder.customerPhone1}</p>}
            {settings.showPaymentMethod && <p className="text-xs break-words">{language === 'ar' ? 'الدفع:' : 'Payment:'} {mockOrder.paymentMethod}</p>}
            {settings.showCustomerAddress && mockOrder.customerAddress && <p className="text-xs break-words text-start">{language === 'ar' ? 'العنوان:' : 'Address:'} {mockOrder.customerAddress}</p>}
        </div>
        
        {(settings.showCourierName && mockOrder.courierName || settings.showModeratorName && mockOrder.moderatorName || settings.showModeratorUsername && mockOrder.moderatorUsername) && (
            <>
                <Hr />
                <div className="space-y-0.5">
                    {settings.showModeratorName && mockOrder.moderatorName && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'الوسيط:' : 'Moderator:'} {mockOrder.moderatorName}</p>}
                    {settings.showModeratorUsername && mockOrder.moderatorUsername && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'الوسيط:' : 'Moderator:'} {mockOrder.moderatorUsername}</p>}
                    {settings.showCourierName && mockOrder.courierName && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'المندوب:' : 'Courier:'} {mockOrder.courierName}</p>}
                </div>
            </>
        )}

        {settings.showOrderNotes && mockOrder.notes && (
            <>
                <Hr />
                <div className="bg-muted/30 p-1.5 rounded-sm">
                    <p className="font-bold mb-0.5">{language === 'ar' ? 'ملاحظات الطلب:' : 'Order Notes:'}</p>
                    <p className="italic text-[10px] leading-tight">{mockOrder.notes}</p>
                </div>
            </>
        )}
        
        {(settings.showCustomerName || settings.showFacebookName || settings.showCustomerPhone || settings.showCustomerAddress || settings.showPaymentMethod || settings.showCourierName || settings.showModeratorName || settings.showModeratorUsername || settings.showOrderNotes) && <Hr />}
        
        <table className="w-full text-xs border-collapse">
            <thead>
            <tr className="font-bold">
                <td className="text-start pb-1">{language === 'ar' ? 'الصنف' : 'Item'}</td>
                {settings.showItemWeight && <td className="text-center pb-1">{language === 'ar' ? 'وزن' : 'Wt.'}</td>}
                <td className="text-center pb-1">{language === 'ar' ? 'كمية' : 'Qty'}</td>
                {settings.showItemPrice && <td className="text-end pb-1">{language === 'ar' ? 'سعر' : 'Price'}</td>}
                {settings.showItemSubtotal && <td className="text-end pb-1">{language === 'ar' ? 'إجمالي' : 'Total'}</td>}
            </tr>
            </thead>
            <tbody>
            {mockOrder.items.map((item, index) => (
                <tr key={index} className="align-top">
                <td className="text-start break-words w-2/5 pr-1 py-1">{item.productName}</td>
                {settings.showItemWeight && <td className="text-center px-1 py-1">{item.weight ? `${(item.weight * item.quantity).toFixed(2)}` : '-'}</td>}
                <td className="text-center px-1 py-1">{item.quantity}</td>
                {settings.showItemPrice && <td className="text-end px-1 py-1">{item.price.toFixed(0)}</td>}
                {settings.showItemSubtotal && <td className="text-end pl-1 py-1">{(item.price * item.quantity).toFixed(0)}</td>}
                </tr>
            ))}
            </tbody>
        </table>
        <Hr />
        <div className="space-y-1 text-xs">
            {settings.showItemsSubtotal && <div className="flex justify-between"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{itemsSubtotal.toFixed(0)}</span></div>}
            {settings.showShippingCost && <div className="flex justify-between"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{mockOrder.shippingCost.toFixed(0)}</span></div>}

            {(settings.showTotalItems || settings.showTotalWeight) && (settings.showItemsSubtotal || settings.showShippingCost) && <Hr />}

            {settings.showTotalItems && <div className="flex justify-between font-bold"><span>{language === 'ar' ? 'إجمالي القطع' : 'Total Items'}</span> <span>{totalItems}</span></div>}
            {settings.showTotalWeight && <div className="flex justify-between font-bold"><span>{language === 'ar' ? 'إجمالي الوزن' : 'Total Weight'}</span> <span>{totalWeight.toFixed(2)} kg</span></div>}
            
            {settings.showGrandTotal && <div className="flex justify-between font-bold text-sm pt-1"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span> <span>{total.toFixed(0)}</span></div>}
        </div>
        {(settings.showItemsSubtotal || settings.showShippingCost || settings.showGrandTotal) && <Hr />}
        {settings.footerText && <p className="text-center text-xs break-words">{settings.footerText}</p>}
        {settings.mandatoryFooterText && (
            <>
                {settings.footerText && <Hr />}
                <p className="text-center text-xs break-words font-semibold">{settings.mandatoryFooterText}</p>
            </>
        )}

        <div className="mt-4 text-center text-muted-foreground">
            <svg width="100%" height="20">
                <line x1="0" y1="10" x2="100%" y2="10" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="square"/>
            </svg>
        </div>
    </div>
  );
}
